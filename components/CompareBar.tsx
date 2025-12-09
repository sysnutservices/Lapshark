"use client";

import React from 'react';
import { useUserFeatures } from '@/context/UserFeatureContext';
import { X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { API_URL2 } from '@/api/api';

export const CompareBar: React.FC = () => {
    const { compareList, removeFromCompare, clearCompare } = useUserFeatures();

    if (compareList.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 animate-in slide-in-from-bottom-5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">

                <div className="flex items-center space-x-6">
                    <div className="hidden md:block">
                        <h3 className="text-sm font-bold text-gray-900">Compare Products</h3>
                        <p className="text-xs text-gray-500">{compareList.length} of 3 selected</p>
                    </div>

                    {compareList.map((product, index) => (
                        <div key={product.id || product.productId || index} className="relative group">
                            <div className="w-12 h-12 rounded-lg border border-gray-200 p-1 bg-white">
                                <img
                                    src={API_URL2 + product.image}
                                    alt={product.title}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <button
                                onClick={() => removeFromCompare(product.id || product.productId)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={clearCompare}
                        className="text-sm text-gray-500 hover:text-red-600 font-medium underline"
                    >
                        Clear All
                    </button>
                    <Link
                        href="/compare"
                        className={`flex items-center px-6 py-2 rounded-lg font-bold transition-all ${compareList.length > 1
                            ? 'bg-black text-white hover:bg-gray-900 shadow-lg'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        onClick={(e) => compareList.length < 2 && e.preventDefault()}
                    >
                        Compare Now <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </div>

            </div>
        </div>
    );
};