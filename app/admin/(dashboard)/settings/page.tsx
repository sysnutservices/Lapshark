"use client";

import React from 'react';
import { Settings as SettingsIcon, Globe, CreditCard, Truck } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid divide-y divide-gray-100">
                    <div className="p-6 flex items-start gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Globe className="w-6 h-6" /></div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">General Information</h3>
                            <p className="text-sm text-gray-500 mb-4">Store name, currency, and localization</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Store Name</label>
                                    <input className="w-full border rounded-lg p-2 text-sm" defaultValue="LAPSHARK" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Currency</label>
                                    <select className="w-full border rounded-lg p-2 text-sm">
                                        <option>INR (₹)</option>
                                        <option>USD ($)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex items-start gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CreditCard className="w-6 h-6" /></div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">Payments</h3>
                            <p className="text-sm text-gray-500 mb-4">Configure payment gateways</p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer">
                                    <input type="checkbox" checked readOnly className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-sm">Razorpay (Active)</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer">
                                    <input type="checkbox" checked readOnly className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-sm">Cash on Delivery (Active)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex items-start gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Truck className="w-6 h-6" /></div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">Shipping</h3>
                            <p className="text-sm text-gray-500 mb-4">Shipping zones and rates</p>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm">
                                <div className="flex justify-between mb-2">
                                    <span>Standard Shipping</span>
                                    <span className="font-bold">₹500</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Free Shipping Threshold</span>
                                    <span className="font-bold">₹10,000</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 text-right">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Save Settings</button>
                </div>
            </div>
        </div>
    );
}
