"use client";

import React, { useEffect, useState } from 'react';
import { useUserFeatures } from '@/context/UserFeatureContext';
import { ProductCard } from '@/components/ProductCard';
import { Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CheckoutLogin } from '@/components/LoginComponent';
import { useRouter } from 'next/navigation';


export default function WishlistContent() {
    const router = useRouter();
    const { wishlist } = useUserFeatures();
    const [showLogin, setShowLogin] = useState(false)
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setShowLogin(true);
        }
    }, []);

    const handleLoginSuccess = async () => {
        setShowLogin(false);
    };

    if (wishlist.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 px-4">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center shadow-sm mb-6">
                    <Heart className="w-10 h-10 text-red-300" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Your wishlist is empty</h2>
                <p className="text-slate-500 mb-8 text-center max-w-md">
                    Save items you love here to track their price or buy them later.
                </p>
                <Link href="/products" className="bg-teal-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors">
                    Explore Products
                </Link>
                {showLogin && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        {/* Centered Login Card */}
                        <div className="w-full max-w-md mx-4">
                            <CheckoutLogin onLoginSuccess={handleLoginSuccess} closeLogin={() => { setShowLogin(false); router.back() }} />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/products" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-600" />
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">My Wishlist ({wishlist.length})</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlist.map(product => (
                    <ProductCard key={product.productId} product={product} />
                ))}
            </div>

        </div>
    );
}               
