"use client";

import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Calendar, User, Clock, ArrowRight } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useStore } from '@/context/StoreContext';
import Link from 'next/link';

export default function Blogs({ initialBlogs = [] }: { initialBlogs?: any[] }) {
    const { blogs: storeBlogs } = useStore();
    const [searchTerm, setSearchTerm] = useState('');

    // Server-rendered posts until the store hydrates.
    const blogs = storeBlogs?.length ? storeBlogs : initialBlogs;

    // Filter blogs based on search term
    const filteredBlogs = useMemo(() => {
        if (!searchTerm.trim()) {
            return blogs;
        }

        const searchLower = searchTerm.toLowerCase();
        return blogs.filter((post) =>
            post.title.toLowerCase().includes(searchLower) ||
            post.excerpt.toLowerCase().includes(searchLower)
        );
    }, [blogs, searchTerm]);

    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <SEO
                title="Blog & Resources - LaptopWorld"
                description="Insights, tech tips, and the latest news on refurbished laptops and sustainable technology."
            />

            {/* Hero Header */}
            <div className="bg-slate-900 text-white py-16 md:py-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>

                <div className="max-w-[7xl] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">The Lapshark Journal</h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                        Exploring the intersection of performance, sustainability, and value.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-10 relative z-20">
                {/* Controls Bar */}
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-100 p-4 md:p-6 mb-12">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <input
                                type="text"
                                placeholder="Search articles..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm md:text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                </div>

                {/* Blog Grid */}
                {filteredBlogs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
                        {filteredBlogs.map((post) => (
                            <Link href={`/blog/${post.slug}`} key={post._id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-500 flex flex-col h-full">
                                <div className="aspect-[16/10] overflow-hidden relative">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="absolute inset-0 w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                                    />
                                </div>


                                <div className="p-6 md:p-8 flex flex-col flex-1">
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(post.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}</span>
                                    </div>

                                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 group-hover:text-teal-600 transition-colors leading-tight">
                                        {post.title}
                                    </h3>

                                    <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 line-clamp-3">
                                        {post.excerpt}
                                    </p>

                                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                        {/* <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs border border-teal-100">
                                          {post.author.charAt(0)}
                                      </div>
                                      <span className="text-sm font-bold text-slate-700">{post.author}</span>
                                  </div> */}
                                        <span className="text-teal-600 group-hover:translate-x-2 transition-transform">
                                            <ArrowRight className="w-5 h-5" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <Search className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">No articles found</h2>
                        <p className="text-slate-500">Try adjusting your search or filters.</p>
                        <button
                            onClick={() => { setSearchTerm(''); }}
                            className="mt-6 text-teal-600 font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Newsletter Strip */}
            <div className="bg-slate-900 py-20 text-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">Stay ahead of the curve</h2>
                    <p className="text-slate-400 mb-8">Get our monthly digest of tech tips and exclusive refurbished deals.</p>
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-3 rounded-xl transition-all">
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}