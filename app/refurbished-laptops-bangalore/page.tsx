import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    BadgeCheck,
    Battery,
    Banknote,
    CreditCard,
    MapPin,
    Clock,
    Phone,
    Navigation,
    ShieldCheck,
    RotateCcw,
    Store,
    Wallet,
    Building2,
} from "lucide-react";
import { Category, type Product } from "@/types";
import { STORE_POLICIES } from "@/lib/policies";
import { EMI_PROVIDER_NAME, EMI_TENURE_OPTIONS_MONTHS } from "@/lib/emi";
import {
    STORE_ADDRESS,
    STORE_DIRECTIONS_URL,
    STORE_GEO,
    STORE_HOURS,
    STORE_MAPS_EMBED_URL,
    STORE_SCHEMA_ID,
    resolveStoreAddressDisplay,
} from "@/lib/store";
import { resolveSupportPhone, resolveSupportPhoneDisplay } from "@/lib/whatsapp";
import { getProductsServer } from "@/lib/getProductsServer";
import { getSiteConfigServer } from "@/lib/getSiteConfigServer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductCard } from "@/components/ProductCard";
import { TrustStrip } from "@/components/ecommerce/TrustStrip";
import { StoreCTAs } from "@/components/ecommerce/StoreCTAs";
import { WhatsAppCTA } from "@/components/ecommerce/WhatsAppCTA";
import { FAQSection } from "@/components/ecommerce/FAQSection";

// Copy, metadata and schema follow docs/Lapshark Bangalore Page Rebuild.md
// (2 Nov 2026). Anything that plan left as a [placeholder] is either filled
// from a confirmed source (STORE_POLICIES, lib/store, lib/emi, owner answers
// on 2026-11-02) or left out entirely: no reviews section, store photos,
// landmark/metro or sameAs links until real ones exist.

const PAGE_URL = "https://lapshark.com/refurbished-laptops-bangalore";
const PAGE_TITLE = "Refurbished Laptops in Bangalore | Store in Banashankari | Lapshark";

const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// Laptops only; Accessories would inflate the "N laptops in stock" count.
function getInStockLaptops(products: Product[]): Product[] {
    return products
        .filter((p) => p.stock > 0 && p.category !== Category.ACCESSORIES)
        .sort((a, b) => (a.finalPrice ?? 0) - (b.finalPrice ?? 0));
}

// Workstations: the Workstations category, plus Precision/ZBook lines that
// are filed under Business Laptops in the admin (e.g. Dell Precision 5560).
const isWorkstation = (p: Product) =>
    p.category === Category.WORKSTATIONS || /precision|zbook/i.test(p.title);

const minPrice = (list: Product[]) =>
    list.length ? Math.min(...list.map((p) => p.finalPrice)) : null;

// Live price, not the plan's hardcoded ₹17,000: the description must stay
// true when the cheapest unit sells out.
export async function generateMetadata(): Promise<Metadata> {
    const inStock = getInStockLaptops(await getProductsServer());
    const from = minPrice(inStock);
    const description = `Buy refurbished laptops in Bangalore${from ? ` from ${formatINR(from)}` : ""}. Dell, HP & Lenovo with ${STORE_POLICIES.warrantyMonths}-month warranty, ${STORE_POLICIES.returnDays}-day returns. Visit our Banashankari store or get next-day delivery.`;

    return {
        // absolute: the root layout's "%s | Lapshark" template would
        // otherwise append the brand a second time.
        title: { absolute: PAGE_TITLE },
        description,
        alternates: { canonical: PAGE_URL },
        // Page-level openGraph replaces the layout's (which points at the
        // homepage), so the shared fields are restated here.
        openGraph: {
            type: "website",
            siteName: "Lapshark",
            locale: "en_IN",
            url: PAGE_URL,
            title: PAGE_TITLE,
            description,
        },
    };
}

