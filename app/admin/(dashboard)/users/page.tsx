"use client";

import React, { useMemo, useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Search, Ban, CheckCircle, Mail, Calendar, User, Phone, LogOut } from 'lucide-react';

// When a customer joined, as epoch ms. GET /users returns natural (oldest-
// first) order, and some older accounts have no createdAt — a Mongo ObjectId's
// first 4 bytes are its creation time in seconds, so it's a reliable fallback.
const joinedAt = (c: { createdAt?: string | Date; id?: string }): number => {
    if (c?.createdAt) {
        const t = new Date(c.createdAt).getTime();
        if (!Number.isNaN(t)) return t;
    }
    if (c?.id && /^[0-9a-f]{24}$/i.test(c.id)) {
        return parseInt(c.id.slice(0, 8), 16) * 1000;
    }
    return 0;
};

// Always shown in IST regardless of the admin's device timezone, e.g.
// "26 Sept 2026" / "2:45 PM".
const formatJoinedDate = (ms: number) =>
    new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const formatJoinedTime = (ms: number) =>
    new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).toUpperCase();

type StatusFilter ='all' | 'active' | 'blocked';
type OrdersFilter = 'all' | 'with' | 'without';
type JoinedFilter = 'all' | '7d' | '30d' | '90d';

const DAY_MS = 24 * 60 * 60 * 1000;
const JOINED_DAYS: Record<Exclude<JoinedFilter, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };

const selectClass = "px-3 py-2 border rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function CustomerManager() {
    const { customers, blockCustomer, forceLogoutCustomer } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [ordersFilter, setOrdersFilter] = useState<OrdersFilter>('all');
    const [joinedFilter, setJoinedFilter] = useState<JoinedFilter>('all');
    const [loggingOutId, setLoggingOutId] = useState<string | null>(null);

    const handleForceLogout = async (id: string) => {
        setLoggingOutId(id);
        try {
            await forceLogoutCustomer(id);
        } finally {
            setLoggingOutId(null);
        }
    };

    const hasActiveFilters = !!searchTerm || statusFilter !== 'all' || ordersFilter !== 'all' || joinedFilter !== 'all';

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setOrdersFilter('all');
        setJoinedFilter('all');
    };

    // Newest customers first.
    const filteredCustomers = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();
        const joinedCutoff = joinedFilter === 'all' ? 0 : Date.now() - JOINED_DAYS[joinedFilter] * DAY_MS;

        return customers
            .filter(c => {
                if (search) {
                    const haystack = [c?.name, c?.email, c?.mobile]
                        .map(v => (v || '').toLowerCase())
                        .join(' ');
                    if (!haystack.includes(search)) return false;
                }

                if (statusFilter !== 'all' && c?.status !== statusFilter) return false;

                const orders = c?.ordersCount ?? 0;
                if (ordersFilter === 'with' && orders === 0) return false;
                if (ordersFilter === 'without' && orders > 0) return false;

                if (joinedCutoff && joinedAt(c) < joinedCutoff) return false;

                return true;
            })
            .sort((a, b) => joinedAt(b) - joinedAt(a));
    }, [customers, searchTerm, statusFilter, ordersFilter, joinedFilter]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-500 text-sm">Manage user accounts and access</p>
                </div>
                <div className="relative w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Search name, email or phone..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <select
                    aria-label="Filter by status"
                    className={selectClass}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                </select>
                <select
                    aria-label="Filter by orders"
                    className={selectClass}
                    value={ordersFilter}
                    onChange={(e) => setOrdersFilter(e.target.value as OrdersFilter)}
                >
                    <option value="all">All customers</option>
                    <option value="with">Has orders</option>
                    <option value="without">No orders</option>
                </select>
                <select
                    aria-label="Filter by join date"
                    className={selectClass}
                    value={joinedFilter}
                    onChange={(e) => setJoinedFilter(e.target.value as JoinedFilter)}
                >
                    <option value="all">Joined: any time</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                </select>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        Clear filters
                    </button>
                )}
                <span className="text-sm text-gray-500 md:ml-auto">
                    Showing {filteredCustomers.length} of {customers.length}
                </span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4">Orders</th>
                                <th className="px-6 py-4">Total Spent</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        {hasActiveFilters ? 'No customers match these filters.' : 'No customers yet.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                    {customer?.name ? customer.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                                                </div>
                                                <span className="font-medium text-gray-900">
                                                    {customer?.name || <span className="text-gray-400 italic">Unknown User</span>}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Phone className="w-3 h-3" />
                                                {customer?.mobile || <span className="text-gray-400 italic">No phone</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Mail className="w-3 h-3" />
                                                {customer?.email || <span className="text-gray-400 italic">No email</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {joinedAt(customer) ? (
                                                <div className="flex items-start gap-2 text-gray-500 whitespace-nowrap">
                                                    <Calendar className="w-3 h-3 mt-1" />
                                                    <div>
                                                        <div>{formatJoinedDate(joinedAt(customer))}</div>
                                                        <div className="text-xs text-gray-400">{formatJoinedTime(joinedAt(customer))}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    <span className="text-gray-400 italic">N/A</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {customer?.ordersCount ?? 0}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            ₹{(customer?.totalSpent ?? 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${customer?.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : customer?.status === 'blocked'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {customer?.status === 'active'
                                                    ? 'Active'
                                                    : customer?.status === 'blocked'
                                                        ? 'Blocked'
                                                        : 'Unknown'
                                                }
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleForceLogout(customer.id)}
                                                    disabled={loggingOutId === customer.id}
                                                    className="p-1.5 rounded text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
                                                    title="Force log out on all devices — account stays active, they can log back in immediately"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => blockCustomer(customer.id)}
                                                    className={`p-1.5 rounded transition-colors ${customer?.status === 'active'
                                                        ? 'text-red-500 hover:bg-red-50'
                                                        : 'text-green-500 hover:bg-green-50'
                                                        }`}
                                                    title={customer?.status === 'active' ? 'Block User' : 'Unblock User'}
                                                >
                                                    {customer?.status === 'active'
                                                        ? <Ban className="w-4 h-4" />
                                                        : <CheckCircle className="w-4 h-4" />
                                                    }
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}