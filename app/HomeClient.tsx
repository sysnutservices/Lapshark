"use client";

import React, { useMemo, useState } from 'react';
import { ArrowRight, Truck, ShieldCheck, Cpu, Recycle, Monitor, Battery, Keyboard, CreditCard, ChevronRight, Search, PackageCheck, Smile, Phone, MessageCircle, Briefcase, Gamepad2, Laptop, ServerCog, GraduationCap, Headphones } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { useStore } from '@/context/StoreContext';
import { useUserFeatures } from '@/context/UserFeatureContext';
import { Category } from '@/types';
import { CheckoutLogin } from '@/components/LoginComponent';
import { useRouter } from 'next/navigation';
import { api } from '@/api/api';
import { LoanEnquiryAlreadySuccess, LoanEnquirySuccess } from '@/components/Enquiry';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Reveal } from '@/components/Reveal';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { HomeSkeleton } from '@/components/HomeSkeleton';
import { TrustStats } from '@/components/ecommerce/TrustStats';
import { TrustStrip } from '@/components/ecommerce/TrustStrip';
import { LaptopFinder } from '@/components/ecommerce/LaptopFinder';
import { ShopByNeed } from '@/components/ecommerce/ShopByNeed';
import { BudgetExplorer } from '@/components/ecommerce/BudgetExplorer';
import { TrustComparison } from '@/components/ecommerce/TrustComparison';
import { ValueComparison } from '@/components/ecommerce/ValueComparison';
import { Reviews } from '@/components/ecommerce/Reviews';
import { ExpertPicks } from '@/components/ecommerce/ExpertPicks';
import { STORE_POLICIES } from '@/lib/policies';
import * as motion from 'motion/react-m';
import appleLogo from '@/assets/brands/apple.svg';
import dellLogo from '@/assets/brands/dell.svg';
import lenovoLogo from '@/assets/brands/lenovo.svg';
import hpLogo from '@/assets/brands/hp.svg';
import asusLogo from '@/assets/brands/asus.svg';
import microsoftLogo from '@/assets/brands/microsoft.svg';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';

