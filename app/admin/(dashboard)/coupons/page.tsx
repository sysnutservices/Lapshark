"use client";

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Coupon } from '@/types';
import { Plus, Trash2, Ticket, Calendar, DollarSign, Edit } from 'lucide-react';

export default function CouponManager() {
    const { coupons, addCoupon, deleteCoupon } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Coupon>>({
        code: '',
        type: 'percentage',
        value: 0,
        minOrderValue: 0,
        expiryDate: '',
        usageLimit: 100,
        isActive: true
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newCoupon = {
            ...formData,
            id: Math.random().toString(36).substr(2, 9),
            usedCount: 0
        } as Coupon;
        addCoupon(newCoupon);
        setIsModalOpen(false);
        setFormData({ code: '', type: 'percentage', value: 0, minOrderValue: 0, expiryDate: '', usageLimit: 100, isActive: true });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
                    <p className="text-gray-500 text-sm">Create and manage discount codes</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" /> Create Coupon
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map(coupon => (
                    <div key={coupon.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded font-mono font-bold tracking-wide border border-blue-100">
                                {coupon.code}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {coupon.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center text-gray-700 font-bold text-lg">
                                <Ticket className="w-5 h-5 mr-2 text-gray-400" />
                                {coupon.type === 'fixed' ? `₹${coupon.value} OFF` : `${coupon.value}% OFF`}
                            </div>
                            <p className="text-sm text-gray-500">Min. Spend: ₹{coupon.minOrderValue}</p>
                            <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-4 h-4 mr-2" /> Expires: {coupon.expiryDate}
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-4">
                            <span>Used: {coupon.usedCount} / {coupon.usageLimit}</span>
                            <button
                                onClick={() => deleteCoupon(coupon.id)}
                                className="text-red-500 hover:text-red-700 font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Create New Coupon</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                                <input
                                    required
                                    className="w-full p-2 border rounded-lg uppercase font-mono"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="SUMMER2025"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.minOrderValue}
                                        onChange={e => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.usageLimit}
                                        onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.expiryDate}
                                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Create Coupon
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