const BRAND_PAGES = [
    { brand: "Dell", label: "Refurbished Dell laptops in Bangalore", href: "/refurbished-dell-laptops-bangalore" },
    { brand: "HP", label: "Refurbished HP laptops in Bangalore", href: "/refurbished-hp-laptops-bangalore" },
    { brand: "Lenovo", label: "Refurbished Lenovo laptops in Bangalore", href: "/refurbished-lenovo-laptops-bangalore" },
    // Shown only while a MacBook is in stock (plan: "only keep this if you
    // have MacBooks in stock") via the in-stock brand filter below.
    { brand: "Apple", label: "Refurbished MacBooks in Bangalore", href: "/refurbished-apple-macbooks-bangalore" },
] as const;

const NEARBY_AREAS =
    "Jayanagar, JP Nagar, Basavanagudi, BSK 2nd and 3rd Stage, Padmanabhanagar, Kumaraswamy Layout and Uttarahalli";

const BUYER_GUIDE = [
    {
        who: "College students (PES, BMS, RV and nearby colleges)",
        text: "an i5 8th Gen or newer with 8GB RAM handles coding labs, MS Office and online classes. Budget ₹19,000–₹26,000.",
    },
    {
        who: "Working professionals and hybrid workers",
        text: "a 10th or 11th Gen Latitude or ThinkPad with 16GB RAM, the same kind of machine many Bangalore offices issue. Budget ₹26,000–₹35,000.",
    },
    {
        who: "Developers",
        text: "16GB RAM and an SSD are the minimum for IDEs, Docker and multiple browser tabs. Look at the Latitude 7420 or ThinkPad T14.",
    },
    {
        who: "Designers, architects and engineers",
        text: "a workstation like the HP ZBook or Dell Precision with a dedicated graphics card runs AutoCAD, SolidWorks and Adobe apps smoothly. Budget ₹60,000+.",
    },
    {
        who: "Small businesses and startups",
        text: "buying 5+ laptops? Call us for bulk pricing.",
    },
];

const emiMin = EMI_TENURE_OPTIONS_MONTHS[0];
const emiMax = EMI_TENURE_OPTIONS_MONTHS[EMI_TENURE_OPTIONS_MONTHS.length - 1];
const codLabel = `cash on delivery (₹${STORE_POLICIES.codAdvanceAmount} advance, rest on delivery)`;

// "2 Hours" -> "2-hour", so it reads as an adjective in running copy.
const batteryBackupAdjective = STORE_POLICIES.batteryBackupLabel.replace(/\s*hours?$/i, "-hour");

const WHY_LAPSHARK = [
    {
        icon: BadgeCheck,
        title: `Tested on ${STORE_POLICIES.qualityCheckPoints}+ points`,
        text: "screen, keyboard, ports, battery, Wi-Fi, webcam, speakers, storage health.",
    },
    {
        icon: Battery,
        title: "Battery checked before listing",
        text: `every laptop comes with a guaranteed ${batteryBackupAdjective} battery backup.`,
    },
    {
        icon: ShieldCheck,
        title: `${STORE_POLICIES.warrantyMonths}-month Lapshark warranty`,
        text: "repairs or replacement handled at our Bangalore store, no courier back-and-forth.",
    },
    {
        icon: RotateCcw,
        title: `${STORE_POLICIES.returnDays}-day returns`,
        text: "if it's not right, bring it back.",
    },
    {
        icon: Wallet,
        title: "Pay how you want",
        text: `${codLabel}, UPI, cards, or EMI through ${EMI_PROVIDER_NAME}.`,
    },
    {
        icon: Building2,
        title: "Business-grade build",
        text: "these laptops were built for corporate use, with sturdier bodies and better keyboards than most new budget laptops at the same price.",
    },
];

const HERO_TRUST_ITEMS = [
    { icon: ShieldCheck, label: STORE_POLICIES.warrantyLabel },
    { icon: RotateCcw, label: STORE_POLICIES.returnLabel },
    { icon: Banknote, label: "COD" },
    { icon: CreditCard, label: "EMI available" },
    { icon: Store, label: "Walk-in store" },
];

