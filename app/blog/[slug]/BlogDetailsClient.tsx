"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { useRouter } from 'next/navigation';

// ssr must stay ON: with ssr:false the article body only existed after
// hydration, so every crawler saw a post with no content in it.
const Markdown = dynamic(
    () => import('@uiw/react-md-editor').then((mod) => {
        const m = mod as any;
        return m.default.Markdown || m.Markdown;
    })
) as React.ComponentType<any>;
interface BlogDetailsClientProps {
    slug: string;
    initialBlog?: any;
}

export default function BlogDetailsClient({ slug, initialBlog }: BlogDetailsClientProps) {
    const { blogs } = useStore();
    const router = useRouter();

    // Server-supplied post until the store hydrates, so the article body is in
    // the initial HTML rather than appearing only after JS runs.
    const blog = blogs?.find(b => b.slug === slug) ?? initialBlog;

    // If blog not found, show 404
    if (!blog) {
        return (
            <div className="bg-slate-50 min-h-screen py-12 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Blog Post Not Found</h1>
                    <p className="text-slate-600 mb-6">The blog post you're looking for doesn't exist.</p>
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Blog
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Blog
                </button>

                {/* Blog Header */}
                <article className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Featured Image */}
                    {blog.image && (
                        <div className="relative h-96 w-full">
                            <img
                                src={blog.image}
                                alt={blog.title}
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-8 md:p-12">
                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(blog.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                            <span className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Lapshark Team
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                            {blog.title}
                        </h1>

                        {/* Excerpt */}
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            {blog.excerpt}
                        </p>

                        {/* Divider */}
                        <div className="border-t border-slate-200 my-8" />

                        {/* Markdown Content */}
                        <div className="prose prose-lg prose-slate max-w-none">
                            <Markdown
                                source={blog.content || blog.excerpt}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'inherit'
                                }}
                            />
                        </div>
                    </div>
                </article>

                {/* Share Section */}
                <div className="mt-12 bg-white rounded-2xl p-8 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Share this article</h3>
                    <div className="flex gap-4 flex-wrap">
                        <button
                            onClick={() => {
                                const url = window.location.href;
                                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(blog.title)}`, '_blank');
                            }}
                            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                        >
                            Twitter
                        </button>
                        <button
                            onClick={() => {
                                const url = window.location.href;
                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                            }}
                            className="px-6 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition-colors font-medium"
                        >
                            Facebook
                        </button>
                        <button
                            onClick={() => {
                                const url = window.location.href;
                                window.open(`https://wa.me/?text=${encodeURIComponent(blog.title + ' ' + url)}`, '_blank');
                            }}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}