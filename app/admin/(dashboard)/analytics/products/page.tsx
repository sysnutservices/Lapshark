"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { api } from '@/api/api';

interface ProductRow {
    productId: string;
    title: string;
    views: number;
    addToCart: number;
    purchases: number;
    cartConversionRate: number;
    purchaseConversionRate: number;
}

const RANGE_OPTIONS = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 },
];

// A product with real traffic but a near-zero cart rate is exactly the
// "high interest, low conversion" signal this page exists to surface —
// flag it rather than making the admin eyeball every row.
const LOW_CONVERSION_THRESHOLD = 2; // %
const MIN_VIEWS_TO_FLAG = 10;

export default function ProductAnalyticsPage() {
    const [days, setDays] = useState(30);
    const [products, setProducts] = useState<ProductRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoading(true);
        api
            .get(`/admin/analytics/products?days=${days}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setProducts(res.data.products || []))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, [days]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Product Views</h1>
                    <p className="text-gray-500 text-sm">Which products get looked at, and which of those actually convert</p>
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-medium">
                            <tr>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4 text-right">Views</th>
                                <th className="px-6 py-4 text-right">Add to Cart</th>
                                <th className="px-6 py-4 text-right">Cart Rate</th>
                                <th className="px-6 py-4 text-right">Purchases</th>
                                <th className="px-6 py-4 text-right">Purchase Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-400">No product views tracked in this range yet.</td>
                                </tr>
                            ) : (
                                products.map((p) => {
                                    const flagged = p.views >= MIN_VIEWS_TO_FLAG && p.cartConversionRate < LOW_CONVERSION_THRESHOLD;
                                    return (
                                        <tr key={p.productId} className="border-t border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {flagged && (
                                                        <span title={`${p.views} views but under ${LOW_CONVERSION_THRESHOLD}% add to cart`}>
                                                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        </span>
                                                    )}
                                                    <span className="font-medium text-gray-900">{p.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold">{p.views}</td>
                                            <td className="px-6 py-4 text-right">{p.addToCart}</td>
                                            <td className="px-6 py-4 text-right">{p.cartConversionRate}%</td>
                                            <td className="px-6 py-4 text-right">{p.purchases}</td>
                                            <td className="px-6 py-4 text-right">{p.purchaseConversionRate}%</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {!loading && products.some((p) => p.views >= MIN_VIEWS_TO_FLAG && p.cartConversionRate < LOW_CONVERSION_THRESHOLD) && (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Rows marked have real traffic ({MIN_VIEWS_TO_FLAG}+ views) but under {LOW_CONVERSION_THRESHOLD}% add-to-cart — worth a look at pricing, images, or description.
                </p>
            )}
        </div>
    );
}
