"use client";

import React, { useMemo } from 'react';
import { ArrowRight, Truck, ShieldCheck, Cpu, Recycle, CheckCircle, Percent, Monitor, Battery, Keyboard, CreditCard, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { useStore } from '@/context/StoreContext';
import { useUserFeatures } from '@/context/UserFeatureContext';
import { Category } from '@/types';
import { API_URL2 } from '@/api/api';
import Image from 'next/image';
import hero_banner_desktop from '@/assets/hero_banner.png';
import hero_banner_tablet from '@/assets/hero_banner_tab.png';
import hero_banner_mobile from '@/assets/hero_banner_mobile.png';


const BLOG_POSTS = [
    {
        id: 1,
        title: "Refurbished Laptops: A Smart Choice for Sustainable Tech Growth",
        excerpt: "Here’s why investing in refurbished laptops is the eco-friendly move for the future.",
        date: "Mar 3, 2025",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 2,
        title: "How Refurbished Laptops Can Level the Playing Field: Affordable Tech",
        excerpt: "If you're looking for affordable, high-performance tech for education and work, look no further.",
        date: "Mar 3, 2025",
        image: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        title: "How to Maximize the Lifespan of Your Refurbished Laptop: Tips and Tricks",
        excerpt: "In this blog post, we'll walk you through essential maintenance tips for longevity.",
        date: "Mar 3, 2025",
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80"
    }
];

export default function Home() {
    const { products, siteConfig, loading } = useStore();
    const { recentlyViewed } = useUserFeatures();

    // Memoize filters to prevent re-renders
    const trendingProducts = useMemo(() => products.filter(p => p.isTrending).slice(0, 4), [products]);
    const exploreProducts = useMemo(() => products.filter(p => !p.isTrending && p.category !== Category.ACCESSORIES).slice(0, 8), [products]);
    const bestDeals = useMemo(() => products.filter(p => p.isBestDeal), [products]);

    if (loading || !siteConfig) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }
    const hero_banner = {
        mobile: hero_banner_mobile,
        tablet: hero_banner_tablet,
        desktop: hero_banner_desktop,
    };


    const { hero, banners, sections } = siteConfig;

    return (
        <div className="space-y-16 md:space-y-24 pb-24 bg-gray-50/50">

            {/* 
            {sections?.hero && (
                <section className="relative bg-white overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <div className="flex flex-col lg:flex-row items-center pt-8 pb-12 lg:pt-32 lg:pb-32">
                            <div className="lg:w-1/2 space-y-6 md:space-y-8 z-10 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-green-100 shadow-sm rounded-full px-3 py-1 md:px-4 md:py-1.5 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-green-700 font-bold text-[10px] md:text-xs uppercase tracking-widest">Certified Sustainable Tech</span>
                                </div>
                                <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/50 shadow-xl shadow-gray-100/50">
                                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-[1.1] text-slate-900 tracking-tight mb-4 whitespace-pre-line">
                                        {hero.title}
                                    </h1>
                                    <p className="text-gray-500 text-base md:text-lg lg:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                        {hero.subtitle}
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 md:gap-4 pt-2 w-full px-4 lg:px-0">
                                    <Link href="/products" className="w-full sm:w-auto bg-slate-900 hover:bg-blue-600 text-white px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 hover:shadow-blue-200 flex items-center justify-center group text-sm md:text-base">
                                        Shop Collection <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link href="/products?category=Business" className="w-full sm:w-auto bg-white text-slate-900 px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-sm md:text-base flex items-center justify-center">
                                        Business Deals
                                    </Link>
                                </div>
                            </div>

                            <div className="lg:w-1/2 mt-12 md:mt-16 lg:mt-0 relative flex justify-center w-full">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] md:w-[120%] md:h-[120%] bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-[60px] md:blur-[100px]"></div>
                                <div className="relative z-10 animate-[slide-up_1s_ease-out] w-full max-w-[320px] md:max-w-[600px]">
                                    <Image
                                        src={hero_banner.desktop}
                                        alt="Hero Laptop"
                                        loading="eager"
                                        className="w-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.15)] md:drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)] transform hover:scale-105 transition-transform duration-700"
                                    />

                                    {/* Floating Badge */}
            {/* <div className="absolute -bottom-4 -left-2 md:-bottom-6 md:-left-6 bg-white/80 backdrop-blur-md border border-white/50 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl flex items-center gap-3 md:gap-4 animate-bounce duration-[3000ms]">
                                        <div className="bg-emerald-100 p-2 md:p-2.5 rounded-lg md:rounded-xl text-emerald-600">
                                            <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quality Check</p>
                                            <p className="font-bold text-slate-900 text-xs md:text-base">{hero.badgeText}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )} */}

            {/* Services Grid */}
            {sections?.services && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                        {[
                            { icon: Truck, title: "Free Delivery", desc: "On orders above ₹10,000", color: "text-blue-600 bg-blue-50" },
                            { icon: ShieldCheck, title: "1-Year Warranty", desc: "Comprehensive coverage", color: "text-green-600 bg-green-50" },
                            { icon: Recycle, title: "Eco-Conscious", desc: "100% Sustainable packaging", color: "text-emerald-600 bg-emerald-50" },
                            { icon: Cpu, title: "Expert Support", desc: "Lifetime tech assistance", color: "text-purple-600 bg-purple-50" },
                        ].map((f, i) => (
                            <div key={i} className="group p-6 rounded-3xl bg-white border border-gray-100 hover:border-transparent hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1">
                                <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <f.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
            {/* Brand Logos Strip */}
            {sections?.brands && (
                <div className="border-y border-gray-100 bg-white/50 py-8 md:py-12">
                    <div className="max-w-7xl mx-auto px-4 overflow-hidden">
                        <div className="grid grid-cols-3 md:flex md:justify-between items-center gap-8 md:gap-12 opacity-60 hover:opacity-100 transition-opacity duration-500 grayscale hover:grayscale-0 place-items-center">
                            {[
                                { name: 'Apple', url: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
                                { name: 'Dell', url: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg' },
                                { name: 'Lenovo', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg' },
                                { name: 'HP', url: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg' },
                                { name: 'Asus', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/ASUS_Logo.svg' },
                                { name: 'Microsoft', url: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg' },
                            ].map(brand => (
                                <img
                                    key={brand.name}
                                    src={brand.url}
                                    alt={brand.name}
                                    loading="lazy"
                                    className="h-6 md:h-10 w-auto object-contain flex-shrink-0"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Explore Products Grid */}
            {sections?.explore && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-6 md:mb-10">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Explore Products</h2>
                            <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">Discover our full range of certified tech.</p>
                        </div>
                        <Link href="/products" className="flex items-center text-blue-600 font-bold hover:text-blue-700 transition-colors text-sm md:text-base">
                            View All <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
                        {exploreProducts.map(p => <ProductCard key={p.productId} product={p} />)}
                    </div>
                </section>
            )}

            {/* Dynamic Grid Banners */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {banners?.map((banner, i) => (
                        <div key={i} className="group relative h-[250px] md:h-[360px] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-xl cursor-pointer">
                            <img
                                src={banner.image}
                                alt={banner.title}
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className={`absolute inset-0 bg-gradient-to-t ${banner.bg} opacity-90 mix-blend-multiply`}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

                            <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                                <h3 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2 tracking-tight">{banner.title}</h3>
                                <p className="text-gray-300 mb-4 md:mb-8 font-medium text-xs md:text-base">{banner.desc}</p>
                                <Link
                                    href={banner.link}
                                    className="inline-flex items-center bg-white text-slate-900 px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:bg-gray-100 transition-all group-hover:gap-3"
                                >
                                    Shop Now <ArrowRight className="ml-2 w-3 h-3 md:w-4 md:h-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* EMI Banner */}
            {sections?.emi && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-[#0B0F19] rounded-2xl md:rounded-[2.5rem] overflow-hidden relative shadow-2xl">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 items-center relative z-10 p-8 md:p-12 lg:p-20 gap-8 lg:gap-12">
                            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md">
                                    <Percent className="w-4 h-4 text-yellow-400" />
                                    <span className="text-yellow-400 font-bold text-xs uppercase tracking-widest">Zero Cost EMI</span>
                                </div>

                                <h2 className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                                    Own it now.<br />
                                    <span className="text-indigo-400">Pay later.</span>
                                </h2>

                                <p className="text-slate-400 text-base md:text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">
                                    Upgrade without the upfront cost. Flexible monthly plans starting at just <span className="text-white font-bold">₹2,500/mo</span> with no hidden fees.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                                    <Link href="/products" className="bg-white text-slate-900 px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center gap-2">
                                        Check Eligibility
                                    </Link>
                                </div>
                            </div>

                            <div className="hidden lg:flex justify-end relative">
                                {/* Glassmorphism Card */}
                                <div className="w-96 h-60 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl transform rotate-6 hover:rotate-3 transition-transform duration-500 relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <CreditCard className="w-10 h-10 text-white/80" />
                                        <span className="text-white/60 font-mono tracking-widest text-sm">PREMIUM</span>
                                    </div>
                                    <div className="mt-8">
                                        <p className="text-white font-mono text-2xl tracking-widest opacity-90">•••• •••• •••• 4242</p>
                                    </div>
                                    <div className="flex justify-between items-end mt-8">
                                        <div>
                                            <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Card Holder</p>
                                            <p className="text-sm text-white font-bold tracking-wide">LAPSHARK MEMBER</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-yellow-500/80"></div>
                                    </div>
                                </div>

                                {/* Decorative Elements */}
                                <div className="absolute top-10 right-10 w-20 h-20 bg-blue-500 rounded-full blur-xl opacity-50"></div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500 rounded-full blur-2xl opacity-30"></div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Trending Products Grid */}
            {sections?.trending && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-6 md:mb-10">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Trending Now</h2>
                            <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">The most sought-after tech this week.</p>
                        </div>
                        <Link href="/products" className="flex items-center text-blue-600 font-bold hover:text-blue-700 transition-colors text-sm md:text-base">
                            View All <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
                        {trendingProducts.map(p => <ProductCard key={p.productId} product={p} />)}
                    </div>
                </section>
            )}

            {/* Flash Sale */}
            {sections?.flashSale && (
                <section className="bg-slate-900 text-white py-12 md:py-24 overflow-hidden relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex items-end justify-between mb-8 md:mb-12">
                            <div>
                                <span className="text-blue-400 font-bold tracking-widest uppercase text-xs mb-2 block">Exclusive Offers</span>
                                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Flash Sale</h2>
                            </div>
                            <Link href="/products" className="hidden md:flex items-center text-sm font-bold text-gray-400 hover:text-white transition-colors">
                                View All <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                        </div>

                        <div className="flex overflow-x-auto snap-x gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-8 scrollbar-hide md:overflow-visible">
                            {bestDeals.slice(0, 6).map((product) => (
                                <div key={product.productId} className="min-w-[280px] snap-center bg-slate-800/50 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-700 hover:border-slate-500 transition-all duration-300 group">
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">Save {product.discountPercent}%</span>
                                    </div>

                                    <div className="h-40 md:h-48 mb-6 md:mb-8 flex items-center justify-center">
                                        <img src={API_URL2 + product.image} alt={product.title} loading="lazy" className="max-h-full max-w-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
                                    </div>

                                    <h3 className="text-base md:text-lg font-bold mb-2 line-clamp-1">{product.title}</h3>
                                    <div className="flex items-baseline gap-3 mb-6">
                                        <span className="text-xl md:text-2xl font-bold text-white">₹{product.finalPrice.toLocaleString('en-IN')}</span>
                                        <span className="text-xs md:text-sm text-slate-500 line-through">₹{product.price.toLocaleString('en-IN')}</span>
                                    </div>

                                    <Link href={`/products/${product.productId}`} className="w-full block text-center bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm md:text-base">
                                        View Details
                                    </Link>
                                </div>
                            ))}
                        </div>
                        <Link href="/products" className="md:hidden flex items-center justify-center text-sm font-bold text-gray-400 mt-4">
                            View All Deals <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </div>
                </section>
            )}

            {/* Quality Comparison */}
            {sections?.comparison && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 rounded-3xl md:rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100">
                        <div className="bg-slate-950 text-white p-8 md:p-12 lg:p-20 flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

                            <div className="relative z-10">
                                <h3 className="text-3xl md:text-4xl font-extrabold mb-8 md:mb-12 tracking-tight">
                                    The Lapshark<br />
                                    <span className="text-green-500">Standard.</span>
                                </h3>

                                <div className="grid grid-cols-2 gap-6 md:gap-10">
                                    {[
                                        { icon: Monitor, title: "Pristine Screens", desc: "Zero dead pixels" },
                                        { icon: Battery, title: "80%+ Battery", desc: "Guaranteed health" },
                                        { icon: ShieldCheck, title: "Flawless Body", desc: "No visible dents" },
                                        { icon: Keyboard, title: "Clean Keys", desc: "Sanitized & tested" }
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-3">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-green-500">
                                                <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm md:text-lg">{item.title}</h4>
                                                <p className="text-slate-400 text-xs md:text-sm">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-100 p-8 md:p-12 lg:p-20 flex flex-col items-center justify-center relative">
                            <div className="text-center z-10 mb-6 md:mb-10">
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Others</h3>
                                <p className="text-gray-500">Risky. Unverified. Dirty.</p>
                            </div>

                            <div className="relative w-full max-w-[200px] md:max-w-sm mx-auto grayscale opacity-70">
                                <img
                                    src="https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"
                                    alt="Competitor"
                                    loading="lazy"
                                    className="w-full h-auto object-contain mix-blend-multiply"
                                />
                                <div className="absolute top-1/4 right-1/4 bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full animate-pulse shadow-lg">
                                    Risk!
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}



            {/* Blogs */}
            {sections?.blogs && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center text-center mb-8 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 md:mb-4 tracking-tight">Latest Insights</h2>
                        <p className="text-gray-500 max-w-2xl text-sm md:text-base">Expert advice on getting the most out of your tech.</p>
                    </div>

                    <div className="flex overflow-x-auto snap-x gap-4 pb-4 md:grid md:grid-cols-3 md:gap-8 scrollbar-hide md:overflow-visible">
                        {BLOG_POSTS.map(post => (
                            <div key={post.id} className="min-w-[280px] snap-center group cursor-pointer">
                                <div className="overflow-hidden rounded-2xl md:rounded-3xl mb-4 md:mb-6 relative aspect-[4/3]">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                </div>
                                <div className="space-y-2 md:space-y-3">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{post.date}</span>
                                    <h3 className="font-bold text-lg md:text-xl text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>
                                    <p className="text-gray-500 text-xs md:text-sm line-clamp-2 leading-relaxed">
                                        {post.excerpt}
                                    </p>
                                    <div className="pt-2">
                                        <span className="inline-flex items-center text-sm font-bold text-slate-900 group-hover:underline">
                                            Read Article <ChevronRight className="w-4 h-4 ml-1" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}


        </div>
    );
};