function SectionHeader({
    title,
    subtitle,
    eyebrow,
    href,
    dark = false,
}: {
    title: string;
    subtitle?: string;
    eyebrow?: string;
    href: string;
    dark?: boolean;
}) {
    return (
        <div className="flex items-end justify-between mb-6 md:mb-10">
            <div>
                {eyebrow && (
                    <span className="text-teal-400 font-bold tracking-widest uppercase text-xs mb-2 block">{eyebrow}</span>
                )}
                <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>{title}</h2>
                {subtitle && (
                    <p className={`mt-1 md:mt-2 text-sm md:text-base ${dark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>
                )}
            </div>
            <Link
                href={href}
                className={cn(
                    buttonVariants({ variant: "link" }),
                    "hidden sm:inline-flex h-auto p-0 text-sm md:text-base font-bold",
                    dark ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"
                )}
            >
                View All <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
        </div>
    );
}

export default function Home({
    initialProducts = [],
    initialSiteConfig = null,
}: { initialProducts?: any[]; initialSiteConfig?: any }) {
    const router = useRouter();
    const { products: storeProducts, siteConfig: storeSiteConfig, loading, blogs } = useStore();
    const siteConfig = storeSiteConfig ?? initialSiteConfig;
    // Server-rendered products until the store hydrates, so the homepage grids
    // are present in the initial HTML for crawlers.
    const products = storeProducts.length ? storeProducts : initialProducts;
    const { recentlyViewed } = useUserFeatures();
    const [showLogin, setShowLogin] = useState(false);
    const [showEnquiry, setShowEnquiry] = useState(false);
    const [showEnquirySubmitted, setShowEnquirySubmitted] = useState(false);
    const handleLoginSuccess = async () => {
        setShowLogin(false);
    };

    // Memoize filters to prevent re-renders
    const trendingProducts = useMemo(() => products.filter(p => p.isTrending).slice(0, 4), [products]);
    const exploreProducts = useMemo(() => products.filter(p => !p.isTrending && p.category !== Category.ACCESSORIES).slice(0, 8), [products]);
    const bestDeals = useMemo(() => products.filter(p => p.isBestDeal), [products]);

    // Only show the skeleton when we genuinely have nothing to render; with
    // server-supplied config + products the real markup ships in the HTML.
    if (!siteConfig || (loading && products.length === 0)) {
        return <HomeSkeleton />;
    }

    const handleSubmit = async () => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        const mobile = user?.mobile;

        if (!token) {
            setShowLogin(true);
            return;
        }

        if (!mobile) {
            console.error("Mobile missing");
            return;
        }

        try {
            const response = await api.post(
                "/loan/enquiry",
                { phone: `91${mobile}` },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // ✅ Fresh submission (200)
            if (response.data.success) {
                setShowEnquiry(true);
            }
        } catch (error: any) {
            const status = error.response?.status;

            // ✅ Already submitted (409)
            if (status === 409) {
                setShowEnquirySubmitted(true);
                return;
            }

            // ❌ Real error
            console.error("Loan enquiry error:", error);
        }
    };


    const { banners, sections } = siteConfig;

    return (
        <div className="space-y-12 md:space-y-16 pb-16 bg-slate-50/50">

            {/* Services Grid */}
            {sections?.services && (
                <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card className="gap-0 rounded-3xl p-0 ring-slate-100 overflow-hidden">
                        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
                            {[
                                { icon: Truck, title: "Free Delivery", desc: "On orders above ₹10,000" },
                                { icon: ShieldCheck, title: STORE_POLICIES.warrantyLabel, desc: "Comprehensive coverage" },
                                { icon: Recycle, title: "Eco-Conscious", desc: "100% Sustainable packaging" },
                                { icon: Cpu, title: "Expert Support", desc: "Lifetime tech assistance" },
                            ].map((f, i) => (
                                <div
                                    key={i}
                                    className="group flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4 p-5 md:p-7 text-center md:text-left hover:bg-teal-50/40 transition-colors duration-300"
                                >
                                    <div className="w-11 h-11 md:w-12 md:h-12 flex-shrink-0 bg-teal-50 text-teal-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                                        <f.icon className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm md:text-base font-bold text-slate-900 mb-0.5 md:mb-1">{f.title}</h3>
                                        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Reveal>
            )}
            {/* Brand Logos Strip */}
            {sections?.brands && (
                <Reveal className="border-y border-slate-100 bg-white/50 py-8 md:py-12">
                    <div className="max-w-7xl mx-auto px-4 overflow-hidden">
                        <div className="grid grid-cols-3 md:flex md:justify-between items-center gap-8 md:gap-12 place-items-center">
                            {[
                                { name: 'Apple', src: appleLogo.src },
                                { name: 'Dell', src: dellLogo.src },
                                { name: 'Lenovo', src: lenovoLogo.src },
                                { name: 'HP', src: hpLogo.src },
                                { name: 'Asus', src: asusLogo.src },
                                { name: 'Microsoft', src: microsoftLogo.src },
                            ].map(brand => (
                                <img
                                    key={brand.name}
                                    src={brand.src}
                                    alt={brand.name}
                                    loading="lazy"
                                    className="h-6 md:h-10 w-auto object-contain flex-shrink-0"
                                />
                            ))}
                        </div>
                    </div>
                </Reveal>
            )}

            {/* Trust Strip — compact scan, distinct from the stats band below */}
            <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <TrustStrip />
            </Reveal>

            {/* Trust Stats Band */}
            <Reveal className="bg-slate-900 py-12 md:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <TrustStats />
                </div>
            </Reveal>

            {/* Find Your Perfect Laptop — guided recommendation quiz */}
            <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-6 md:mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Find Your Perfect Laptop</h2>
                    <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-500">Answer two quick questions, get laptops actually matched to you.</p>
                </div>
                <LaptopFinder products={products} />
            </Reveal>

            {/* Shop by Need */}
            <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 md:mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Shop by Your Need</h2>
                    <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-500">Jump straight to laptops picked for what you'll actually use them for.</p>
                </div>
                <ShopByNeed />
            </Reveal>

            {/* Expert Picks — computed from live inventory, see ExpertPicks.tsx */}
            <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 md:mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Best Picks Right Now</h2>
                    <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-500">Hand-picked from what's actually in stock today.</p>
                </div>
                <ExpertPicks products={products} />
            </Reveal>

            {/* What Can I Buy For My Budget? */}
            <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 md:mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">What Can I Buy For My Budget?</h2>
                    <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-500">See what's realistic at each price point before you shop.</p>
                </div>
                <BudgetExplorer products={products} />
            </Reveal>

            {/* Shop by Category */}
            <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 md:mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Shop by Category</h2>
                    <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-500">Find the right laptop for exactly what you need.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5">
                    {[
                        { icon: Briefcase, label: Category.BUSINESS, from: "from-teal-500", to: "to-emerald-600", tint: "bg-teal-50", ring: "ring-teal-100", text: "text-teal-600" },
                        { icon: Gamepad2, label: Category.GAMING, from: "from-violet-500", to: "to-fuchsia-600", tint: "bg-violet-50", ring: "ring-violet-100", text: "text-violet-600" },
                        { icon: Laptop, label: Category.ULTRABOOKS, from: "from-sky-500", to: "to-blue-600", tint: "bg-sky-50", ring: "ring-sky-100", text: "text-sky-600" },
                        { icon: ServerCog, label: Category.WORKSTATIONS, from: "from-slate-600", to: "to-slate-800", tint: "bg-slate-100", ring: "ring-slate-200", text: "text-slate-700" },
                        { icon: GraduationCap, label: Category.STUDENT, from: "from-amber-500", to: "to-orange-600", tint: "bg-amber-50", ring: "ring-amber-100", text: "text-amber-600" },
                        { icon: Headphones, label: Category.ACCESSORIES, from: "from-rose-500", to: "to-pink-600", tint: "bg-rose-50", ring: "ring-rose-100", text: "text-rose-600" },
                    ].map((cat, i) => (
                        <Link
                            key={i}
                            href={`/products?category=${encodeURIComponent(cat.label)}`}
                            className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 md:p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)]"
                        >
                            <div className={cn("pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-25 bg-gradient-to-br", cat.from, cat.to)} />
                            <div className={cn("relative flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl ring-1 transition-all duration-300", cat.tint, cat.ring, "group-hover:ring-0 group-hover:bg-gradient-to-br", cat.from, cat.to)}>
                                <cat.icon className={cn("h-6 w-6 md:h-7 md:w-7 transition-colors duration-300 group-hover:text-white", cat.text)} />
                            </div>
                            <span className="relative text-xs md:text-sm font-bold text-slate-900 leading-tight">{cat.label}</span>
                        </Link>
                    ))}
                </div>
            </Reveal>

            {/* Explore Products Grid */}
            {sections?.explore && (
                <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader
                        title="Explore Products"
                        subtitle="Discover our full range of certified tech."
                        href="/products"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
                        {exploreProducts.map((p, i) => (
                            <motion.div
                                key={p.productId}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.3), ease: "easeOut" }}
                            >
                                <ProductCard product={p} context="homepage" />
                            </motion.div>
                        ))}
                    </div>
                </Reveal>
            )}

            {/* Dynamic Grid Banners */}
            <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {banners?.map((banner, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                            className="group relative h-[250px] md:h-[360px] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-xl cursor-pointer">
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
                                <p className="text-slate-300 mb-4 md:mb-8 font-medium text-xs md:text-base">{banner.desc}</p>
                                <Link
                                    href={banner.link}
                                    className={cn(
                                        buttonVariants(),
                                        "h-auto rounded-lg md:rounded-xl px-4 py-2 md:px-6 md:py-3 text-xs md:text-sm bg-white text-slate-900 hover:bg-slate-100 group-hover:gap-3"
                                    )}
                                >
                                    Shop Now <ArrowRight className="ml-2 w-3 h-3 md:w-4 md:h-4" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Reveal>

            {/* How It Works */}
            <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10 md:mb-14">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">How It Works</h2>
                    <p className="mt-2 text-sm md:text-base text-slate-500">From browsing to your doorstep, in three simple steps.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
                    <div className="hidden md:block absolute top-8 left-[16.5%] right-[16.5%] h-0.5 border-t-2 border-dashed border-teal-200" />
                    {[
                        { icon: Search, step: "01", title: "Browse & Select", desc: "Filter by budget, brand, or specs to find the laptop that fits your needs." },
                        { icon: PackageCheck, step: "02", title: "Verified & Delivered", desc: "Every unit passes a 40+ point inspection before it ships to your door." },
                        { icon: Smile, step: "03", title: "Use with Confidence", desc: `Backed by a ${STORE_POLICIES.warrantyMonths}-month warranty and ${STORE_POLICIES.returnDays}-day easy returns.` },
                    ].map((s, i) => (
                        <div key={i} className="relative flex flex-col items-center text-center">
                            <div className="relative z-10 w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-200">
                                <s.icon className="w-7 h-7" />
                            </div>
                            <span className="mt-4 text-xs font-bold text-teal-600 tracking-widest">STEP {s.step}</span>
                            <h3 className="mt-1 text-lg font-bold text-slate-900">{s.title}</h3>
                            <p className="mt-2 text-sm text-slate-500 max-w-xs leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </Reveal>

            {/* EMI Banner */}
            {sections?.emi && (
                <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-[#0B0F19] rounded-2xl md:rounded-[2.5rem] overflow-hidden relative shadow-2xl">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 items-center relative z-10 p-8 md:p-12 lg:p-20 gap-8 lg:gap-12">
                            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
                                <Badge className="h-auto gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-teal-400 backdrop-blur-md hover:bg-teal-500/10">
                                    <CreditCard className="w-4 h-4" />
                                    <span className="font-bold text-xs uppercase tracking-widest">EMI Available</span>
                                </Badge>

                                {/* Led with the provider name before — ties the whole banner to
                                    one financing partner as the headline hook. Provider-neutral
                                    now so a second EMI option later doesn't require rewriting
                                    this section; Bajaj Finserv is still named honestly below,
                                    just not as the first thing read. */}
                                <h2 className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                                    Buy Now.<br />
                                    <span className="text-teal-400">Pay Monthly.</span>
                                </h2>

                                <p className="text-slate-400 text-base md:text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">
                                    EMI options available on eligible purchases via Bajaj Finserv EMI Card — flexible tenure from <span className="text-white font-bold">3 to 24 months</span> at attractive interest rates.
                                </p>

                                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                                        <p className="text-2xl font-bold text-white">No Cost</p>
                                        <p className="text-xs text-slate-400 mt-1">EMI Available</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                                        <p className="text-2xl font-bold text-white">Instant</p>
                                        <p className="text-xs text-slate-400 mt-1">Approval</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                                    <Button
                                        onClick={() => handleSubmit()}
                                        className="h-auto rounded-xl md:rounded-2xl px-8 py-3.5 md:py-4 bg-teal-600 hover:bg-teal-700 shadow-lg"
                                    >
                                        Check Eligibility
                                    </Button>
                                </div>
                                {showLogin && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                        {/* Centered Login Card */}
                                        <div className="w-full max-w-md mx-4">
                                            <CheckoutLogin onLoginSuccess={handleLoginSuccess} closeLogin={() => { setShowLogin(false) }} />
                                        </div>
                                    </div>
                                )}
                                {showEnquiry && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                        {/* Centered Login Card */}
                                        <div className="w-full max-w-md mx-4">
                                            <LoanEnquirySuccess closeEnquiry={() => setShowEnquiry(false)} />
                                        </div>
                                    </div>
                                )}
                                {showEnquirySubmitted && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                        {/* Centered Login Card */}
                                        <div className="w-full max-w-md mx-4">
                                            <LoanEnquiryAlreadySuccess closeEnquiry={() => setShowEnquirySubmitted(false)} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="hidden lg:flex justify-end relative">
                                {/* Bajaj Finserv Card */}
                                <div className="w-96 h-60 bg-gradient-to-br from-teal-600/20 to-teal-800/20 backdrop-blur-xl border border-teal-500/30 rounded-3xl p-8 shadow-2xl transform rotate-6 hover:rotate-3 transition-transform duration-500 relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <p className="text-white font-bold text-lg">Bajaj Finserv</p>
                                            <p className="text-teal-300 text-xs font-medium">EMI CARD</p>
                                        </div>
                                        <CreditCard className="w-10 h-10 text-teal-400" />
                                    </div>
                                    <div className="mt-8">
                                        <p className="text-white font-mono text-2xl tracking-widest opacity-90">•••• •••• •••• 8888</p>
                                    </div>
                                    <div className="flex justify-between items-end mt-8">
                                        <div>
                                            <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Card Member</p>
                                            <p className="text-sm text-white font-bold tracking-wide">LAPSHARK CUSTOMER</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <div className="w-8 h-8 rounded-full bg-red-600/80"></div>
                                            <div className="w-8 h-8 rounded-full bg-yellow-600/80 -ml-4"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative Elements */}
                                <div className="absolute top-10 right-10 w-20 h-20 bg-teal-500 rounded-full blur-xl opacity-50"></div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-600 rounded-full blur-2xl opacity-30"></div>
                            </div>
                        </div>
                    </div>
                </Reveal>
            )}

            {/* Trending Products Grid */}
            {sections?.trending && (
                <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader
                        title="Trending Now"
                        subtitle="The most sought-after tech this week."
                        href="/products"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
                        {trendingProducts.map((p, i) => (
                            <motion.div
                                key={p.productId}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.3), ease: "easeOut" }}
                            >
                                <ProductCard product={p} context="homepage" />
                            </motion.div>
                        ))}
                    </div>
                </Reveal>
            )}

            {/* Flash Sale */}
            {sections?.flashSale && (
                <Reveal className="bg-slate-900 text-white py-12 md:py-24 overflow-hidden relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                        <SectionHeader
                            eyebrow="Exclusive Offers"
                            title="Flash Sale"
                            href="/products"
                            dark
                        />

                        <Carousel opts={{ align: "start", dragFree: true }} className="md:static">
                            <CarouselContent className="md:mx-0">
                                {bestDeals.slice(0, 6).map((product) => (
                                    <CarouselItem key={product.productId} className="basis-[280px] md:basis-1/3">
                                        <Card className="h-full gap-0 rounded-2xl md:rounded-3xl bg-slate-800/50 p-5 md:p-6 ring-slate-700 backdrop-blur-sm hover:ring-slate-500 transition-all duration-300 group">
                                            <div className="flex justify-between items-start mb-6">
                                                <Badge className="rounded-md bg-rose-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-rose-500">
                                                    Save {Math.round(product.discountPercent)}%
                                                </Badge>
                                            </div>

                                            <div className="h-40 md:h-48 mb-6 md:mb-8 flex items-center justify-center">
                                                <img src={product.image} alt={product.title} loading="lazy" className="max-h-full max-w-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
                                            </div>

                                            <h3 className="text-base md:text-lg font-bold mb-2 line-clamp-1 text-white">{product.title}</h3>
                                            <div className="flex items-baseline gap-3 mb-6">
                                                <span className="text-xl md:text-2xl font-bold text-white">₹{product.finalPrice.toLocaleString('en-IN')}</span>
                                                <span className="text-xs md:text-sm text-slate-500 line-through">₹{product.price.toLocaleString('en-IN')}</span>
                                            </div>

                                            <Link
                                                href={`/products/${product.slug}`}
                                                className={cn(
                                                    buttonVariants(),
                                                    "w-full h-auto rounded-xl bg-white py-3 text-sm md:text-base text-slate-900 hover:bg-teal-50"
                                                )}
                                            >
                                                View Details
                                            </Link>
                                        </Card>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden md:flex -left-4 border-slate-700 bg-slate-800 text-white hover:bg-slate-700" />
                            <CarouselNext className="hidden md:flex -right-4 border-slate-700 bg-slate-800 text-white hover:bg-slate-700" />
                        </Carousel>
                        <Link
                            href="/products"
                            className={cn(
                                buttonVariants({ variant: "link" }),
                                "md:hidden h-auto w-full justify-center p-0 mt-4 text-sm font-bold text-slate-400"
                            )}
                        >
                            View All Deals <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </div>
                </Reveal>
            )}

            {/* Why Buy From Lapshark — was a vague "Others / Risky. Unverified.
                Dirty." comparison with an unverified "80%+ Battery Guaranteed"
                claim and a stock photo. Replaced with a concrete, factual
                feature table sourced from STORE_POLICIES so nothing here can
                say more than what's actually backed by real policy. */}
            {sections?.comparison && (
                <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8 md:mb-10">
                        <span className="text-teal-600 font-bold tracking-widest uppercase text-xs mb-2 block">Compare</span>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Why Buy From Lapshark?</h2>
                    </div>
                    <TrustComparison />
                </Reveal>
            )}

            {/* New vs Refurbished value */}
            <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <ValueComparison />
            </Reveal>

            {/* Trusted by Laptop Buyers — renders nothing until there are
                enough genuine reviews to show, see components/ecommerce/Reviews. */}
            <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Reviews />
            </Reveal>

            {/* FAQ */}
            <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 md:mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
                    <p className="mt-2 text-sm md:text-base text-slate-500">Everything you need to know before you buy.</p>
                </div>
                <Accordion multiple className="rounded-2xl border border-slate-100 bg-white px-4 md:px-6 shadow-sm">
                    {[
                        { q: "Do you offer a warranty on refurbished laptops?", a: `Yes, every laptop comes with a ${STORE_POLICIES.warrantyMonths}-month official warranty covering the motherboard, screen, RAM, HDD/SSD, and original accessories.` },
                        { q: "How thoroughly are the laptops tested?", a: `Each unit goes through a ${STORE_POLICIES.qualityCheckPoints}+ point quality inspection covering the screen, battery health, keyboard, ports, and body condition before it's listed for sale.` },
                        { q: "Can I return a laptop if I don't like it?", a: `Yes — you have ${STORE_POLICIES.returnDays} days from delivery, as long as the device is in its original condition with all accessories and the warranty seal intact.` },
                        { q: "Is Cash on Delivery (COD) available?", a: "Yes, COD is available nationwide, along with EMI options at checkout." },
                    ].map((item, i) => (
                        <AccordionItem key={i} value={`faq-${i}`}>
                            <AccordionTrigger className="text-left text-sm md:text-base font-bold text-slate-900">
                                {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-slate-500 leading-relaxed">
                                {item.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </Reveal>

            {/* Blogs */}
            {sections?.blogs && (
                <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-start mb-6 md:mb-10">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 md:mb-4 tracking-tight">Latest Insights</h2>
                            <p className="text-slate-500 max-w-2xl text-sm md:text-base">Expert advice on getting the most out of your tech.</p>
                        </div>
                        <Link
                            href="/blog"
                            className={cn(
                                buttonVariants({ variant: "link" }),
                                "hidden sm:inline-flex h-auto p-0 text-sm md:text-base font-bold text-teal-600 hover:text-teal-700"
                            )}
                        >
                            View All <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>

                    <Carousel opts={{ align: "start", dragFree: true }}>
                        <CarouselContent>
                            {blogs.map(post => (
                                <CarouselItem key={post._id} className="basis-[280px] md:basis-1/3">
                                    <Link href={`/blog/${post.slug}`} className="group cursor-pointer block h-full">
                                        <div className="overflow-hidden rounded-2xl md:rounded-3xl mb-4 md:mb-6 relative aspect-[4/3]">
                                            <img
                                                src={post.image}
                                                alt={post.title}
                                                loading="lazy"
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                            />
                                        </div>
                                        <div className="space-y-2 md:space-y-3">
                                            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">{new Date(post.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}</span>
                                            <h3 className="font-bold text-lg md:text-xl text-slate-900 leading-tight group-hover:text-teal-600 transition-colors line-clamp-2">
                                                {post.title}
                                            </h3>
                                            <p className="text-slate-500 text-xs md:text-sm line-clamp-2 leading-relaxed">
                                                {post.excerpt}
                                            </p>
                                            <div className="pt-2">
                                                <span className="inline-flex items-center text-sm font-bold text-slate-900 group-hover:underline">
                                                    Read Article <ChevronRight className="w-4 h-4 ml-1" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex -left-4" />
                        <CarouselNext className="hidden md:flex -right-4" />
                    </Carousel>
                </Reveal>
            )}

            {/* Closing CTA */}
            <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-teal-600 px-6 py-12 md:px-16 md:py-16 text-center">
                    <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative">
                        <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                            Still deciding? Talk to an expert.
                        </h2>
                        <p className="mt-3 text-sm md:text-base text-teal-100 max-w-xl mx-auto">
                            Our team can help you pick the right laptop for your budget and needs.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a
                                href="tel:+918971319555"
                                className={cn(
                                    buttonVariants(),
                                    "h-auto w-full sm:w-auto rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-teal-700 hover:bg-teal-50"
                                )}
                            >
                                <Phone className="w-4 h-4 mr-2" /> +91 897 131 9555
                            </a>
                            <Link
                                href="/contact"
                                className={cn(
                                    buttonVariants({ variant: "outline" }),
                                    "h-auto w-full sm:w-auto rounded-xl border-white/40 bg-transparent px-8 py-3.5 text-sm font-bold text-white hover:bg-white/10"
                                )}
                            >
                                <MessageCircle className="w-4 h-4 mr-2" /> Contact Us
                            </Link>
                        </div>
                    </div>
                </div>
            </Reveal>

        </div>
    );
};
