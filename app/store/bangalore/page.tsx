import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Clock, MapPin, Laptop } from "lucide-react";
import { STORE_POLICIES } from "@/lib/policies";
import { STORE_ADDRESS_DISPLAY, STORE_MAPS_EMBED_URL, resolveStoreAddressDisplay } from "@/lib/store";
import { resolveSupportPhoneDisplay } from "@/lib/whatsapp";
import { getProductsServer } from "@/lib/getProductsServer";
import { getSiteConfigServer } from "@/lib/getSiteConfigServer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TrustStrip } from "@/components/ecommerce/TrustStrip";
import { StoreCTAs } from "@/components/ecommerce/StoreCTAs";
import { FAQSection } from "@/components/ecommerce/FAQSection";

export const metadata: Metadata = {
    // Root layout's title template already appends " | Lapshark" — no brand
    // name here, or it renders twice (was "... Banashankari | Lapshark |
    // Lapshark").
    title: "Bangalore Store — Refurbished Laptop Store in Banashankari",
    description: `Visit the Lapshark refurbished laptop store in Banashankari, Bangalore. ${STORE_ADDRESS_DISPLAY}. Open ${STORE_POLICIES.supportHoursLabel}.`,
    alternates: { canonical: "https://lapshark.com/store/bangalore" },
};

const BRAND_PAGES = [
    { brand: "Dell", label: "Dell", href: "/refurbished-dell-laptops-bangalore" },
    { brand: "HP", label: "HP", href: "/refurbished-hp-laptops-bangalore" },
    { brand: "Lenovo", label: "Lenovo", href: "/refurbished-lenovo-laptops-bangalore" },
    { brand: "Apple", label: "Apple MacBooks", href: "/refurbished-apple-macbooks-bangalore" },
] as const;

const CATEGORY_LINKS = [
    { label: "Business Laptops", href: "/business-laptops" },
    { label: "Laptops for Students", href: "/laptops-for-students" },
    { label: "Laptops for Programming", href: "/laptops-for-programming" },
    { label: "All Laptops", href: "/products" },
];

// A function, not a static array — see the matching comment in
// app/refurbished-laptops-bangalore/page.tsx: this page's own NAP card
// already shows the live admin-saved address, so the FAQ answer must match.
const getFaqs = (storeAddressDisplay: string) => [
    {
        question: "Where exactly is the Lapshark store in Bangalore?",
        answer: `${storeAddressDisplay}.`,
    },
    {
        question: "What are the store's opening hours?",
        answer: `We're open ${STORE_POLICIES.supportHoursLabel}.`,
    },
    {
        question: "Can I pick up my online order from the store?",
        answer: "Yes — choose store pickup at checkout, or WhatsApp/call us after ordering to arrange it.",
    },
    {
        question: "Can I test a laptop in person before buying?",
        answer: "Yes, you're welcome to see and test any in-stock laptop at the store before purchasing.",
    },
];

export default async function StoreBangalorePage() {
    const [products, siteConfig] = await Promise.all([getProductsServer(), getSiteConfigServer()]);
    const inStock = products.filter((p) => p.stock > 0);
    const availableBrands = BRAND_PAGES.filter((b) =>
        inStock.some((p) => p.brand?.toLowerCase() === b.brand.toLowerCase())
    );
    // Admin-saved phone/address (siteConfig.contact) — see lib/whatsapp.ts
    // and lib/store.ts.
    const storeAddressDisplay = resolveStoreAddressDisplay(siteConfig);
    const faqs = getFaqs(storeAddressDisplay);
    const supportPhoneDisplay = resolveSupportPhoneDisplay(siteConfig);

    return (
        <div className="bg-slate-50/50">
            <Breadcrumbs items={[{ name: "Refurbished Laptops in Bangalore", href: "/refurbished-laptops-bangalore" }, { name: "Bangalore Store" }]} />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                <div className="text-center mb-10 md:mb-14">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Visit Lapshark — Refurbished Laptop Store in Bangalore
                    </h1>
                    <p className="mt-4 text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
                        See and test our refurbished laptops in person before you buy, at our Banashankari store.
                    </p>
                </div>

                <div className="mb-10 md:mb-14">
                    <TrustStrip className="justify-center" />
                </div>

                {/* NAP + map */}
                <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-14 md:mb-20">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-bold text-slate-800">{storeAddressDisplay}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-bold text-slate-800">Open {STORE_POLICIES.supportHoursLabel}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-bold text-slate-800">{supportPhoneDisplay}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Laptop className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-600">
                                In-store pickup available on any order — quality-checked laptops you can see and test
                                before you buy.
                            </p>
                        </div>
                    </div>
                    <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm min-h-[280px]">
                        <iframe
                            src={STORE_MAPS_EMBED_URL}
                            width="100%"
                            height="100%"
                            style={{ border: 0, minHeight: 280 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Lapshark store location on Google Maps"
                        />
                    </div>
                </div>

                {/* Brands + categories available in-store */}
                <div className="grid sm:grid-cols-2 gap-6 md:gap-8 mb-14 md:mb-20">
                    {availableBrands.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Brands in Stock</h2>
                            <div className="flex flex-wrap gap-2">
                                {availableBrands.map((b) => (
                                    <Link
                                        key={b.href}
                                        href={b.href}
                                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-teal-300 hover:text-teal-700 transition-colors"
                                    >
                                        {b.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Shop by Category</h2>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORY_LINKS.map((c) => (
                                <Link
                                    key={c.href}
                                    href={c.href}
                                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-teal-300 hover:text-teal-700 transition-colors"
                                >
                                    {c.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTAs */}
                <div className="mb-14 md:mb-20 bg-slate-900 rounded-3xl p-8 md:p-12 text-center">
                    <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
                    <StoreCTAs location="store_bangalore_page" initialSiteConfig={siteConfig ?? undefined} />
                </div>

                <FAQSection heading="Store FAQs" faqs={faqs} />
            </div>
        </div>
    );
}
