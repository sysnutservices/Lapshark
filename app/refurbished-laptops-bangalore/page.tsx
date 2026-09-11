import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Battery, Wrench, Truck, Store } from "lucide-react";
import { STORE_POLICIES } from "@/lib/policies";
import { STORE_DIRECTIONS_URL, resolveStoreAddressDisplay } from "@/lib/store";
import { getProductsServer } from "@/lib/getProductsServer";
import { getSiteConfigServer } from "@/lib/getSiteConfigServer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TrustStrip } from "@/components/ecommerce/TrustStrip";
import { BudgetExplorer } from "@/components/ecommerce/BudgetExplorer";
import { ShopByNeed } from "@/components/ecommerce/ShopByNeed";
import { StoreCTAs } from "@/components/ecommerce/StoreCTAs";
import { FAQSection } from "@/components/ecommerce/FAQSection";

export const metadata: Metadata = {
    title: "Refurbished Laptops in Bangalore",
    description: `Professionally refurbished laptops in Bangalore — Dell, HP, Lenovo and Apple, quality-checked, with a ${STORE_POLICIES.warrantyMonths}-month warranty and ${STORE_POLICIES.returnDays}-day returns. Store pickup in Banashankari or doorstep delivery across the city.`,
    alternates: { canonical: "https://lapshark.com/refurbished-laptops-bangalore" },
};

// Real checklist items ProductQualityReport.tsx actually renders per unit —
// kept in sync with that component rather than restated independently.
const INSPECTION_POINTS = [
    "Display, keyboard, and trackpad",
    "Battery and SSD/storage health",
    "Wi-Fi, Bluetooth, webcam, speakers, and microphone",
    "All ports and the overall body condition",
];

const BRAND_PAGES = [
    { brand: "Dell", label: "Dell", href: "/refurbished-dell-laptops-bangalore" },
    { brand: "HP", label: "HP", href: "/refurbished-hp-laptops-bangalore" },
    { brand: "Lenovo", label: "Lenovo", href: "/refurbished-lenovo-laptops-bangalore" },
    { brand: "Apple", label: "Apple MacBooks", href: "/refurbished-apple-macbooks-bangalore" },
] as const;

// A function, not a static array: STORE_ADDRESS_DISPLAY is only the
// fallback default — this page's own "Visit Lapshark" block already shows
// the live admin-saved address (resolveStoreAddressDisplay), so the FAQ
// answer must use the same resolved value or the two disagree on the same
// page.
const getFaqs = (storeAddressDisplay: string) => [
    {
        question: "Where can I buy refurbished laptops in Bangalore?",
        answer: `At our Banashankari store (${storeAddressDisplay}) or online at lapshark.com with delivery across Bangalore.`,
    },
    {
        question: "Does Lapshark provide warranty on refurbished laptops?",
        answer: `Yes — every laptop comes with our ${STORE_POLICIES.warrantyLabel}. ${STORE_POLICIES.batteryPolicyLabel}`,
    },
    {
        question: "Can I visit the Lapshark store before buying?",
        answer: `Yes, our Banashankari store is open ${STORE_POLICIES.supportHoursLabel}. You can see and test the laptop in person before you buy.`,
    },
    {
        question: "Do you sell Dell, HP, Lenovo, and Apple laptops?",
        answer: "Yes — our Bangalore inventory includes Dell, HP, Lenovo, and Apple MacBooks, alongside other brands, depending on current stock.",
    },
    {
        question: "Can I pick up a laptop from the Bangalore store instead of delivery?",
        answer: "Yes, in-store pickup is available at our Banashankari location for any order.",
    },
    {
        question: "Do you provide delivery outside the store area?",
        answer: `Yes, we deliver across Bangalore and pan-India, with ${STORE_POLICIES.returnLabel.toLowerCase()} if it isn't the right fit.`,
    },
];


