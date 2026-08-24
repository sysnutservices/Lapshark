"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/api/api';
import logo from "@/assets/logo.svg"
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface CheckoutLoginProps {
    onLoginSuccess?: () => void;
    showLogo?: boolean;
    closeLogin?: () => void;
}

export const CheckoutLogin: React.FC<CheckoutLoginProps> = ({
    onLoginSuccess,
    showLogo = true,
    closeLogin
}) => {

    // OTP Form State
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);
    const { loginWithUser } = useAuth();

    // Send OTP Handler
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/users/otp`, { mobile });
            if (response.data.message) {
                setIsOtpSent(true);
                setCountdown(60); // Start 60 second countdown

                // Countdown timer
                const timer = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP and Login Handler
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/users/login`, { mobile, otp });

            if (response.data.success) {
                const userData = response.data.user;

                // Route through AuthContext (not just localStorage) so the
                // rest of the app — Navbar's Login/Logout state included —
                // actually sees this login without needing a page reload.
                loginWithUser(
                    { id: userData._id, name: userData.name, email: userData.email, mobile: userData.mobile, role: 'customer' },
                    userData.token
                );

                // Call success callback
                if (onLoginSuccess) {
                    onLoginSuccess();
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP Handler
    const handleResendOTP = () => {
        setOtp('');
        setIsOtpSent(false);
        setCountdown(0);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="relative bg-white p-8 md:p-10 rounded-3xl shadow-xl">

                <div className="flex justify-end w-full max-w-md mx-auto cursor-pointer">
                    <div className="flex items-center justify-center p-1 hover:bg-slate-100 rounded-full" onClick={closeLogin}>
                        <X />
                    </div>
                </div>
                <div className="text-center mb-8 w-full">
                    {showLogo && (
                        <div className="w-full flex items-center justify-center mb-4">
                            <img src={logo} alt="" className="w-32" />
                        </div>
                    )}
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {isOtpSent ? 'Verify OTP' : 'Login to Continue'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {isOtpSent
                            ? `Enter the OTP sent to ${mobile}`
                            : 'Sign in with your mobile number to complete your order'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
                        {error}
                    </div>
                )}

                {!isOtpSent ? (
                    // Mobile Number Form
                    <form className="space-y-6" onSubmit={handleSendOTP}>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Mobile Number
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    required
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                    className="font-bold appearance-none relative tracking-wide block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-xl transition-all"
                                    placeholder="Enter 10-digit mobile number"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || mobile.length !== 10}
                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all shadow-lg hover:shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>

                        <div className="text-center">
                            <p className="text-xs text-slate-500">
                                By continuing, you agree to our <Link href="/terms" className="text-teal-500 underline">Terms</Link> & <Link href="/privacy" className="text-teal-500 underline">Privacy Policy</Link>
                            </p>
                        </div>
                    </form>
                ) : (
                    // OTP Verification Form
                    <form className="space-y-6" onSubmit={handleVerifyOTP}>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Enter OTP
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all text-center tracking-widest text-2xl font-bold"
                                    placeholder="• • • • • •"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all shadow-lg hover:shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verifying...' : 'Verify & Continue'}
                        </button>

                        <div className="text-center space-y-2">
                            {countdown > 0 ? (
                                <p className="text-sm text-slate-500">
                                    Resend OTP in <span className="font-bold text-teal-600">{countdown}s</span>
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    className="text-sm font-medium text-teal-600 hover:text-teal-500"
                                >
                                    Resend OTP
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOtpSent(false);
                                    setOtp('');
                                    setError('');
                                }}
                                className="block w-full text-sm font-medium text-slate-600 hover:text-slate-500"
                            >
                                Change mobile number
                            </button>
                        </div>
                    </form>

                )}
            </div>
        </div>
    );
};