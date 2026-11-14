import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist_Mono } from "next/font/google";
import {
    BadgeIndianRupee, Boxes, Clock, Handshake, Headphones, MapPin, PackageCheck, RotateCcw, ShieldCheck, Store, Truck, Users,
} from "lucide-react";
import { STORE_POLICIES } from "@/lib/policies";
import { ILLUSTRATIVE_REFERRAL_SLABS, ILLUSTRATIVE_INDEPENDENT, ILLUSTRATIVE_TYPICAL_ROOM, FOUNDING_RATE_LOCK_MONTHS } from "@/lib/illustrativeCommission";

// The table's independent row: sold at the listed price, with the typical
// negotiating room between it and the approved minimum.
const INDEPENDENT_EXAMPLE_SOLD = 26000;
const INDEPENDENT_EXAMPLE_MINIMUM = INDEPENDENT_EXAMPLE_SOLD - ILLUSTRATIVE_TYPICAL_ROOM;
const INDEPENDENT_EXAMPLE_SHARE = Math.floor((INDEPENDENT_EXAMPLE_SOLD - INDEPENDENT_EXAMPLE_MINIMUM) * ILLUSTRATIVE_INDEPENDENT.sharePercent / 100);
import dell from "@/assets/brands/dell.svg";
import hp from "@/assets/brands/hp.svg";
import lenovo from "@/assets/brands/lenovo.svg";
import apple from "@/assets/brands/apple.svg";
import {
    EarningsCalculator, HeroVisual, InterestLine, JoinButton, JoinForm, LandingProvider, LeadRaceStats, LiveStock, META, MONO, SeatStrip, StickyCta,
} from "./LandingClient";

// Design pass: unslop by Damir Sokolovsky (@heydamir), CC BY 4.0.
// Ink-tinted neutrals, Lapshark teal (#0f766e) as the one accent, Geist +
// Geist Mono, and the founding "seat strip" as the signature detail.
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-partner-mono" });

export const metadata: Metadata = {
    title: "Become a Lapshark Sales Ambassador | Earn by selling business laptops in Bangalore",
    description:
        "Join the founding cohort of the Lapshark Sales Ambassador Network in Bangalore. Refer customers or sell quality-checked refurbished business laptops and earn commission on every delivered sale. No inventory, no investment.",
    alternates: { canonical: "/partner" },
    openGraph: {
        title: "Earn from the laptops your network buys | Lapshark Sales Ambassadors",
        description: "Founding cohort now onboarding in Bangalore. No inventory, no investment, commission on every delivered sale.",
        url: "/partner",
    },
};

const NAV = [
    ["#why", "Why join"],
    ["#ways", "Two ways to earn"],
    ["#how", "How it works"],
    ["#earnings", "Earnings"],
    ["#sell", "What you'll sell"],
    ["#faq", "FAQ"],
] as const;

const faqs = [
    { q: "Do I need to buy laptops or keep stock?", a: "No. Lapshark owns all inventory. You never purchase, store or ship anything." },
    { q: "Do customers pay me?", a: "Never. Customers always pay Lapshark directly on lapshark.com or through a Lapshark invoice. Partners must not collect payments into personal accounts." },
    { q: "How much will I earn?", a: "Commission is set per laptop by Lapshark and depends on the selling price. The numbers on this page are examples at founding partner rates. You see the exact commission for every sale in your dashboard. We don't promise any fixed or monthly income: you earn only on delivered, paid sales." },
    { q: "What does the founding rate lock mean?", a: `If you join in the founding cohort, the commission rates in force when you're approved won't go down for your first ${FOUNDING_RATE_LOCK_MONTHS} months. If we raise rates during that time, you get the higher rate.` },
    { q: "When is commission paid?", a: `After the laptop is delivered, the customer's payment has fully cleared and the ${STORE_POLICIES.returnDays}-day return window has passed. Payouts go to your verified bank account or UPI ID.` },
    { q: "Why is there a limited founding cohort?", a: "We're starting with a small group in Bangalore so every partner gets proper onboarding and support while we fine-tune the programme. More partners will be invited in batches after that." },
    { q: "What does \"first come\" mean for customers?", a: "When you register a customer as your lead (with their consent), they're yours for 30 days: if they buy, the sale is credited to you. If another partner registered them first, they can't be credited to you during that time." },
    { q: "I work full-time in IT. Can I join?", a: "Yes, it's designed to run alongside a job. Please check that your employer's policies on outside work and conflicts of interest allow it." },
    { q: "Why do you ask for PAN and bank details later?", a: "For commission payouts and tax compliance. They're encrypted and only ever shown in masked form." },
];

