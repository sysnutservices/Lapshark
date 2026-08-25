"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/api/api';

interface VisitorRow {
    visitorId: string;
    userId?: { name?: string; mobile?: string } | null;
    intentScore: number;
    intentLevel: 'cold' | 'warm' | 'hot' | 'customer';
    firstSeenAt: string;
    lastSeenAt: string;
    totalEvents: number;
    lastTouch?: { source?: string };
}

const LEVEL_COLOR: Record<string, string> = {
    cold: 'bg-gray-100 text-gray-600 border-gray-200',
    warm: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    hot: 'bg-orange-100 text-orange-700 border-orange-200',
    customer: 'bg-green-100 text-green-700 border-green-200',
};

export default function VisitorsPage() {
    const [visitors, setVisitors] = useState<VisitorRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 50;

    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoading(true);
        api
            .get(`/admin/analytics/visitors?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                setVisitors(res.data.visitors || []);
                setTotal(res.data.total || 0);
            })
            .catch(() => {
                setVisitors([]);
                setTotal(0);
            })
            .finally(() => setLoading(false));
    }, [page]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Visitors</h1>
                <p className="text-gray-500 text-sm">Sorted by purchase intent — the hottest leads first</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-medium">
                            <tr>
                                <th className="px-6 py-4">Intent</th>
                                <th className="px-6 py-4">Score</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Events</th>
                                <th className="px-6 py-4">Last Source</th>
                                <th className="px-6 py-4">Last Seen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td>
                                </tr>
                            ) : visitors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-400">No visitors tracked yet.</td>
                                </tr>
                            ) : (
                                visitors.map((v) => (
                                    <tr key={v.visitorId} className="border-t border-gray-100 hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/analytics/visitors/${v.visitorId}`}>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${LEVEL_COLOR[v.intentLevel] || LEVEL_COLOR.cold}`}>
                                                    {v.intentLevel}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{v.intentScore}</td>
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/analytics/visitors/${v.visitorId}`} className="hover:text-blue-600">
                                                {v.userId?.name ? `${v.userId.name} (${v.userId.mobile})` : 'Anonymous'}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">{v.totalEvents}</td>
                                        <td className="px-6 py-4">{v.lastTouch?.source || '—'}</td>
                                        <td className="px-6 py-4">{new Date(v.lastSeenAt).toLocaleString('en-IN')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {total > limit && (
                <div className="flex justify-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-500">
                        Page {page} of {Math.ceil(total / limit)}
                    </span>
                    <button
                        disabled={page >= Math.ceil(total / limit)}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
