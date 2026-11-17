import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Banknote, Boxes, Building2, ShieldCheck, Store, Truck, Wrench } from "lucide-react";
import { api } from "@/api/api";
import { STORE_POLICIES } from "@/lib/policies";
import { dealerTerms } from "@/lib/dealerTerms";
import dell from "@/assets/brands/dell.svg";
import hp from "@/assets/brands/hp.svg";
import lenovo from "@/assets/brands/lenovo.svg";
import apple from "@/assets/brands/apple.svg";
import { DealerJoin } from "./DealerLandingClient";

// Public landing page for the dealer channel (trade buyers). The portal
// itself stays at /dealer. Copy states only what the dealer channel does
// (distribution/docs/13-dealer-channel.md): private trade prices, no minimum
// order, bank transfer or cash, courier or pickup, optional dealer-only
// warranty, a claim window for transit damage or a wrong laptop.
// Same palette as /partner: ink neutrals, Lapshark teal as the one accent.

export const revalidate = 300;

export const metadata: Metadata = {
    title: "Lapshark for dealers: refurbished business laptops at trade prices",
    description:
        "Shops, online sellers and IT suppliers can buy quality-checked refurbished business laptops from Lapshark at private trade prices and resell them under their own name. No minimum order. Bank transfer or cash, courier or pickup in Bengaluru.",
    alternates: { canonical: "/dealers" },
    openGraph: {
        title: "Lapshark for dealers: refurbished business laptops at trade prices",
        description: "No minimum order. Pay by bank transfer or cash. Courier or pickup in Bengaluru.",
        url: "/dealers",
    },
};

async function claimWindowDays(): Promise<number> {
    try {
        const r = await api.get("/dealers/programme", { timeout: 5000 });
        const n = Number(r.data?.claimWindowDays);
        return Number.isInteger(n) && n > 0 ? n : 7;
    } catch {
        return 7;
    }
}

const icon = "h-[18px] w-[18px] shrink-0 text-[#6b7487]";

const WHO = [
    { icon: Store, title: "Laptop and computer shops", body: "Add tested business laptops to your shelf without sourcing them yourself" },
    { icon: Boxes, title: "Online sellers", body: "Sell on Amazon, Flipkart, Instagram or your own site under your own brand" },
    { icon: Building2, title: "IT services and corporate suppliers", body: "Supply laptops to the offices and teams you already look after" },
    { icon: Wrench, title: "Refurbishers and repair shops", body: "Top up your stock when your own sourcing runs short" },
];

const STEPS = [
    { title: "Apply", body: "Tell us about your business, with your GSTIN or PAN. We review every application" },
    { title: "Get approved", body: "Sign in at lapshark.com/dealer with your mobile number to see dealer prices and what's in stock" },
    { title: "Order", body: "Choose laptops and quantities. There's no minimum, a single laptop is fine. Add Lapshark warranty to a laptop if you want it" },
    { title: "Pay", body: "By bank transfer or cash, before the laptops are dispatched or handed over" },
    { title: "Receive", body: "By courier, or pick up in Bengaluru. The serial number of every laptop is recorded on your order" },
];

