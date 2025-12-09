"use client";

import React from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

const data = [
    { name: 'Mon', sales: 400000 },
    { name: 'Tue', sales: 300000 },
    { name: 'Wed', sales: 200000 },
    { name: 'Thu', sales: 278000 },
    { name: 'Fri', sales: 189000 },
    { name: 'Sat', sales: 239000 },
    { name: 'Sun', sales: 349000 },
];

const StatCard = ({ title, value, icon: Icon, bgColor, color, trend }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <div className={`p-4 rounded-full ${bgColor} bg-opacity-10 mr-4`}>
            <Icon className={`w-8 h-8 ${color}`} />
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            {trend && <span className="text-green-500 text-xs font-bold flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> {trend}</span>}
        </div>
    </div>
);

export default function Dashboard() {
    const { stats, orders } = useStore();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Real-Time Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
                    icon={DollarSign}
                    color="text-green-500"
                    bgColor="bg-green-100"
                    trend="Live"
                />
                <StatCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon={ShoppingCart}
                    color="text-blue-500"
                    bgColor="bg-blue-100"
                />
                <StatCard
                    title="Active Products"
                    value={stats.totalProducts}
                    icon={Package}
                    color="text-purple-500"
                    bgColor="bg-purple-100"
                />
                {stats.lowStockCount > 0 ? (
                    <StatCard
                        title="Low Stock Alert"
                        value={stats.lowStockCount}
                        icon={AlertTriangle}
                        color="text-red-500"
                        bgColor="bg-red-100"
                    />
                ) : (
                    <StatCard
                        title="Customers"
                        value="8,432"
                        icon={Users}
                        color="text-orange-500"
                        bgColor="bg-orange-100"
                        trend="+2%"
                    />
                )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Weekly Sales (₹)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Sales']} />
                                <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Visitor Traffic</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Recent Orders</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-medium">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders?.slice(0, 5).map((order) => (
                                <tr key={order.orderId} className="border-t border-gray-100 hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-xs">{order.orderId}</td>
                                    <td className="px-6 py-4">{order.customerName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{order.items.length} Items</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">₹{order.total.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-400">No orders yet. Go buy something!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