export default async function RefurbishedLaptopsBangalorePage() {
    const [products, siteConfig] = await Promise.all([getProductsServer(), getSiteConfigServer()]);
    const inStock = products.filter((p) => p.stock > 0);
    const availableBrands = BRAND_PAGES.filter((b) =>
        inStock.some((p) => p.brand?.toLowerCase() === b.brand.toLowerCase())
    );
    // Admin-saved address (siteConfig.contact.address) — see lib/store.ts.
    const storeAddressDisplay = resolveStoreAddressDisplay(siteConfig);
    const faqs = getFaqs(storeAddressDisplay);

    return (
        <div className="bg-slate-50/50">
            <Breadcrumbs items={[{ name: "Refurbished Laptops in Bangalore" }]} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                {/* Hero */}
                <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Refurbished Laptops in Bangalore
                    </h1>
                    <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">
                        Lapshark sells professionally refurbished laptops from our store in Banashankari, Bangalore —
                        every unit quality-checked, warrantied, and available for store pickup or doorstep delivery
                        across the city.
                    </p>
                </div>

                <div className="mb-12 md:mb-16">
                    <TrustStrip className="justify-center" />
                </div>

                {/* Shop by Brand */}
                {availableBrands.length > 0 && (
                    <section className="mb-14 md:mb-20">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 text-center">Shop by Brand</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            {availableBrands.map((b) => (
                                <Link
                                    key={b.href}
                                    href={b.href}
                                    className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white p-5 md:p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
                                >
                                    <span className="font-bold text-slate-800 group-hover:text-teal-700">{b.label}</span>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 flex-shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Shop by Budget */}
                <section className="mb-14 md:mb-20">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 text-center">Shop by Budget</h2>
                    <BudgetExplorer products={inStock} />
                </section>

                {/* Shop by Use Case */}
                <section className="mb-14 md:mb-20">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 text-center">Shop by Use Case</h2>
                    <ShopByNeed />
                </section>

                {/* Why Lapshark */}
                <section className="mb-14 md:mb-20 grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    {[
                        { icon: ShieldCheck, text: `Every laptop passes our ${STORE_POLICIES.qualityCheckLabel}` },
                        { icon: Sparkles, text: `Backed by our ${STORE_POLICIES.warrantyLabel}` },
                        { icon: Battery, text: STORE_POLICIES.batteryPolicyLabel },
                        { icon: Truck, text: "Store pickup in Banashankari or doorstep delivery across Bangalore" },
                    ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-start gap-3 bg-white rounded-2xl border border-slate-100 p-4">
                            <Icon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-slate-700">{text}</p>
                        </div>
                    ))}
                </section>

                {/* How Refurbishment Works */}
                <section className="mb-14 md:mb-20 max-w-2xl mx-auto text-center">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-2">
                        <Wrench className="w-5 h-5 text-teal-600" /> How Our Refurbishment Works
                    </h2>
                    <p className="text-sm md:text-base text-slate-600 mb-6">
                        Before a laptop is listed, our technicians clean, sanitize, and inspect it, checking:
                    </p>
                    <ul className="text-sm text-slate-700 font-medium space-y-2 inline-block text-left">
                        {INSPECTION_POINTS.map((point) => (
                            <li key={point} className="flex items-start gap-2">
                                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" /> {point}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Visit Lapshark */}
                <section className="mb-14 md:mb-20 bg-slate-900 rounded-3xl p-8 md:p-12 text-center">
                    <Store className="w-8 h-8 text-teal-400 mx-auto mb-3" />
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Visit Lapshark in Bangalore</h2>
                    <p className="text-slate-300 max-w-xl mx-auto mb-2">{storeAddressDisplay}</p>
                    <p className="text-slate-400 text-sm mb-8">Open {STORE_POLICIES.supportHoursLabel}</p>
                    <StoreCTAs location="bangalore_landing_page" initialSiteConfig={siteConfig ?? undefined} />
                    <Link
                        href="/store/bangalore"
                        className="inline-block mt-6 text-sm font-bold text-teal-400 hover:text-teal-300"
                    >
                        See full store details →
                    </Link>
                </section>

                {/* FAQs */}
                <FAQSection heading="Frequently Asked Questions" faqs={faqs} />
            </div>
        </div>
    );
}
