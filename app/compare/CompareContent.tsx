"use client";

import React from 'react';
import { useUserFeatures } from '@/context/UserFeatureContext';
import { useCart } from '@/context/CartContext';
import { X, ShoppingCart, AlertCircle, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_URL2 } from '@/api/api';

export default function CompareContent() {
    const { compareList, removeFromCompare } = useUserFeatures();
    const { addToCart } = useCart();
    const router = useRouter();

    if (compareList.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center shadow-sm mb-6">
                    <AlertCircle className="w-10 h-10 text-blue-300" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No items to compare</h2>
                <p className="text-gray-500 mb-8 text-center max-w-md">
                    Add items to compare list to see their differences side-by-side.
                </p>
                <Link href="/products" className="bg-gray-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">
                    Browse Products
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
                <h1 className="text-3xl font-bold text-gray-900">Compare Products ({compareList.length})</h1>
            </div>

            <div className="overflow-x-auto pb-6">
                <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                        <tr>
                            <th className="p-4 text-left bg-gray-50 border-b min-w-[200px]">Features</th>
                            {compareList.map(product => (
                                <th key={product.id} className="p-4 border-b min-w-[250px] relative bg-white">
                                    <button
                                        onClick={() => removeFromCompare(product.id!)}
                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-32 h-32 mb-4 relative">
                                            <img
                                                src={`${API_URL2}${product.image}`}
                                                alt={product.title}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 h-12">{product.title}</h3>
                                        <p className="text-blue-600 font-bold text-lg mb-3">₹{product.finalPrice.toLocaleString('en-IN')}</p>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <ShoppingCart className="w-4 h-4" /> Add to Cart
                                        </button>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr>
                            <td className="p-4 font-bold text-gray-700 bg-gray-50">Rating</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="font-bold text-gray-900">{product.rating}</span>
                                        <span className="text-yellow-400">★</span>
                                        <span className="text-gray-400 text-sm">({product.reviews})</span>
                                    </div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-gray-700 bg-gray-50">Brand</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-gray-600">{product.brand}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-gray-700 bg-gray-50">Processor</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-gray-600">{product.specs.processor}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-gray-700 bg-gray-50">RAM</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-gray-600">{product.specs.ram}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-gray-700 bg-gray-50">Storage</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-gray-600">{product.specs.storage}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-gray-700 bg-gray-50">Display</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-gray-600">{product.specs.display}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-gray-700 bg-gray-50">Graphics</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-gray-600">{product.specs.graphics}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-gray-700 bg-gray-50">Condition</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                        {product.condition || 'Excellent'}
                                    </span>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