// One array feeds both the visible accordion and the FAQPage JSON-LD
// (FAQSection renders both), so the schema matches the page word for word.
function getFaqs({ from, workstationFrom }: { from: number | null; workstationFrom: number | null }) {
    const priceAnswer = [
        from ? `Our laptops start at ${formatINR(from)}.` : null,
        "Most students and office users buy in the ₹19,000–₹35,000 range.",
        workstationFrom ? `Workstations with graphics cards start around ${formatINR(workstationFrom)}.` : null,
    ]
        .filter(Boolean)
        .join(" ");

    return [
        {
            question: "Where can I buy a refurbished laptop in Bangalore?",
            answer: "At the Lapshark store in Banashankari 1st Stage, near 6th Cross Road, Vidyapeeta Layout. You can also order on lapshark.com for delivery anywhere in Bangalore.",
        },
        {
            question: "Can I check the laptop before buying?",
            answer: `Yes. Visit the store to test any laptop in person. If you order online, you have ${STORE_POLICIES.returnDays} days to return it.`,
        },
        {
            question: "What is the price of a refurbished laptop in Bangalore?",
            answer: priceAnswer,
        },
        {
            question: "Is a refurbished laptop as good as new?",
            answer: `A well-tested business laptop performs like new for everyday work. Every Lapshark laptop goes through a ${STORE_POLICIES.qualityCheckPoints}+ point check and comes with a ${STORE_POLICIES.warrantyMonths}-month warranty.`,
        },
        {
            // Coverage restated from app/warranty/WarrantyContent.tsx, the
            // policy of record; owner-approved 2026-11-02.
            question: `What does the ${STORE_POLICIES.warrantyMonths}-month warranty cover?`,
            answer: "Hardware faults in the screen, motherboard, keyboard, hard drive and RAM, plus original accessories. It doesn't cover physical or liquid damage, cosmetic wear like scratches and dents, software, or batteries unless they stop working completely. Repairs are handled at our Bangalore store. Full terms are on our warranty page.",
        },
        {
            question: "Do you deliver in Bangalore, and how fast?",
            answer: `${STORE_POLICIES.bangaloreDeliveryLabel}. Cash on delivery is available with a ₹${STORE_POLICIES.codAdvanceAmount} advance, and the rest is paid on delivery.`,
        },
        {
            question: "Do you offer EMI?",
            answer: `Yes, through the ${EMI_PROVIDER_NAME} EMI Card, with tenures from ${emiMin} to ${emiMax} months on eligible purchases.`,
        },
        {
            question: "Do the laptops come with Windows 11?",
            answer: "Every laptop that supports Windows 11 ships with it pre-installed. Older models are clearly marked.",
        },
        // "Do you buy old laptops or offer exchange?" omitted: owner
        // confirmed 2026-11-02 that Lapshark does not offer exchange.
    ];
}