// Section shell: heading column on the left, content on the right.
function Section({ id, title, intro, children, tint = false }: { id?: string; title: string; intro?: React.ReactNode; children: React.ReactNode; tint?: boolean }) {
    return (
        <section id={id} className={`scroll-mt-24 border-t border-[#111827]/[0.08] ${tint ? "bg-[#f5f7fa]" : "bg-white"}`}>
            <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[280px_1fr] lg:gap-16 lg:px-8 lg:py-24">
                <div>
                    <h2 className="text-[28px] font-medium leading-[1.15] tracking-[-0.01em] text-[#111827]">{title}</h2>
                    {intro && <p className="mt-3 text-[15px] leading-relaxed text-[#4b5565]">{intro}</p>}
                </div>
                <div className="min-w-0">{children}</div>
            </div>
        </section>
    );
}

const icon = "h-[18px] w-[18px] shrink-0 text-[#6b7487]";

export default function PartnerLandingPage() {
    return (
        <LandingProvider>
            <div className={`${mono.variable} bg-white text-[#111827]`}>
                {/* ------------------------------------------------ in-page nav */}
                <div className="border-b border-[#111827]/[0.08] bg-white">
                    <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
                        <nav className="flex items-center gap-1 overflow-x-auto text-sm">
                            <span className="whitespace-nowrap pr-3 font-medium text-[#111827]">Sales Ambassadors</span>
                            {NAV.map(([href, label]) => (
                                <a key={href} href={href} className="whitespace-nowrap rounded-[8px] px-3 py-1.5 text-[#4b5565] transition-colors duration-150 hover:bg-[#eceff4] hover:text-[#111827]">{label}</a>
                            ))}
                        </nav>
                        <div className="hidden md:block"><JoinButton size="sm">Become an Ambassador</JoinButton></div>
                    </div>
                </div>

                {/* ------------------------------------------------ hero */}
                <section className="bg-[#f5f7fa]">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-8 lg:py-24">
                        <div className="min-w-0">
                            <p className="text-sm text-[#6b7487]">Lapshark Sales Ambassadors · Bangalore</p>
                            <h1 className="mt-4 max-w-xl text-[40px] font-medium leading-[1.05] tracking-[-0.03em] text-[#111827] sm:text-[56px]">
                                Earn from the laptops your network buys
                            </h1>
                            <p className="mt-6 max-w-[34rem] text-lg leading-[1.6] text-[#4b5565]">
                                Refer or sell Lapshark&apos;s quality-checked refurbished business laptops to the people who already ask you which laptop to buy. Lapshark handles stock, payment and delivery, and you earn commission on every delivered sale.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <JoinButton />
                                <a href="#how" className="inline-flex h-12 items-center rounded-[10px] bg-white px-5 text-[15px] text-[#111827] ring-1 ring-[#111827]/[0.12] transition-colors duration-150 hover:bg-[#eceff4]">See how it works</a>
                            </div>
                            <div className="mt-12"><SeatStrip /></div>
                        </div>
                        <HeroVisual />
                    </div>
                </section>

                {/* ------------------------------------------------ why now: first come */}
                <section className="border-t border-[#111827]/[0.08] bg-white">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
                        <div>
                            <p className="text-sm text-[#0f766e]">Why now</p>
                            <h2 className="mt-3 text-[32px] font-medium leading-[1.15] tracking-[-0.02em] text-[#111827] sm:text-[40px]">Someone in your office is about to buy a laptop. The first partner to register them earns the sale</h2>
                            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#4b5565]">
                                Customers are first come, first served. When a partner registers a customer, that customer is theirs for 30 days. Your colleagues, classmates and friends can be registered by any partner, so the people who ask you for laptop advice are only credited to you once you&apos;re in.
                            </p>
                            <div className="mt-8"><JoinButton>Reserve a founding spot</JoinButton></div>
                        </div>
                        <LeadRaceStats />
                    </div>
                </section>

                {/* ------------------------------------------------ why join */}
                <Section id="why" title="Why join Lapshark" tint>
                    <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
                        {[
                            { icon: BadgeIndianRupee, t: "Commission on delivered sales", d: "Paid after every successful delivery" },
                            { icon: Boxes, t: "No inventory", d: "Lapshark manages stock, quality checks and delivery" },
                            { icon: Handshake, t: "Close your own deals", d: "Negotiate within approved price limits as an Independent partner" },
                            { icon: Clock, t: "Part-time, low risk", d: "No fee to join, and it runs alongside your current job" },
                        ].map((c) => (
                            <div key={c.t} className="grid grid-cols-[18px_1fr] gap-x-3">
                                <c.icon className={`${icon} mt-0.5`} strokeWidth={1.5} />
                                <div>
                                    <dt className="text-[15px] font-medium text-[#111827]">{c.t}</dt>
                                    <dd className="mt-1 text-sm text-[#4b5565]">{c.d}</dd>
                                </div>
                            </div>
                        ))}
                    </dl>
                </Section>

                {/* ------------------------------------------------ two ways */}
                <Section id="ways" title="Two ways to earn" intro="You choose one when you apply">
                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            { icon: Users, t: "Referral Ambassador", d: "Refer interested buyers to Lapshark. Our team handles the rest, and you earn a fixed commission on the sale.", best: "Best if you know buyers but don't want to sell" },
                            { icon: Handshake, t: "Independent Sales Ambassador", d: "Find customers, send price-locked quotations, negotiate within the approved range and close sales yourself. You earn a base commission plus a share of the price you achieve above the approved minimum.", best: "Best if you enjoy selling and want more per sale" },
                        ].map((w) => (
                            <div key={w.t} className="rounded-2xl bg-white p-6 ring-1 ring-[#111827]/[0.08]">
                                <w.icon className={icon} strokeWidth={1.5} />
                                <h3 className="mt-4 text-lg font-medium text-[#111827]">{w.t}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#4b5565]">{w.d}</p>
                                <p className="mt-4 border-t border-[#111827]/[0.08] pt-4 text-[13px] text-[#6b7487]">{w.best}</p>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ------------------------------------------------ how it works */}
                <Section id="how" title="How it works" tint>
                    <ol className="grid gap-8 md:grid-cols-4 md:gap-6">
                        {[
                            { t: "Register and verify", d: "Sign up, verify your mobile with an OTP and get approved" },
                            { t: "Get your tools", d: "The live catalogue, your referral link and QR code" },
                            { t: "Refer or sell", d: "Bring customers, register them as leads, negotiate and close" },
                            { t: "Get paid", d: "Commission after delivery, cleared payment and the return window" },
                        ].map((s, i) => (
                            <li key={s.t} className="border-t border-[#111827]/[0.12] pt-4">
                                <p className={`${META} text-[13px] text-[#6b7487]`}>{String(i + 1).padStart(2, "0")}</p>
                                <p className="mt-2 text-[15px] font-medium text-[#111827]">{s.t}</p>
                                <p className="mt-1 text-sm text-[#4b5565]">{s.d}</p>
                            </li>
                        ))}
                    </ol>
                </Section>

                {/* ------------------------------------------------ earnings + form */}
                <section id="earnings" className="scroll-mt-24 border-t border-[#111827]/[0.08] bg-white">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8 lg:py-24">
                        <div className="min-w-0 space-y-8">
                            <div>
                                <h2 className="text-[28px] font-medium leading-[1.15] tracking-[-0.01em] text-[#111827]">Commission and earnings</h2>
                                <p className="mt-3 text-[15px] text-[#4b5565]">You earn on every laptop that&apos;s delivered and paid for. Founding partner rates</p>
                                <p className="mt-3 inline-flex rounded-full bg-[#0f766e]/10 px-3 py-1 text-[13px] font-medium text-[#0f766e]">Join in the founding cohort and your rates are locked for your first {FOUNDING_RATE_LOCK_MONTHS} months</p>
                            </div>
                            <div className="overflow-hidden rounded-2xl ring-1 ring-[#111827]/[0.08]">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#f5f7fa] text-left text-[13px] text-[#6b7487]">
                                        <tr><th className="px-5 py-3 font-normal">Partner type</th><th className="px-5 py-3 font-normal">Laptop price</th><th className="px-5 py-3 text-right font-normal">Example commission</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#111827]/[0.08]">
                                        {ILLUSTRATIVE_REFERRAL_SLABS.map((s, i) => (
                                            <tr key={s.label}>
                                                {i === 0 && <td rowSpan={ILLUSTRATIVE_REFERRAL_SLABS.length} className="px-5 py-3 align-top"><span className="text-[#111827]">Referral</span><span className="mt-1 block text-[13px] text-[#6b7487]">Fixed per sale</span></td>}
                                                <td className={`${MONO} px-5 py-3 text-[#4b5565]`}>{s.label}</td>
                                                <td className={`${MONO} px-5 py-3 text-right text-[#111827]`}>₹{s.commission.toLocaleString("en-IN")}</td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td className="px-5 py-3 align-top"><span className="text-[#111827]">Independent</span><span className="mt-1 block text-[13px] text-[#6b7487]">Base + margin share</span></td>
                                            <td className="px-5 py-3 text-[#4b5565]">Sold at <span className={MONO}>₹{INDEPENDENT_EXAMPLE_SOLD.toLocaleString("en-IN")}</span>, approved minimum <span className={MONO}>₹{INDEPENDENT_EXAMPLE_MINIMUM.toLocaleString("en-IN")}</span></td>
                                            <td className={`${MONO} px-5 py-3 text-right text-[#111827]`}>₹{ILLUSTRATIVE_INDEPENDENT.base.toLocaleString("en-IN")} + ₹{INDEPENDENT_EXAMPLE_SHARE.toLocaleString("en-IN")} = <span className="text-[#0f766e]">₹{(ILLUSTRATIVE_INDEPENDENT.base + INDEPENDENT_EXAMPLE_SHARE).toLocaleString("en-IN")}</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                                <p className="border-t border-[#111827]/[0.08] px-5 py-3 text-[13px] text-[#6b7487]">Independent partners earn more the better they sell: every rupee above the approved minimum adds to the commission</p>
                            </div>
                            <EarningsCalculator />
                        </div>
                        <div className="lg:sticky lg:top-28"><JoinForm /></div>
                    </div>
                </section>

                {/* ------------------------------------------------ what you'll sell */}
                <Section id="sell" title="What you'll sell" intro="Quality-checked refurbished business laptops from leading brands. Real stock at today's prices" tint>
                    <div className="mb-8 flex flex-wrap items-center gap-10 opacity-60">
                        {[dell, hp, lenovo, apple].map((logo, i) => <Image key={i} src={logo} alt="" className="h-7 w-auto grayscale" />)}
                    </div>
                    <LiveStock />
                    <ul className="mt-10 grid gap-x-8 gap-y-5 border-t border-[#111827]/[0.08] pt-8 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { icon: PackageCheck, t: `${STORE_POLICIES.qualityCheckPoints}+ point quality check`, d: "Before every listing" },
                            { icon: ShieldCheck, t: `${STORE_POLICIES.warrantyMonths}-month warranty`, d: "Extensions available at checkout" },
                            { icon: RotateCcw, t: `${STORE_POLICIES.returnDays}-day returns`, d: "Free pickup, conditions apply" },
                            { icon: Truck, t: "Delivery across India", d: "Lapshark ships every order" },
                        ].map((x) => (
                            <li key={x.t} className="grid grid-cols-[18px_1fr] gap-x-3">
                                <x.icon className={`${icon} mt-0.5`} strokeWidth={1.5} />
                                <div><p className="text-sm text-[#111827]">{x.t}</p><p className="text-[13px] text-[#6b7487]">{x.d}</p></div>
                            </li>
                        ))}
                    </ul>
                </Section>

                {/* ------------------------------------------------ backed by a real store */}
                <Section id="store" title="Backed by a real laptop store" intro="You're not selling for an anonymous website. Your customers can walk in, see the laptop and talk to us">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid grid-cols-[18px_1fr] gap-x-3 rounded-2xl bg-white p-5 ring-1 ring-[#111827]/[0.08]">
                            <Store className={`${icon} mt-0.5`} strokeWidth={1.5} />
                            <div><p className="text-[15px] font-medium text-[#111827]">Lapshark store, Banashankari</p><p className="mt-1 flex gap-1.5 text-sm text-[#4b5565]"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6b7487]" strokeWidth={1.5} />Banashankari 1st Stage, Bengaluru 560050</p></div>
                        </div>
                        <div className="grid grid-cols-[18px_1fr] gap-x-3 rounded-2xl bg-white p-5 ring-1 ring-[#111827]/[0.08]">
                            <Headphones className={`${icon} mt-0.5`} strokeWidth={1.5} />
                            <div><p className="text-[15px] font-medium text-[#111827]">Support every day</p><p className="mt-1 text-sm text-[#4b5565]">Mon–Sun, 10am–8:30pm, for you and your customers</p></div>
                        </div>
                        <div className="rounded-2xl bg-[#f5f7fa] p-6 sm:col-span-2">
                            <p className="text-sm text-[#6b7487]">No partner stories here yet</p>
                            <p className="mt-2 text-xl font-medium leading-snug text-[#111827]">That&apos;s because you&apos;re early. The first stories will come from the founding cohort.</p>
                            <p className="mt-2 text-sm text-[#4b5565]"><InterestLine /></p>
                        </div>
                    </div>
                </Section>

                {/* ------------------------------------------------ faq */}
                <Section id="faq" title="Questions" intro={<>Anything else? Call or visit the Banashankari store, Mon–Sun 10am–8:30pm</>} tint>
                    <div className="divide-y divide-[#111827]/[0.08] rounded-2xl bg-white ring-1 ring-[#111827]/[0.08]">
                        {faqs.map((f) => (
                            <details key={f.q} className="group px-5 py-4">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]">
                                    {f.q}
                                    <span className="text-lg leading-none text-[#6b7487] transition-transform duration-150 group-open:rotate-45">+</span>
                                </summary>
                                <p className="mt-3 text-sm leading-relaxed text-[#4b5565]">{f.a}</p>
                            </details>
                        ))}
                    </div>
                    <p className="mt-6 text-[13px] text-[#6b7487]">Partners are independent participants, not Lapshark employees or agents. Customers always pay Lapshark directly. See the <Link href="/terms" className="underline underline-offset-2">Terms</Link> and <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.</p>
                </Section>

                {/* ------------------------------------------------ final CTA */}
                <section className="border-t border-[#111827]/[0.08] bg-white">
                    <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-[1.2fr_1fr] lg:px-8 lg:py-24">
                        <div>
                            <h2 className="text-[32px] font-medium leading-[1.15] tracking-[-0.02em] text-[#111827] sm:text-[40px]">Reserve a founding spot in Bangalore</h2>
                            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#4b5565]">Customers stay with the first partner who registers them, for 30 days. Join now so the people who ask you about laptops can be credited to you.</p>
                            <div className="mt-8"><JoinButton /></div>
                        </div>
                        <div className="rounded-2xl bg-[#f5f7fa] p-6"><SeatStrip /></div>
                    </div>
                </section>

                <StickyCta />
                <div className="h-20 md:h-0" />
            </div>
        </LandingProvider>
    );
}
