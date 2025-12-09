"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Check, Package, ShoppingBag, Home } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OrderSuccessContent({ id }: { id: string }) {
    useEffect(() => {
        // Fire confetti animation on mount
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">

            <div className="bg-white max-w-lg w-full rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 relative animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-green-500 h-2 absolute top-0 left-0 w-full"></div>

                <div className="p-8 md:p-12 text-center">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm border border-green-100 animate-in zoom-in duration-700">
                        <Check className="w-12 h-12 text-green-500 stroke-[3]" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Order Confirmed!</h1>
                    <p className="text-gray-500 mb-8 text-lg">Thank you for your purchase. Your order has been received and is now being processed.</p>

                    <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-200 border-dashed relative group cursor-pointer hover:bg-gray-100 transition-colors">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Order ID</p>
                        <p className="text-2xl font-mono font-bold text-slate-900 tracking-wide uppercase">{id}</p>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Could add 'Copy' functionality tooltip here */}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Link
                            href="/products"
                            className="block w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 hover:shadow-blue-200 flex items-center justify-center gap-2 active:scale-95"
                        >
                            <ShoppingBag className="w-5 h-5" /> Continue Shopping
                        </Link>
                        <Link
                            href="/"
                            className="block w-full bg-white text-slate-700 font-bold py-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" /> Return Home
                        </Link>
                    </div>
                </div>

                <div className="bg-slate-50 p-6 text-center border-t border-gray-100">
                    <p className="text-sm text-gray-500 flex items-center justify-center gap-2 font-medium">
                        <Package className="w-4 h-4 text-blue-500" />
                        You will receive an email confirmation shortly.
                    </p>
                </div>
            </div>
        </div>
    );
}
