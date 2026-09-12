'use client';

import { Navbar } from "@/components/Navbar";
import { CompareBar } from "@/components/CompareBar";
import { CookieConsent } from "@/components/CookieConsent";
import Link from "next/link";
import Image from "next/image";
import logo from "../assets/logo_dark.svg";
import { Phone, MapPin, ArrowRight } from "lucide-react";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent, trackPageView } from "@/lib/analytics";
import { STORE_POLICIES } from "@/lib/policies";
import { resolveSupportPhone, resolveSupportPhoneDisplay } from "@/lib/whatsapp";
import { STORE_DIRECTIONS_URL, resolveStoreAddressDisplay } from "@/lib/store";
import { useStore } from "@/context/StoreContext";

const MarqueeBar = () => {
    // "NO COST EMI" was a real overclaim: the EMI banner further down this
    // same page (HomeClient's Bajaj Finserv section) says "at attractive
    // interest rates", which directly contradicts "no cost". Softened to
    // what's actually confirmed (EMI is available) rather than asserting a
    // 0%-interest claim the codebase itself doesn't back up.
    const items = [
        `${STORE_POLICIES.returnDays} DAYS EASY RETURNS`,
        "•",
        "COD AVAILABLE NATIONWIDE",
        "•",
        "EMI AVAILABLE",
        "•",
        `${STORE_POLICIES.warrantyMonths} MONTHS OFFICIAL WARRANTY`,
        "•",
    ];

    return (
        // id targeted by print CSS on pages that need to hide site chrome
        // (e.g. the warranty card) — this is a plain div, not a <nav>, so a
        // print rule that only hides <nav>/<footer> misses it.
        <div id="site-marquee" className="bg-teal-600 text-white overflow-hidden py-3 relative z-30">
            <div className="flex animate-marquee whitespace-nowrap items-center">
                {[...Array(4)].map((_, i) => (
                    <React.Fragment key={i}>
                        {items.map((text, idx) => (
                            <span key={`${i}-${idx}`} className="mx-4 text-xs font-bold tracking-[0.2em] uppercase text-teal-100">
                                {text}
                            </span>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export function LayoutContent({ children, initialSiteConfig }: { children: React.ReactNode; initialSiteConfig?: { contact?: { phone?: string; address?: string } } }) {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith('/admin');
    const { siteConfig: storeSiteConfig } = useStore();
    // storeSiteConfig (client-fetched, arrives after mount) wins once it's
    // loaded; initialSiteConfig (server-fetched, passed from RootLayout) is
    // what the very first paint uses instead of the SUPPORT_PHONE default —
    // see the comment on <LayoutContent> in app/layout.tsx.
    const siteConfig = storeSiteConfig ?? initialSiteConfig;
    // Admin-saved phone/address (siteConfig.contact) — see lib/whatsapp.ts
    // and lib/store.ts. Named to match the constants they replace so the
    // footer JSX below works unchanged.
    const SUPPORT_PHONE = resolveSupportPhone(siteConfig);
    const SUPPORT_PHONE_DISPLAY = resolveSupportPhoneDisplay(siteConfig);
    const storeAddressDisplay = resolveStoreAddressDisplay(siteConfig);

    // Declared before the early return below so every render calls the same
    // number of hooks — admin routes render their own layout entirely, so
    // customer-behavior page_view tracking has no business firing there.
    useEffect(() => {
        if (isAdminPage || !pathname) return;
        trackPageView(pathname);
    }, [pathname, isAdminPage]);

    if (isAdminPage) {
        return <main>{children}</main>;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-teal-100 selection:text-teal-900 transition-[padding] duration-300">
            <MarqueeBar />
            <Navbar initialSiteConfig={siteConfig} />
            <CompareBar />
            <main className="animate-[fade-in_0.5s_ease-out]">
                {children}
            </main>
            <footer className="bg-teal-600 border-t border-white/10 pt-20 pb-10 text-white relative z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-10 mb-16">

                        {/* Brand Column */}
                        <div className="space-y-6">
                            <Image src={logo} alt="Lapshark logo" className="h-12 w-auto" />
                            <p className="text-teal-100 text-sm leading-relaxed">
                                Premium refurbished laptops for professionals, students, and gamers. Verified quality, unbeatable prices.
                            </p>
                            <div className="space-y-4">
                                <a
                                    href={`tel:${SUPPORT_PHONE}`}
                                    onClick={() => trackEvent("phone_click", { location: "footer" })}
                                    className="flex items-center gap-3 text-white font-bold hover:text-teal-100 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-teal-700 border border-teal-400/40 flex items-center justify-center"><Phone className="w-5 h-5 text-white" /></div>
                                    {SUPPORT_PHONE_DISPLAY}
                                </a>
                                <a
                                    href={STORE_DIRECTIONS_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackEvent("directions_click", { location: "footer" })}
                                    className="flex items-start gap-3 text-sm text-teal-100 hover:text-white transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-teal-700 border border-teal-400/40 flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-white" /></div>
                                    <span className="mt-2">{storeAddressDisplay}</span>
                                </a>
                            </div>
                        </div>

                        {/* Links Columns */}
                        <div>
                            <h4 className="font-bold text-white mb-6">Shop</h4>
                            <ul className="space-y-4 text-sm text-teal-100">
                                {['Business Laptops', 'Gaming Laptops', 'Ultrabooks', 'Workstations', 'Accessories'].map(item => (
                                    <li key={item}>
                                        <Link href={`/products?category=${item}`} className="hover:text-white hover:translate-x-1 transition-all inline-block">{item}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Bangalore</h4>
                            <ul className="space-y-4 text-sm text-teal-100">
                                <li><Link href="/refurbished-laptops-bangalore" className="hover:text-white hover:translate-x-1 transition-all inline-block">Refurbished Laptops in Bangalore</Link></li>
                                <li><Link href="/store/bangalore" className="hover:text-white hover:translate-x-1 transition-all inline-block">Visit Our Store</Link></li>
                                <li><Link href="/refurbished-dell-laptops-bangalore" className="hover:text-white hover:translate-x-1 transition-all inline-block">Dell Laptops</Link></li>
                                <li><Link href="/refurbished-hp-laptops-bangalore" className="hover:text-white hover:translate-x-1 transition-all inline-block">HP Laptops</Link></li>
                                <li><Link href="/refurbished-lenovo-laptops-bangalore" className="hover:text-white hover:translate-x-1 transition-all inline-block">Lenovo Laptops</Link></li>
                                <li><Link href="/refurbished-apple-macbooks-bangalore" className="hover:text-white hover:translate-x-1 transition-all inline-block">Apple MacBooks</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Support</h4>
                            <ul className="space-y-4 text-sm text-teal-100">
                                <li><Link href="/warranty" className="hover:text-white hover:translate-x-1 transition-all inline-block">Warranty Policy</Link></li>
                                <li><Link href="/returns" className="hover:text-white hover:translate-x-1 transition-all inline-block">Returns & Refunds</Link></li>
                                <li><Link href="/terms" className="hover:text-white hover:translate-x-1 transition-all inline-block">Terms of Service</Link></li>
                                <li><Link href="/privacy" className="hover:text-white hover:translate-x-1 transition-all inline-block">Privacy Policy</Link></li>
                                <li><Link href="/contact" className="hover:text-white hover:translate-x-1 transition-all inline-block">Contact Us</Link></li>
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div>
                            <h4 className="font-bold text-white mb-6">Stay Updated</h4>
                            <p className="text-sm text-teal-100 mb-4">Get the latest deals and tech news.</p>
                            <div className="flex gap-2">
                                <input type="email" placeholder="Email address" className="bg-teal-700 border border-teal-400/40 text-white rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-white placeholder-teal-200" />
                                <button aria-label="Subscribe" className="bg-white text-teal-900 px-4 py-2.5 rounded-lg hover:bg-teal-50 transition-colors font-bold"><ArrowRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-teal-100">
                        <p>© 2025 Lapshark (Sysnut Technologies). All rights reserved.</p>
                        <div className="flex gap-6">
                            <Link href="/privacy" className="cursor-pointer hover:text-white transition-colors">Privacy</Link>
                            <Link href="/admin/login" className="cursor-pointer hover:text-white transition-colors">Admin</Link>
                            <Link href="/terms" className="cursor-pointer hover:text-white transition-colors">Terms</Link>
                            <span className="cursor-pointer hover:text-white transition-colors">Sitemap</span>
                        </div>
                    </div>
                </div>
            </footer>
            <CookieConsent />
        </div>
    );
}
