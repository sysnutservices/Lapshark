"use client";

import React from 'react';
import { useUserFeatures } from '@/context/UserFeatureContext';
import { ProductCard } from '@/components/ProductCard';
import { Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function WishlistContent() {
    const { wishlist } = useUserFeatures();

    if (wishlist.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center shadow-sm mb-6">
                    <Heart className="w-10 h-10 text-red-300" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
                <p className="text-gray-500 mb-8 text-center max-w-md">
                    Save items you love here to track their price or buy them later.
                </p>
                <Link href="/products" className="bg-gray-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">
                    Explore Products
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/products" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">My Wishlist ({wishlist.length})</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlist.map(product => (
                    <ProductCard key={product.productId} product={product} />
                ))}
            </div>
        </div>
    );
}
