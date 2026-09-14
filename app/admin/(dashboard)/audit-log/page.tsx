"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/api/api';

interface AuditLogEntry {
    _id: string;
    actor: string;
    action: string;
    targetType?: string;
    targetId?: string;
    createdAt: string;
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const authHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    useEffect(() => {
        api.get('/admin/audit-log', authHeader())
            .then((res) => setLogs(res.data))
            .catch(() => setLogs([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
                <p className="text-gray-500 text-sm">Recent sensitive admin actions — most recent 100</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">When</th>
                                <th className="px-6 py-4">Actor</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Target</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString('en-IN', {
                                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                        })}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{log.actor}</td>
                                    <td className="px-6 py-4 font-mono text-blue-600">{log.action}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {log.targetType ? `${log.targetType} · ${log.targetId}` : '—'}
                                    </td>
                                </tr>
                            ))}
                            {!loading && logs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No audit entries yet.
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
