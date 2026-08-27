"use client";

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Search, Ban, CheckCircle, Mail, Calendar, User, Phone, LogOut } from 'lucide-react';

export default function CustomerManager() {
    const { customers, blockCustomer, forceLogoutCustomer } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [loggingOutId, setLoggingOutId] = useState<string | null>(null);

    const handleForceLogout = async (id: string) => {
        setLoggingOutId(id);
        try {
            await forceLogoutCustomer(id);
        } finally {
            setLoggingOutId(null);
        }
    };

    const filteredCustomers = customers.filter(c => {
        const name = c?.name || '';
        const email = c?.email || '';
        const search = searchTerm.toLowerCase();

        return name.toLowerCase().includes(search) ||
            email.toLowerCase().includes(search);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-500 text-sm">Manage user accounts and access</p>
                </div>
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
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
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        {searchTerm ? 'No customers found matching your search.' : 'No customers yet.'}
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
                                                <Mail className="w-3 h-3" />
                                                {customer?.email || <span className="text-gray-400 italic">No email</span>}
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
                                                <Calendar className="w-3 h-3" />
                                                {customer?.createdAt
                                                    ? new Date(customer.createdAt).toLocaleDateString('en-IN')
                                                    : <span className="text-gray-400 italic">N/A</span>
                                                }
                                            </div>
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