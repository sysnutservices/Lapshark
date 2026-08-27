"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/api/api';
import { Mail, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';

interface ContactMessage {
    _id: string;
    name: string;
    email: string;
    subject?: string;
    message: string;
    status: 'new' | 'read' | 'replied';
    createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    read: 'bg-gray-100 text-gray-700',
    replied: 'bg-green-100 text-green-700',
};

export default function ContactMessagesPage() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const authHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    useEffect(() => {
        api.get('/admin/contact-messages', authHeader())
            .then((res) => setMessages(res.data))
            .catch(() => setMessages([]))
            .finally(() => setLoading(false));
    }, []);

    const setStatus = async (id: string, status: ContactMessage['status']) => {
        const res = await api.put(`/admin/contact-messages/${id}/status`, { status }, authHeader());
        setMessages((prev) => prev.map((m) => (m._id === id ? res.data.message : m)));
    };

    const toggleExpand = (msg: ContactMessage) => {
        const next = expandedId === msg._id ? null : msg._id;
        setExpandedId(next);
        // Opening a "new" message is the natural point to mark it read —
        // matches how the status field is meant to be used (no separate
        // "mark as read" click most admins would skip).
        if (next && msg.status === 'new') setStatus(msg._id, 'read');
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
                <p className="text-gray-500 text-sm">Submissions from the Contact Us page</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="px-6 py-8 text-center text-gray-500">Loading...</div>
                ) : messages.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">No messages yet.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {messages.map((msg) => (
                            <div key={msg._id}>
                                <button
                                    onClick={() => toggleExpand(msg)}
                                    className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                                        {msg.name.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 truncate">{msg.name}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${STATUS_STYLES[msg.status]}`}>
                                                {msg.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{msg.subject || 'No subject'} — {msg.message}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(msg.createdAt).toLocaleDateString('en-IN')}
                                    </div>
                                    {expandedId === msg._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </button>

                                {expandedId === msg._id && (
                                    <div className="px-6 pb-5 pl-[4.5rem] space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-3.5 h-3.5" />
                                            <a href={`mailto:${msg.email}`} className="hover:text-blue-600 hover:underline">{msg.email}</a>
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100">
                                            {msg.message}
                                        </p>
                                        {msg.status !== 'replied' && (
                                            <button
                                                onClick={() => setStatus(msg._id, 'replied')}
                                                className="text-sm font-bold text-green-700 hover:underline"
                                            >
                                                Mark as replied
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