export default async function RefurbishedLaptopsBangalorePage() {
    const [products, siteConfig] = await Promise.all([getProductsServer(), getSiteConfigServer()]);
    const inStock = getInStockLaptops(products);
    const from = minPrice(inStock);
    const workstationFrom = minPrice(inStock.filter(isWorkstation));
    const availableBrands = BRAND_PAGES.filter((b) =>
        inStock.some((p) => p.brand?.toLowerCase() === b.brand.toLowerCase())
    );

    // Admin-saved contact details (siteConfig.contact) with verified
    // defaults; see lib/store.ts and lib/whatsapp.ts.
    const storeAddressDisplay = resolveStoreAddressDisplay(siteConfig);
    const supportPhone = resolveSupportPhone(siteConfig);
    const supportPhoneDisplay = resolveSupportPhoneDisplay(siteConfig);
    const faqs = getFaqs({ from, workstationFrom });

    // Shares STORE_SCHEMA_ID with app/layout.tsx's ElectronicsStore, so
    // Google merges the two into one business. Any field set in both must
    // have the same value: `url` and `priceRange` were set here too
    // (this page / a live price range vs lapshark.com / "₹₹") and the Rich
    // Results Test flagged the merged node with 'Duplicate field "url"'
    // (2 Nov 2026). They're left to the sitewide node; the page ties to the
    // map listing via the Google Business Profile website link instead.
    const storeJsonLd = {
        "@context": "https://schema.org",
        "@type": "ComputerStore",
        "@id": STORE_SCHEMA_ID,
        name: "Lapshark",
        legalName: "Sysnut Technologies",
        telephone: supportPhone,
        address: { "@type": "PostalAddress", ...STORE_ADDRESS },
        geo: { "@type": "GeoCoordinates", latitude: STORE_GEO.latitude, longitude: STORE_GEO.longitude },
        openingHoursSpecification: STORE_HOURS.map((h) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: h.dayOfWeek,
            opens: h.opens,
            closes: h.closes,
        })),
        areaServed: "Bengaluru",
        // image and sameAs (store photo, Google Business Profile, Instagram)
        // are added once real URLs exist. No aggregateRating until there
        // are real on-site reviews.
    };

    return (
        <div className="bg-slate-50/50">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd).replace(/</g, "\\u003c") }}
            />
            <Breadcrumbs items={[{ name: "Refurbished Laptops in Bangalore" }]} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                {/* Hero */}
                <section className="text-center max-w-3xl mx-auto mb-8 md:mb-10">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Refurbished Laptops in Bangalore
                    </h1>
                    <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">
                        Business-grade Dell, HP and Lenovo laptops{from ? ` from ${formatINR(from)}` : ""}, tested on{" "}
                        {STORE_POLICIES.qualityCheckPoints}+ points and backed by a {STORE_POLICIES.warrantyMonths}-month
                        warranty. Try one in person at our Banashankari store, or get it delivered next day anywhere in
                        Bangalore with {codLabel}.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a
                            href="#in-stock"
                            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
                        >
                            Shop Bangalore stock <ArrowRight className="w-4 h-4" />
                        </a>
                        <a
                            href={STORE_DIRECTIONS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 hover:border-teal-300 transition-colors"
                        >
                            <Navigation className="w-4 h-4" /> Get directions
                        </a>
                        <WhatsAppCTA
                            location="bangalore_landing_hero"
                            label={`Chat on WhatsApp: ${supportPhoneDisplay}`}
                            extraMessage="Hi Lapshark, I'm looking for a refurbished laptop in Bangalore. Can you help me choose?"
                            className="w-full sm:w-auto justify-center"
                        />
                    </div>
                </section>

                <div className="mb-14 md:mb-20">
                    <TrustStrip className="justify-center" items={HERO_TRUST_ITEMS} />
                </div>

                {/* Visit our store */}
                <section className="mb-14 md:mb-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 text-center">
                        Visit our store in Banashankari
                    </h2>
                    <p className="text-slate-600 max-w-2xl mx-auto text-center mb-8">
                        Most online refurb sellers have no shop you can walk into. We do. Come in, open the laptop, check
                        the screen, keyboard and battery yourself, and walk out with it the same day.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-5">
                            <p className="text-lg font-bold text-slate-900">Lapshark Store</p>
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-slate-800">{storeAddressDisplay}</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-slate-800">
                                    Phone / WhatsApp:{" "}
                                    <a href={`tel:${supportPhone}`} className="text-teal-700 hover:underline">
                                        {supportPhoneDisplay}
                                    </a>
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-slate-800">
                                    Hours: {STORE_POLICIES.supportHoursLabel}
                                </p>
                            </div>
                            <p className="text-sm text-slate-600">Easy to reach from {NEARBY_AREAS}.</p>
                            <Link href="/store/bangalore" className="inline-block text-sm font-bold text-teal-700 hover:text-teal-800">
                                Store details and directions →
                            </Link>
                        </div>
                        <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm min-h-[280px]">
                            <iframe
                                src={STORE_MAPS_EMBED_URL}
                                width="100%"
                                height="100%"
                                style={{ border: 0, minHeight: 280 }}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Map of the Lapshark store in Banashankari, Bangalore"
                            />
                        </div>
                    </div>
                </section>

                {/* Live stock */}
                <section id="in-stock" className="mb-14 md:mb-20 scroll-mt-24">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 text-center">
                        Laptops in stock in Bangalore right now
                    </h2>
                    {inStock.length > 0 ? (
                        <>
                            <p className="text-center text-slate-600 mb-8">
                                {inStock.length} {inStock.length === 1 ? "laptop" : "laptops"} in stock today
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                                {inStock.map((p) => (
                                    <ProductCard key={p._id || p.id} product={p} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16 text-slate-500 border border-dashed border-slate-200 rounded-2xl mt-6">
                            <p>Stock is being refreshed. Message us on WhatsApp and we&apos;ll tell you what&apos;s available today.</p>
                        </div>
                    )}
                </section>

                {/* Buyer guide */}
                <section className="mb-14 md:mb-20 max-w-3xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 text-center">Which laptop suits you?</h2>
                    <div className="space-y-4">
                        {BUYER_GUIDE.map(({ who, text }) => (
                            <p key={who} className="text-slate-700 leading-relaxed">
                                <strong className="text-slate-900">{who}:</strong> {text}
                            </p>
                        ))}
                    </div>
                </section>

                {/* Why Lapshark */}
                <section className="mb-14 md:mb-20 max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 text-center">
                        Why buy refurbished from Lapshark
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {WHY_LAPSHARK.map(({ icon: Icon, title, text }) => (
                            <div key={title} className="flex items-start gap-3 bg-white rounded-2xl border border-slate-100 p-4">
                                <Icon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-700">
                                    <strong className="text-slate-900">{title}:</strong> {text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Refurbished vs new */}
                <section className="mb-14 md:mb-20 max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Refurbished vs new at ₹30,000</h2>
                    <p className="text-slate-700 leading-relaxed">
                        A new ₹30,000 laptop usually means an entry-level processor, plastic body and RAM that can&apos;t be
                        upgraded. The same money at Lapshark gets you an 11th Gen i5 business laptop with 16GB RAM, like the
                        Dell Latitude 7420, built to last years of daily use.
                    </p>
                </section>

                {/* Shop by brand */}
                {availableBrands.length > 0 && (
                    <section className="mb-14 md:mb-20">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 text-center">Shop by brand</h2>
                        <div className="grid sm:grid-cols-2 gap-3 md:gap-4 max-w-3xl mx-auto">
                            {availableBrands.map((b) => (
                                <Link
                                    key={b.href}
                                    href={b.href}
                                    className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
                                >
                                    <span className="font-bold text-slate-800 group-hover:text-teal-700">{b.label}</span>
                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 flex-shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Final CTA */}
                <section className="mb-14 md:mb-20 bg-slate-900 rounded-3xl p-8 md:p-12 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Not sure which one to buy?</h2>
                    <p className="text-slate-300 max-w-xl mx-auto mb-8">
                        Send us your budget and what you&apos;ll use it for on WhatsApp, and we&apos;ll suggest 2–3 options
                        from today&apos;s stock.
                    </p>
                    <StoreCTAs location="bangalore_landing_page" initialSiteConfig={siteConfig ?? undefined} />
                </section>

                {/* FAQs (visible accordion + FAQPage JSON-LD) */}
                <FAQSection heading="Frequently Asked Questions" faqs={faqs} />
                <p className="text-center text-sm text-slate-500 mt-6">
                    Full terms:{" "}
                    <Link href="/warranty" className="font-bold text-teal-700 hover:underline">warranty policy</Link>
                    {" · "}
                    <Link href="/returns" className="font-bold text-teal-700 hover:underline">returns policy</Link>
                </p>
            </div>
        </div>
    );
}
