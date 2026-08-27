"use client";

import React from 'react';
import { useUserFeatures } from '@/context/UserFeatureContext';
import { useCart } from '@/context/CartContext';
import { X, ShoppingCart, AlertCircle, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { STORE_POLICIES } from '@/lib/policies';

const USE_CASE_LABEL: Record<string, string> = {
    student: 'Student', office: 'Office & Business', programming: 'Programming',
    design: 'Design & Editing', gaming: 'Gaming', everyday: 'Everyday Use',
};

export default function CompareContent() {
    const { compareList, removeFromCompare } = useUserFeatures();
    const { addToCart } = useCart();
    const router = useRouter();

    if (compareList.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 px-4">
                <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center shadow-sm mb-6">
                    <AlertCircle className="w-10 h-10 text-teal-300" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">No items to compare</h2>
                <p className="text-slate-500 mb-8 text-center max-w-md">
                    Add items to compare list to see their differences side-by-side.
                </p>
                <Link href="/products" className="bg-teal-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors">
                    Browse Products
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/products" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-600" />
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Compare Products ({compareList.length})</h1>
            </div>

            <div className="overflow-x-auto pb-6">
                <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                        <tr>
                            <th className="p-4 text-left bg-slate-50 border-b min-w-[200px]">Features</th>
                            {compareList.map(product => (
                                <th key={product.id} className="p-4 border-b min-w-[250px] relative bg-white">
                                    <button
                                        onClick={() => removeFromCompare(product.id!)}
                                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-32 h-32 mb-4 relative">
                                            <img
                                                src={product.image}
                                                alt={product.title}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-1 line-clamp-2 h-12">{product.title}</h3>
                                        <p className="text-teal-600 font-bold text-lg mb-3">₹{product.finalPrice.toLocaleString('en-IN')}</p>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="w-full bg-teal-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <ShoppingCart className="w-4 h-4" /> Add to Cart
                                        </button>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr>
                            <td className="p-4 font-bold text-slate-700 bg-slate-50">Rating</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="font-bold text-slate-900">{product.rating}</span>
                                        <span className="text-amber-400">★</span>
                                        <span className="text-slate-400 text-sm">({product.reviews})</span>
                                    </div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700 bg-slate-50">Brand</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-slate-600">{product.brand}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700 bg-slate-50">Processor</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-slate-600">{product.specs.processor}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700 bg-slate-50">RAM</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-slate-600">{product.specs.ram}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700 bg-slate-50">Storage</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-slate-600">{product.specs.storage}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700 bg-slate-50">Display</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-slate-600">{product.specs.display}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700 bg-slate-50">Graphics</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-slate-600">{product.specs.graphics}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700 bg-slate-50">Condition</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                        {product.condition || 'Excellent'}
                                    </span>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700 bg-slate-50">Weight</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-slate-600">{(product as any).weightKg ? `${(product as any).weightKg} kg` : '—'}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700 bg-slate-50">Recommended Use</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-slate-600 text-sm">
                                    {((product as any).useCases || []).map((u: string) => USE_CASE_LABEL[u] || u).join(', ') || '—'}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700 bg-slate-50">Warranty</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center text-slate-600">{STORE_POLICIES.warrantyLabel}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="p-4 font-bold text-slate-700 bg-slate-50">Price</td>
                            {compareList.map(product => (
                                <td key={product.id} className="p-4 text-center font-bold text-slate-900">₹{product.finalPrice.toLocaleString('en-IN')}</td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
