"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Eye, ShoppingCart, CreditCard, TrendingUp, Percent } from 'lucide-react';
import { api } from '@/api/api';

interface OverviewStats {
    visitors: number;
    pageViews: number;
    productViews: number;
    addToCart: number;
    checkoutsStarted: number;
    purchases: number;
    conversionRate: number;
    dailyPurchases: { date: string; count: number }[];
}

// Only cards with a real destination page get an href — Product Views/Add
// to Cart/Checkouts Started/Conversion Rate have no dedicated breakdown
// page yet (that's the deferred Product/Cart-Abandonment analytics work),
// so they stay plain display cards rather than linking somewhere unhelpful.
const StatCard = ({ title, value, icon: Icon, bgColor, color, trend, href }: any) => {
    const content = (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center ${href ? 'hover:border-gray-300 hover:shadow-md transition-all cursor-pointer' : ''}`}>
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
    return href ? <Link href={href}>{content}</Link> : content;
};

const RANGE_OPTIONS = [
    { label: 'Today', days: 1 },
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
];

export default function AnalyticsOverview() {
    const [days, setDays] = useState(7);
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoading(true);
        api
            .get(`/admin/analytics/overview?days=${days}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setStats(res.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, [days]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
                    <p className="text-gray-500 text-sm">What customers are doing on the site</p>
                </div>
                <div className="flex gap-2 bg-white border rounded-lg p-1">
                    {RANGE_OPTIONS.map((opt) => (
                        <button
                            key={opt.days}
                            onClick={() => setDays(opt.days)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${days === opt.days ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16 text-gray-400">Loading...</div>
            ) : !stats ? (
                <div className="text-center py-16 text-gray-400">Couldn't load analytics.</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                        <StatCard title="Visitors" value={stats.visitors} icon={Users} color="text-blue-500" bgColor="bg-blue-100" href="/admin/analytics/visitors" />
                        <StatCard title="Product Views" value={stats.productViews} icon={Eye} color="text-purple-500" bgColor="bg-purple-100" />
                        <StatCard title="Add to Cart" value={stats.addToCart} icon={ShoppingCart} color="text-orange-500" bgColor="bg-orange-100" />
                        <StatCard title="Checkouts Started" value={stats.checkoutsStarted} icon={CreditCard} color="text-amber-500" bgColor="bg-amber-100" />
                        <StatCard title="Purchases" value={stats.purchases} icon={TrendingUp} color="text-green-500" bgColor="bg-green-100" href="/admin/orders" />
                        <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} icon={Percent} color="text-red-500" bgColor="bg-red-100" />
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">Purchases by Day</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.dailyPurchases}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(value: number) => [value, 'Purchases']} />
                                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {stats.dailyPurchases.length === 0 && (
                            <p className="text-center text-gray-400 text-sm mt-2">No purchases in this range yet.</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
