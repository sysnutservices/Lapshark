"use client";

import React, { useState, useEffect } from 'react';
import { useUserFeatures } from '@/context/UserFeatureContext';
import { ArrowLeft, MapPin, Trash2, Edit2, Plus, Check } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Address } from '@/types';
import { useRouter } from 'next/navigation';

export const AddressBook: React.FC = () => {
    const { addresses, addAddress, removeAddress, selectAddress, selectedAddressId, fetchAddresses } = useUserFeatures();
    const router = useRouter()
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        type: 'Home' as 'Home' | 'Work' | 'Other'
    });

    useEffect(() => {
        fetchAddresses();
    }, []);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newAddress: any = {
            id: Math.random().toString(36).substr(2, 9),
            ...formData
        };
        addAddress(newAddress);
        setIsAdding(false);
        setFormData({ name: '', street: '', city: '', state: '', zip: '', phone: '', type: 'Home' });
    };

    const handleProceed = () => {
        if (!selectedAddressId) {
            alert("Please select an address to proceed.");
            return;
        }
        router.push('/checkout');
    };
    // 👉 FREE Reverse Geocode (OpenStreetMap)
    const reverseGeocode = async (lat, lon) => {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        const res = await fetch(url);
        const data = await res.json();
        return data;
    };

    // 👉 Handle "Use My Location"
    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            alert("Your device does not support location.");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;

            const data = await reverseGeocode(latitude, longitude);
            const a = data.address || {};

            const street = [
                a.house_number,
                a.road,
                a.residential,
                a.neighbourhood,
                a.suburb,
                a.quarter
            ]
                .filter(Boolean)
                .join(", ");

            setFormData((prev) => ({
                ...prev,
                street: street || "",
                city: a.city || a.town || a.village || "",
                state: a.state || "",
                zip: a.postcode || "",
            }));
        });
    };


    return (
        <div className="bg-slate-50 min-h-screen py-8">
            <SEO title="Manage Addresses - LAPSHARK" description="Select or add a shipping address." />
            <div className="max-w-3xl mx-auto px-4 sm:px-6">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Address</h1>
                </div>

                {/* Address List */}
                {!isAdding ? (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            {addresses.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                                    <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No saved addresses found.</p>
                                </div>
                            ) : (
                                addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        onClick={() => selectAddress(addr.id)}
                                        className={`relative bg-white p-5 rounded-2xl border cursor-pointer transition-all min-h-[100px] ${selectedAddressId === addr.id
                                            ? 'border-teal-600 ring-1 ring-teal-600 shadow-md'
                                            : 'border-slate-200 hover:border-slate-300 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selectedAddressId === addr.id
                                                    ? 'bg-teal-600 text-white'
                                                    : 'bg-slate-100 text-slate-500'
                                                    }`}
                                            >
                                                <MapPin className="w-5 h-5" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className="font-bold text-slate-900">{addr.name}</h3>
                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                                        {addr.type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed">{addr.street}, {addr.city}</p>
                                                <p className="text-sm text-slate-600">{addr.state} - {addr.zip}</p>
                                                <p className="text-sm text-slate-600 mt-1 font-medium">Phone: +91 {addr.phone}</p>
                                            </div>

                                            <div className="flex flex-col justify-between items-center ml-2 py-1 min-h-[100px] ">
                                                {selectedAddressId === addr.id ? (
                                                    <div className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs">
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5"></div>
                                                )}

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeAddress(addr.id);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                ))
                            )}
                        </div>

                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold flex items-center justify-center gap-2 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50 transition-all"
                        >
                            <Plus className="w-5 h-5" /> Add New Address
                        </button>

                        {addresses.length > 0 && (
                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:static md:bg-transparent md:border-0 md:p-0 mt-8">
                                <div className="max-w-3xl mx-auto">
                                    <div className="flex items-center justify-center gap-4 mb-4 md:hidden">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-5" alt="MC" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-5" alt="Visa" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-5" alt="PayPal" />
                                    </div>
                                    <button
                                        onClick={handleProceed}
                                        className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-teal-700 transition-all active:scale-95"
                                    >
                                        Proceed to Checkout
                                    </button>
                                    <div className="hidden md:flex items-center justify-center gap-6 mt-6 opacity-60 grayscale">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="MC" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-6" alt="Visa" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-6" alt="PayPal" />
                                        <span className="text-xs font-bold text-slate-500 uppercase">100% Secure Payments</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Add Address Form
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                        <button
                            type="button"
                            onClick={handleUseMyLocation}
                            className="mb-4 flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 font-semibold rounded-xl hover:bg-teal-100"
                        >
                            <MapPin className="w-4 h-4" />
                            Use My Current Location
                        </button>

                        <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Address</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                                <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Street Address</label>
                                <input required name="street" value={formData.street} onChange={handleInputChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="123 Main St, Apartment 4B" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                                    <input required name="city" value={formData.city} onChange={handleInputChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">State</label>
                                    <input required name="state" value={formData.state} onChange={handleInputChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ZIP Code</label>
                                    <input required name="zip" value={formData.zip} onChange={handleInputChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                                    <input required name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="+91 98765 43210" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Address Type</label>
                                <div className="flex gap-4">
                                    {['Home', 'Work', 'Other'].map((type) => (
                                        <label key={type} className={`flex-1 py-3 px-4 rounded-xl border cursor-pointer text-center font-bold text-sm transition-all ${formData.type === type ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                                            <input type="radio" name="type" value={type} checked={formData.type === type} onChange={handleInputChange} className="hidden" />
                                            {type}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3.5 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg transition-colors">Save Address</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