export default async function DealersLandingPage() {
    const claimDays = await claimWindowDays();
    const facts = [
        { icon: Banknote, text: "Private trade prices, shown only to approved dealers" },
        { icon: Boxes, text: "No minimum order quantity" },
        { icon: Truck, text: "Courier anywhere we deliver, or pickup in Bengaluru" },
        { icon: ShieldCheck, text: `${STORE_POLICIES.qualityCheckLabel} on every laptop` },
    ];
    const faqs = [
        { q: "Can I see dealer prices before applying?", a: "No. Dealer prices are private. Once you're approved, you see the dealer price of every laptop in stock when you sign in." },
        { q: "Is there a minimum order?", a: "No. You can order a single laptop." },
        { q: "Do the laptops come with warranty?", a: "Not by default. Where it's offered, you can add Lapshark warranty to a laptop when you order. It covers you, the dealer, from the day of delivery, not your customer." },
        { q: "What if a laptop arrives damaged or isn't what I ordered?", a: `Report it from your order page within ${claimDays} days of delivery and we'll review it. There are no other returns on dealer orders.` },
        { q: "How do I pay?", a: "By bank transfer or cash, before dispatch or handover. Cash is accepted only below ₹2,00,000 per order and per day. Card, UPI checkout and cash on delivery aren't available for dealer orders." },
        { q: "Do I need a GSTIN?", a: "You need a GSTIN or a PAN to apply." },
        { q: "Can I sell them as Lapshark laptops?", a: "No. You resell under your own name and on your own bill. Don't present yourself as Lapshark or promise Lapshark warranty to your customers." },
    ];

    return (
        <div className="bg-white text-[#111827]">
            {/* ------------------------------------------------ in-page nav */}
            <div className="border-b border-[#111827]/[0.08] bg-white">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
                    <nav className="flex items-center gap-1 overflow-x-auto text-sm">
                        <span className="whitespace-nowrap pr-3 font-medium text-[#111827]">Lapshark for dealers</span>
                        {[["#who", "Who it's for"], ["#how", "How it works"], ["#terms", "Terms"], ["#faq", "FAQ"]].map(([href, label]) => (
                            <a key={href} href={href} className="whitespace-nowrap rounded-[8px] px-3 py-1.5 text-[#4b5565] transition-colors duration-150 hover:bg-[#eceff4] hover:text-[#111827]">{label}</a>
                        ))}
                    </nav>
                    <Link href="/dealer" className="hidden whitespace-nowrap text-sm text-[#4b5565] transition-colors duration-150 hover:text-[#111827] md:block">Dealer sign in</Link>
                </div>
            </div>

            {/* ------------------------------------------------ hero + form */}
            <section className="bg-[#f5f7fa]">
                <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-12 px-6 py-16 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-16 lg:px-8 lg:py-20">
                    <div className="min-w-0 lg:pt-6">
                        <p className="text-sm text-[#6b7487]">Lapshark for dealers · Bengaluru</p>
                        <h1 className="mt-4 max-w-xl text-[40px] font-medium leading-[1.05] tracking-[-0.03em] text-[#111827] sm:text-[52px]">
                            Refurbished business laptops at trade prices, for your shop
                        </h1>
                        <p className="mt-6 max-w-[34rem] text-lg leading-[1.6] text-[#4b5565]">
                            Shops, online sellers and IT suppliers buy quality-checked laptops from Lapshark at a private dealer price and resell them under their own name.
                        </p>
                        <ul className="mt-8 grid max-w-[34rem] gap-3">
                            {facts.map((f) => (
                                <li key={f.text} className="flex items-center gap-3 text-[15px] text-[#111827]"><f.icon className={icon} strokeWidth={1.5} />{f.text}</li>
                            ))}
                        </ul>
                        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 opacity-70">
                            {[dell, hp, lenovo, apple].map((logo, i) => <Image key={i} src={logo} alt="" className="h-6 w-auto grayscale" />)}
                        </div>
                    </div>
                    <div id="apply" className="scroll-mt-24 min-w-0"><DealerJoin /></div>
                </div>
            </section>

            {/* ------------------------------------------------ who it's for */}
            <section id="who" className="scroll-mt-24 border-t border-[#111827]/[0.08] bg-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[280px_1fr] lg:gap-16 lg:px-8">
                    <div>
                        <h2 className="text-[28px] font-medium leading-[1.15] tracking-[-0.01em] text-[#111827]">Who it&apos;s for</h2>
                        <p className="mt-3 text-[15px] leading-relaxed text-[#4b5565]">Businesses that sell laptops on to their own customers</p>
                    </div>
                    <div className="grid gap-px overflow-hidden rounded-[16px] bg-[#111827]/[0.08] ring-1 ring-[#111827]/[0.08] sm:grid-cols-2">
                        {WHO.map((w) => (
                            <div key={w.title} className="bg-white p-6">
                                <w.icon className={icon} strokeWidth={1.5} />
                                <p className="mt-4 text-[15px] font-medium text-[#111827]">{w.title}</p>
                                <p className="mt-1.5 text-sm leading-relaxed text-[#4b5565]">{w.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------ how it works */}
            <section id="how" className="scroll-mt-24 border-t border-[#111827]/[0.08] bg-[#f5f7fa]">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[280px_1fr] lg:gap-16 lg:px-8">
                    <div>
                        <h2 className="text-[28px] font-medium leading-[1.15] tracking-[-0.01em] text-[#111827]">How it works</h2>
                        <p className="mt-3 text-[15px] leading-relaxed text-[#4b5565]">From application to laptops on your shelf</p>
                    </div>
                    <ol className="grid gap-3">
                        {STEPS.map((s, i) => (
                            <li key={s.title} className="flex gap-4 rounded-[12px] bg-white p-5 ring-1 ring-[#111827]/[0.08]">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eceff4] text-[13px] tabular-nums text-[#111827]">{i + 1}</span>
                                <div>
                                    <p className="text-[15px] font-medium text-[#111827]">{s.title}</p>
                                    <p className="mt-1 text-sm leading-relaxed text-[#4b5565]">{s.body}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ------------------------------------------------ terms */}
            <section id="terms" className="scroll-mt-24 border-t border-[#111827]/[0.08] bg-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[280px_1fr] lg:gap-16 lg:px-8">
                    <div>
                        <h2 className="text-[28px] font-medium leading-[1.15] tracking-[-0.01em] text-[#111827]">Dealer terms in brief</h2>
                        <p className="mt-3 text-[15px] leading-relaxed text-[#4b5565]">You accept these when you apply</p>
                    </div>
                    <ul className="grid gap-3">
                        {dealerTerms(claimDays).map((t) => (
                            <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-[#111827]"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f766e]" />{t}</li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ------------------------------------------------ FAQ */}
            <section id="faq" className="scroll-mt-24 border-t border-[#111827]/[0.08] bg-[#f5f7fa]">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[280px_1fr] lg:gap-16 lg:px-8">
                    <h2 className="text-[28px] font-medium leading-[1.15] tracking-[-0.01em] text-[#111827]">Questions</h2>
                    <div className="divide-y divide-[#111827]/[0.08] rounded-[16px] bg-white ring-1 ring-[#111827]/[0.08]">
                        {faqs.map((f) => (
                            <details key={f.q} className="group px-6 py-5">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-[#111827]">
                                    {f.q}<span className="text-[#6b7487] transition-transform duration-150 group-open:rotate-45">+</span>
                                </summary>
                                <p className="mt-3 text-[15px] leading-relaxed text-[#4b5565]">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ------------------------------------------------ closing */}
            <section className="border-t border-[#111827]/[0.08] bg-white">
                <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center lg:px-8">
                    <div>
                        <p className="text-[22px] font-medium text-[#111827]">Buy laptops for your business at dealer prices</p>
                        <p className="mt-1.5 text-[15px] text-[#4b5565]">Selling to friends and colleagues instead? <Link href="/partner" className="text-[#0f766e] underline underline-offset-2">See the Sales Ambassador programme</Link></p>
                    </div>
                    <a href="#apply" className="inline-flex h-12 items-center rounded-[10px] bg-[#0f766e] px-6 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-[#115e59]">Become a dealer</a>
                </div>
            </section>
        </div>
    );
}
