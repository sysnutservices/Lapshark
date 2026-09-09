"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/api/api';
import { Search, Eye, X, MessageCircle, ShoppingBag } from 'lucide-react';

interface CartItemRow {
    productId: string;
    title: string;
    image: string;
    finalPrice: number;
    quantity: number;
}

interface CartRow {
    cartId: string;
    customer: { id: string; name?: string; mobile?: string; email?: string } | null;
    items: CartItemRow[];
    itemCount: number;
    total: number;
    updatedAt: string;
}

// Same relative-time shape as the visitor Journey timeline, kept local
// since this is the only other place in admin that needs it.
function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function ActiveCartsPage() {
    const [carts, setCarts] = useState<CartRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCart, setSelectedCart] = useState<CartRow | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        api
            .get('/carts', { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => setCarts(res.data.carts || []))
            .catch(() => setCarts([]))
            .finally(() => setLoading(false));
    }, []);

    const filteredCarts = carts.filter((cart) => {
        const term = searchTerm.toLowerCase();
        return (
            (cart.customer?.name?.toLowerCase().includes(term) ?? false) ||
            (cart.customer?.mobile?.includes(term) ?? false)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Active Carts</h1>
                    <p className="text-gray-500 text-sm">
                        Every logged-in customer's non-empty cart. A guest browsing without logging in doesn't
                        appear here — their cart only exists in their own browser until they sign in.
                    </p>
                </div>
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search name or mobile..."
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
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Last Activity</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCarts.map((cart) => (
                                <tr key={cart.cartId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{cart.customer?.name || 'Unknown'}</div>
                                        <div className="text-gray-500 text-xs">{cart.customer?.mobile}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {cart.items[0]?.image && (
                                                <img src={cart.items[0].image} className="w-8 h-8 rounded object-cover" alt="" />
                                            )}
                                            <span className="text-gray-700">
                                                {cart.items[0]?.title}
                                                {cart.items.length > 1 ? ` +${cart.items.length - 1} more` : ''}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold">₹{cart.total.toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4 text-gray-500">{timeAgo(cart.updatedAt)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            {cart.customer?.mobile && (
                                                <a
                                                    href={`https://wa.me/91${cart.customer.mobile}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Message on WhatsApp"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => setSelectedCart(cart)}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredCarts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        No active carts right now.
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedCart && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedCart.customer?.name || 'Unknown Customer'}</h2>
                                <p className="text-sm text-gray-500">{selectedCart.customer?.mobile}{selectedCart.customer?.email ? ` · ${selectedCart.customer.email}` : ''}</p>
                            </div>
                            <button onClick={() => setSelectedCart(null)} className="p-2 hover:bg-gray-200 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-3">
                            {selectedCart.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                                    <img src={item.image} className="w-12 h-12 rounded object-cover" alt="" />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 text-sm">{item.title}</div>
                                        <div className="text-xs text-gray-500">Qty: {item.quantity} · ₹{item.finalPrice.toLocaleString('en-IN')} each</div>
                                    </div>
                                    <div className="font-bold text-gray-900">₹{(item.finalPrice * item.quantity).toLocaleString('en-IN')}</div>
                                </div>
                            ))}
                            <div className="flex justify-between pt-3 border-t border-gray-100">
                                <span className="font-bold text-gray-700">Cart Total</span>
                                <span className="font-bold text-gray-900">₹{selectedCart.total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
