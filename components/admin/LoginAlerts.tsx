"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LogIn, UserPlus, X } from 'lucide-react';
import { api } from '@/api/api';

// Admin-panel popup: "<customer> just logged in". Polls
// GET /users/recent-logins, which returns customers whose lastLoginAt is
// after `since`. The first poll sends no `since` and only takes the server's
// clock, so opening the panel never replays older logins; each later poll
// uses the previous response's serverTime, so the admin's own clock never
// matters.

const POLL_MS = 15_000;
const AUTO_DISMISS_MS = 12_000;
const MAX_VISIBLE = 3;
// Account created within this long of the login = a first-time signup.
const NEW_SIGNUP_WINDOW_MS = 2 * 60 * 1000;

type RecentLogin = {
    _id: string;
    name?: string;
    mobile: string;
    email?: string;
    lastLoginAt: string;
    createdAt?: string;
};

type Alert = RecentLogin & { key: string; isNew: boolean };

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).toUpperCase();

export function LoginAlerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const sinceRef = useRef<string | null>(null);
    const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

    const dismiss = (key: string) => {
        setAlerts(prev => prev.filter(a => a.key !== key));
        const t = timersRef.current.get(key);
        if (t) clearTimeout(t);
        timersRef.current.delete(key);
    };

    useEffect(() => {
        let cancelled = false;
        const timers = timersRef.current;

        const poll = async () => {
            // Background tabs skip polls; `since` is kept, so the next
            // visible poll still picks up anything missed (up to the
            // server's one-hour window).
            if (document.visibilityState !== 'visible') return;
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const { data } = await api.get('/users/recent-logins', {
                    params: sinceRef.current ? { since: sinceRef.current } : {},
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (cancelled) return;
                sinceRef.current = data?.serverTime ?? sinceRef.current;

                const fresh: Alert[] = (data?.logins || []).map((l: RecentLogin) => ({
                    ...l,
                    key: `${l._id}-${l.lastLoginAt}`,
                    isNew: !!l.createdAt &&
                        Math.abs(new Date(l.lastLoginAt).getTime() - new Date(l.createdAt).getTime()) < NEW_SIGNUP_WINDOW_MS,
                }));
                if (fresh.length === 0) return;

                setAlerts(prev => {
                    const seen = new Set(prev.map(a => a.key));
                    return [...prev, ...fresh.filter(a => !seen.has(a.key))];
                });
                fresh.forEach(a => {
                    if (timers.has(a.key)) return;
                    timers.set(a.key, setTimeout(() => dismiss(a.key), AUTO_DISMISS_MS));
                });
            } catch {
                // Popup is a nice-to-have — never surface poll failures.
            }
        };

        poll();
        const interval = setInterval(poll, POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
            timers.forEach(clearTimeout);
            timers.clear();
        };
    }, []);

    if (alerts.length === 0) return null;

    // Newest on top; anything beyond MAX_VISIBLE collapses into a count.
    const visible = alerts.slice(-MAX_VISIBLE).reverse();
    const hidden = alerts.length - visible.length;

    return (
        <div
            className="fixed bottom-4 right-4 left-4 sm:left-auto z-[70] flex flex-col gap-3 sm:w-80"
            role="status"
            aria-live="polite"
        >
            {visible.map(a => (
                <div
                    key={a.key}
                    className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-in slide-in-from-bottom-4 fade-in duration-300"
                >
                    <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${a.isNew ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {a.isNew ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                    {a.name || 'Unknown customer'}
                                </p>
                                {a.isNew && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700 shrink-0">
                                        New
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                                {a.isNew ? 'Signed up' : 'Logged in'} · {formatTime(a.lastLoginAt)}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{a.mobile}{a.email ? ` · ${a.email}` : ''}</p>
                            <Link
                                href={`/admin/users?q=${encodeURIComponent(a.mobile)}`}
                                onClick={() => dismiss(a.key)}
                                className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                                View customer →
                            </Link>
                        </div>
                        <button
                            type="button"
                            onClick={() => dismiss(a.key)}
                            className="p-1 -m-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
            {hidden > 0 && (
                <button
                    type="button"
                    onClick={() => {
                        timersRef.current.forEach(clearTimeout);
                        timersRef.current.clear();
                        setAlerts([]);
                    }}
                    className="self-end text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1 shadow"
                >
                    +{hidden} more · Dismiss all
                </button>
            )}
        </div>
    );
}
