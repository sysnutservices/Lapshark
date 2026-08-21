"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const { login, user, isAdmin } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && isAdmin) {
            router.push('/admin/dashboard');
        }
    }, [user, isAdmin, router]);

    const handleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const success = await login(email, password);
            if (!success) {
                setError('Invalid email or password');
            }
            // Redirect handled by useEffect
        } catch (err: any) {
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Admin Portal</h2>
                    <p className="text-gray-500 text-sm mt-2">Sign in to manage your store</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            placeholder="admin@example.com"
                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-gray-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
