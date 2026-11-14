"use client";

// Interactive pieces of the /partner landing page. Every number shown here is
// either real (live from the API: founding-cohort seats, interest count,
// stock) or an explicitly labelled illustrative example. No invented earnings
// claims, testimonials, ratings or sales counts (voice.md, docs/10).
//
// Visual system (unslop pass, 2026-11-10): ink-tinted neutrals, Lapshark teal
// as the one accent, Geist + Geist Mono for figures, and one signature detail,
// the founding "seat strip" (SeatStrip). Design method: unslop by Damir
// Sokolovsky (@heydamir), CC BY 4.0.
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowRight, CheckCircle2, Info, Laptop, Loader2, Lock } from "lucide-react";
import { API_URL } from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { apiError, partnerApi, Programme } from "@/lib/partnerApi";
import { calculateProductPrice } from "@/lib/pricing";
import { STORE_POLICIES } from "@/lib/policies";
import {
    FOUNDING_RATE_LOCK_MONTHS, ILLUSTRATIVE_INDEPENDENT, ILLUSTRATIVE_MAX_ROOM, ILLUSTRATIVE_REFERRAL_SLABS, ILLUSTRATIVE_TYPICAL_ROOM, illustrativeIndependentCommission, illustrativeReferralCommission,
} from "@/lib/illustrativeCommission";

// Shared classes. Ink ramp: #111827 primary, #4b5565 secondary, #6b7487 muted,
// #f5f7fa page, #eceff4 raised. Accent: Lapshark teal #0f766e (5.5:1 on white).
// Money and figures: the interface face with tabular digits. Mono only for
// counts and step numbers (Geist Mono spaces Indian-format commas too wide).
export const MONO = "tabular-nums";
export const META = "font-[family-name:var(--font-partner-mono)] tabular-nums";
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// ---------------------------------------------------------------- data

interface LiveProduct {
    _id: string;
    title: string;
    slug?: string;
    brand: string;
    image: string;
    price: number;
    specs?: Record<string, string>;
    condition?: string;
}

interface Ctx {
    programme: Programme | null;
    programmeFailed?: boolean;
    stock: { count: number; brands: number; products: LiveProduct[] } | null;
}
const LandingCtx = createContext<Ctx>({ programme: null, stock: null });
const useLanding = () => useContext(LandingCtx);

export function LandingProvider({ children }: { children: React.ReactNode }) {
    const [programme, setProgramme] = useState<Programme | null>(null);
    const [programmeFailed, setProgrammeFailed] = useState(false);
    const [stock, setStock] = useState<Ctx["stock"]>(null);
    useEffect(() => {
        partnerApi.programme().then(setProgramme).catch(() => setProgrammeFailed(true));
        axios
            .get(`${API_URL}/products`)
            .then((r) => {
                const all = (Array.isArray(r.data) ? r.data : []).filter((p: any) => p.stock > 0 && p.category !== "Accessories");
                const products: LiveProduct[] = all
                    .map((p: any) => ({ _id: p._id, title: p.title, slug: p.slug, brand: p.brand, image: p.image, specs: p.specs, condition: p.condition, price: calculateProductPrice(p.finalPrice || 0, p.extraOffer).finalPrice }))
                    .sort((a: LiveProduct, b: LiveProduct) => a.price - b.price);
                setStock({ count: products.length, brands: new Set(products.map((p) => p.brand)).size, products });
            })
            .catch(() => setStock(null));
    }, []);
    return <LandingCtx.Provider value={{ programme, programmeFailed, stock }}>{children}</LandingCtx.Provider>;
}

function seats(p: Programme | null) {
    if (!p?.cohort || !p.cohort.size) return null;
    const left = Math.max(0, p.cohort.size - p.cohort.taken);
    return { size: p.cohort.size, taken: p.cohort.taken, left };
}

const scrollToForm = () => document.getElementById("join")?.scrollIntoView({ behavior: "smooth", block: "start" });

// ---------------------------------------------------------------- buttons

export function JoinButton({ className = "", children = "Become a Sales Ambassador", size = "lg" }: { className?: string; children?: React.ReactNode; size?: "lg" | "sm" }) {
    return (
        <button
            onClick={scrollToForm}
            className={`inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#0f766e] font-medium text-white transition-[background-color,transform] duration-150 ${EASE} hover:bg-[#115e59] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 ${size === "lg" ? "h-12 px-5 text-[15px]" : "h-9 px-4 text-sm"} ${className}`}
        >
            {children} <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
    );
}

// ---------------------------------------------------------------- signature: the seat strip

// The founding cohort drawn as its seats: one square per spot, taken ones in
// teal. Real numbers from GET /partners/programme; renders nothing without them.
export function SeatStrip({ tone = "light", detail = true }: { tone?: "light" | "dark"; detail?: boolean }) {
    const { programme } = useLanding();
    const s = seats(programme);
    if (!s) return null;
    const dark = tone === "dark";
    const full = s.left === 0;
    return (
        <div>
            <div className="flex items-center gap-[3px]" role="img" aria-label={`${s.taken} of ${s.size} founding spots taken`}>
                {Array.from({ length: s.size }, (_, i) => (
                    <span key={i} className={`h-3 w-3 rounded-[3px] ${i < s.taken ? "bg-[#0f766e]" : dark ? "bg-white/[0.12]" : "bg-[#111827]/[0.08]"}`} />
                ))}
            </div>
            <p className={`mt-3 text-sm ${dark ? "text-[#eef0f5]" : "text-[#111827]"}`}>
                <span className={META}>{full ? "Founding cohort full" : `${s.left} of ${s.size}`}</span>
                {!full && <span className={dark ? "text-[#a3a9b8]" : "text-[#4b5565]"}> founding spots left in Bangalore</span>}
            </p>
            {!full && (
                <p className={`mt-1 text-[13px] font-medium ${dark ? "text-[#5eead4]" : "text-[#0f766e]"}`}>
                    Founding partner rates, locked for your first {FOUNDING_RATE_LOCK_MONTHS} months
                </p>
            )}
            {detail && (
                <p className={`mt-1 text-[13px] ${dark ? "text-[#7a8296]" : "text-[#6b7487]"}`}>
                    {full
                        ? "Join the waitlist and we'll invite you to the next batch"
                        : programme && programme.interestCount >= 5
                            ? `${programme.interestCount} people have applied or reserved a spot so far`
                            : "We're onboarding a small founding group first"}
                </p>
            )}
        </div>
    );
}

export function SeatsLeft() {
    const s = seats(useLanding().programme);
    if (!s) return <>Small batch</>;
    return <>{s.left} of {s.size}</>;
}

// ---------------------------------------------------------------- hero visual

// One real laptop from live stock, with a price tag hanging off it: today's
// price and the example referral commission for that price.
export function HeroVisual() {
    const { stock } = useLanding();
    const hero = stock?.products.find((p) => p.image && p.price > 20000 && p.price <= 40000) || stock?.products.find((p) => p.image);
    const example = hero ? illustrativeReferralCommission(hero.price) : null;
    return (
        <div className="relative mx-auto w-full max-w-[560px] sm:pb-10">
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] ring-1 ring-[#111827]/[0.08]">
                <div className="flex aspect-[4/3] items-center justify-center p-8">
                    {hero ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={hero.image} alt={hero.title} className="max-h-full max-w-full object-contain" />
                    ) : (
                        <Laptop className="h-32 w-32 text-[#111827]/10" strokeWidth={1} />
                    )}
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-[#111827]/[0.08] px-5 py-4 sm:pr-72">
                    <div className="min-w-0">
                        <p className="truncate text-sm text-[#111827]">{hero ? hero.title : "Live Lapshark stock"}</p>
                        <p className="mt-1 flex items-center gap-2 text-[13px] text-[#6b7487]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                            {stock ? `In stock · one of ${stock.count} laptops listed today` : "Loading stock"}
                        </p>
                    </div>
                </div>
            </div>

            {hero && (
                <div className="relative ml-auto mr-4 mt-4 w-56 rotate-[-2deg] rounded-xl bg-[#fdfbf7] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.10)] ring-1 ring-[#1f1b16]/10 sm:absolute sm:bottom-0 sm:right-8 sm:mr-0 sm:mt-0">
                    <span className="absolute left-1/2 top-2.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white ring-1 ring-[#1f1b16]/20" />
                    <p className="mt-3 text-[12px] text-[#7b7266]">Price today</p>
                    <p className={`${MONO} text-[22px] leading-tight text-[#1f1b16]`}>{rupees(hero.price)}</p>
                    <div className="my-3 border-t border-dashed border-[#1f1b16]/20" />
                    <p className="text-[12px] text-[#7b7266]">Example referral commission</p>
                    <p className={`${MONO} text-[22px] leading-tight text-[#0f766e]`}>{example ? rupees(example) : "Set per laptop"}</p>
                    <p className="mt-2 text-[11px] leading-snug text-[#7b7266]">Founding partner rate, paid after delivery and the {STORE_POLICIES.returnDays}-day return window</p>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------- why now

export function LeadRaceStats() {
    const { programme } = useLanding();
    const s = seats(programme);
    const days = programme?.leadOwnershipDays ?? 30;
    const items = [
        { big: `${days} days`, small: "A customer stays with the first partner who registers them" },
        { big: "First come", small: "Colleagues, classmates and friends can be registered by any partner" },
        { big: s ? `${s.left} of ${s.size}` : "Small batch", small: s ? "Founding spots left in Bangalore" : "Founding partners onboard first" },
    ];
    return (
        <dl className="divide-y divide-[#111827]/[0.08] rounded-2xl bg-white ring-1 ring-[#111827]/[0.08]">
            {items.map((i) => (
                <div key={i.big} className="grid grid-cols-[140px_1fr] items-baseline gap-4 px-6 py-5">
                    <dt className="text-[22px] tabular-nums text-[#111827]">{i.big}</dt>
                    <dd className="text-sm text-[#4b5565]">{i.small}</dd>
                </div>
            ))}
        </dl>
    );
}

// ---------------------------------------------------------------- earnings (the dark moment)

export function EarningsCalculator() {
    const [type, setType] = useState<"referral" | "independent">("referral");
    const [perMonth, setPerMonth] = useState(3);
    const [slab, setSlab] = useState(1);
    const [above, setAbove] = useState<number>(ILLUSTRATIVE_TYPICAL_ROOM);
    const perSale = type === "referral" ? ILLUSTRATIVE_REFERRAL_SLABS[slab].commission : illustrativeIndependentCommission(above);
    const month = perSale * perMonth;
    return (
        <div className="rounded-2xl bg-[#11141c] p-6 text-[#eef0f5] sm:p-8">
            <p className="text-[15px] text-[#eef0f5]">What your network could be worth</p>
            <div className="mt-4 inline-flex rounded-[10px] bg-[#1a1e28] p-1 text-sm">
                {(["referral", "independent"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`h-8 rounded-[6px] px-3 transition-colors duration-150 ${type === t ? "bg-[#eef0f5] text-[#0b0d14] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" : "text-[#a3a9b8] hover:text-[#eef0f5]"}`}
                    >
                        {t === "referral" ? "Referral" : "Independent"}
                    </button>
                ))}
            </div>
            <label className="mt-6 block text-sm">
                <span className="flex justify-between text-[#a3a9b8]"><span>Laptops sold through you per month</span><span className={`${MONO} text-[#eef0f5]`}>{perMonth}</span></span>
                <input type="range" min={1} max={15} value={perMonth} onChange={(e) => setPerMonth(Number(e.target.value))} className="mt-3 w-full accent-[#2dd4bf]" />
            </label>
            {type === "referral" ? (
                <label className="mt-5 block text-sm">
                    <span className="text-[#a3a9b8]">Typical laptop price</span>
                    <select value={slab} onChange={(e) => setSlab(Number(e.target.value))} className="mt-2 h-10 w-full rounded-[8px] bg-[#1a1e28] px-3 text-[#eef0f5] ring-1 ring-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#2dd4bf] [color-scheme:dark] [&>option]:bg-[#1a1e28] [&>option]:text-[#eef0f5]">
                        {ILLUSTRATIVE_REFERRAL_SLABS.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
                    </select>
                </label>
            ) : (
                <label className="mt-5 block text-sm">
                    <span className="flex justify-between text-[#a3a9b8]"><span>You sell above the approved minimum by</span><span className={`${MONO} text-[#eef0f5]`}>{rupees(above)}</span></span>
                    <input type="range" min={0} max={ILLUSTRATIVE_MAX_ROOM} step={250} value={above} onChange={(e) => setAbove(Number(e.target.value))} className="mt-3 w-full accent-[#2dd4bf]" />
                </label>
            )}
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.08]">
                <div className="bg-[#11141c] py-1 pr-4">
                    <p className="text-[13px] text-[#7a8296]">Per sale</p>
                    <p className={`${MONO} mt-1 text-[32px] leading-none text-[#eef0f5]`}>{rupees(perSale)}</p>
                </div>
                <div className="bg-[#11141c] py-1 pl-6">
                    <p className="text-[13px] text-[#7a8296]">Per month, example</p>
                    <p className={`${MONO} mt-1 text-[32px] leading-none text-[#5eead4]`}>{rupees(month)}</p>
                </div>
            </div>
            <p className="mt-6 text-[12px] leading-relaxed text-[#7a8296]">
                Illustrative only, at founding partner rates{type === "independent" ? ` (₹${ILLUSTRATIVE_INDEPENDENT.base} base + ${ILLUSTRATIVE_INDEPENDENT.sharePercent}% of the price above the minimum)` : ""}. Not a promise of income: actual rates are set per laptop by Lapshark and shown in your dashboard, and you earn only on delivered, paid sales.
            </p>
        </div>
    );
}

// ---------------------------------------------------------------- live stock

export function LiveStock() {
    const { stock } = useLanding();
    const picks = useMemo(() => {
        if (!stock) return [];
        // A spread across price points, not just the cheapest four.
        const ps = stock.products.filter((p) => p.image);
        if (ps.length <= 4) return ps;
        return [0, 0.33, 0.66, 0.95].map((f) => ps[Math.floor(f * (ps.length - 1))]);
    }, [stock]);
    if (!stock) return <div className="h-64 rounded-2xl bg-[#eceff4]" />;
    if (!picks.length) return null;
    return (
        <div>
            <p className="mb-5 flex items-center gap-2 text-sm text-[#4b5565]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                <span><span className={`${MONO} text-[#111827]`}>{stock.count}</span> laptops from {stock.brands} brands in stock right now. Stock moves daily</span>
            </p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {picks.map((p) => {
                    const c = illustrativeReferralCommission(p.price);
                    return (
                        <Link key={p._id} href={p.slug ? `/products/${p.slug}` : "/products"} className="group rounded-2xl bg-white p-4 ring-1 ring-[#111827]/[0.08] transition-shadow duration-150 hover:ring-[#111827]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]">
                            <div className="flex h-32 items-center justify-center rounded-[8px]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.image} alt={p.title} className="max-h-28 object-contain" loading="lazy" />
                            </div>
                            <p className="mt-3 line-clamp-2 text-sm text-[#111827]">{p.title}</p>
                            <p className={`${MONO} mt-2 text-[15px] text-[#111827]`}>{rupees(p.price)}</p>
                            <p className="mt-1 text-[12px] text-[#6b7487]">{c ? <>Example referral commission <span className={`${MONO} text-[#0f766e]`}>{rupees(c)}</span></> : "Commission set per laptop"}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- join form

const DRAFT_KEY = "lapshark_partner_draft";
const OCCUPATIONS = ["IT professional / developer", "System or network admin", "IT consultant", "Corporate employee", "Freelancer", "Student", "Laptop technician", "Business owner", "Other"];

type Mode = "loading" | "waitlist" | "apply" | "closed";

// Module-level (not inside JoinForm): a component defined during render is a
// new type every render, which remounts its inputs and drops focus per key.
function Row({ label, req, error, info, children }: { label: string; req?: boolean; error?: string; info?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="grid gap-2 sm:grid-cols-[120px_1fr] sm:items-center sm:gap-4">
            <span className="relative flex items-center gap-1.5 text-sm text-[#4b5565]">{label}{req && <span className="text-[#dc2626]"> *</span>}{info}</span>
            <div>{children}{error && <p className="mt-1 text-[13px] text-[#dc2626]">{error}</p>}</div>
        </div>
    );
}

// Hover (or tap, on phones) the info icon next to "Partner type" to compare
// the two types. Rates come from the same constants as the earnings section.
function PartnerTypeInfo() {
    const slabs = ILLUSTRATIVE_REFERRAL_SLABS;
    const rows: [string, string, string][] = [
        ["Your job", "Bring interested buyers. Our team sells and closes", "Find the customer, negotiate and close the sale yourself"],
        ["Price to customer", "Website price", "Your quote, between the laptop's approved minimum and the website price"],
        ["Quotations", "Not needed", "Send price-locked quotations, valid 24 hours"],
        ["Commission", `Fixed by laptop price: ₹${slabs[0].commission.toLocaleString("en-IN")} to ₹${slabs[slabs.length - 1].commission.toLocaleString("en-IN")} on laptops up to ₹40,000`, `₹${ILLUSTRATIVE_INDEPENDENT.base.toLocaleString("en-IN")} base + ${ILLUSTRATIVE_INDEPENDENT.sharePercent}% of the price above the approved minimum`],
        ["Best if", "You know buyers but don't want to sell", "You enjoy selling"],
    ];
    return (
        <span className="group inline-flex">
            <button type="button" aria-label="Compare partner types" aria-describedby="ptype-info" className="rounded-full text-[#6b7487] outline-none transition-colors duration-150 hover:text-[#0f766e] focus-visible:text-[#0f766e] focus-visible:ring-2 focus-visible:ring-[#0f766e]/40">
                <Info className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <span id="ptype-info" role="tooltip" className="pointer-events-none invisible absolute left-0 top-full z-30 mt-2 w-[min(calc(100vw-3rem),420px)] rounded-[12px] bg-white p-4 text-left opacity-0 shadow-lg ring-1 ring-[#111827]/[0.12] transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <span className="grid grid-cols-[88px_1fr_1fr] gap-x-3 gap-y-2 text-[12px] leading-snug">
                    <span />
                    <span className="font-medium text-[#111827]">Referral</span>
                    <span className="font-medium text-[#111827]">Independent</span>
                    {rows.map(([k, r, i]) => (
                        <React.Fragment key={k}>
                            <span className="text-[#6b7487]">{k}</span>
                            <span className="text-[#4b5565]">{r}</span>
                            <span className="text-[#4b5565]">{i}</span>
                        </React.Fragment>
                    ))}
                </span>
                <span className="mt-3 block border-t border-[#111827]/[0.08] pt-3 text-[12px] leading-snug text-[#6b7487]">
                    Same for both: a referral link and lead tracking, commission paid only on delivered, paid sales after the {STORE_POLICIES.returnDays}-day return window, and founding rates locked for your first {FOUNDING_RATE_LOCK_MONTHS} months. RAM, SSD and warranty upgrades don&apos;t change commission.
                </span>
            </span>
        </span>
    );
}

export function JoinForm() {
    const { programme, programmeFailed } = useLanding();
    const { user, loginWithUser } = useAuth();
    const router = useRouter();
    const s = seats(programme);

    // API unreachable → still capture interest via the waitlist rather than spin.
    const mode: Mode = !programme ? (programmeFailed ? "waitlist" : "loading") : !programme.programmeEnabled ? "waitlist" : programme.registrationOpen && !(s && s.left === 0) ? "apply" : "waitlist";

    const [f, setF] = useState({ fullName: "", phone: "", otp: "", email: "", city: "Bengaluru", occupation: "", partnerType: "referral" as "referral" | "independent", agree: false });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [msg, setMsg] = useState<{ tone: "red" | "green"; text: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [done, setDone] = useState(false);
    const set = (k: keyof typeof f, v: any) => setF((x) => ({ ...x, [k]: v }));

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const validate = (needPhone: boolean) => {
        const e: Record<string, string> = {};
        if (f.fullName.trim().length < 2) e.fullName = "Enter your full name";
        if (needPhone && !/^[6-9]\d{9}$/.test(f.phone)) e.phone = "Enter a valid 10-digit mobile number";
        if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) e.email = "Enter a valid email";
        if (mode === "apply" && !f.email) e.email = "Enter your email";
        if (!f.occupation) e.occupation = "Select your occupation";
        if (!f.agree) e.agree = mode === "apply" ? "Please accept to continue" : "Please agree to be contacted";
        setErrors(e);
        return !Object.keys(e).length;
    };

    const sendOtp = async () => {
        if (!/^[6-9]\d{9}$/.test(f.phone)) return setErrors((e) => ({ ...e, phone: "Enter a valid 10-digit mobile number" }));
        setBusy(true);
        setMsg(null);
        try {
            await axios.post(`${API_URL}/users/otp`, { mobile: f.phone });
            setOtpSent(true);
            setCooldown(60);
            setMsg({ tone: "green", text: "OTP sent on WhatsApp" });
        } catch (err: any) {
            setMsg({ tone: "red", text: err?.response?.data?.message || "Couldn't send the OTP. Please try again." });
        } finally {
            setBusy(false);
        }
    };

    const saveDraftAndContinue = () => {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ fullName: f.fullName, email: f.email, city: f.city, occupation: f.occupation, partnerType: f.partnerType }));
        router.push("/partner/register");
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        if (mode === "waitlist") {
            if (!validate(true)) return;
            setBusy(true);
            try {
                const q = new URLSearchParams(window.location.search);
                await partnerApi.joinWaitlist({
                    fullName: f.fullName, phone: f.phone, email: f.email || undefined, city: f.city, occupation: f.occupation, partnerType: f.partnerType, consent: true,
                    utmSource: q.get("utm_source") || undefined, utmMedium: q.get("utm_medium") || undefined, utmCampaign: q.get("utm_campaign") || undefined, referrer: document.referrer || undefined,
                });
                setDone(true);
            } catch (err) {
                const x = apiError(err);
                setErrors(x.errors);
                setMsg({ tone: "red", text: x.message });
            } finally {
                setBusy(false);
            }
            return;
        }
        // apply mode
        if (user) {
            if (!validate(false)) return;
            return saveDraftAndContinue();
        }
        if (!validate(true)) return;
        if (!otpSent) return sendOtp();
        if (!/^\d{6}$/.test(f.otp)) return setErrors((x) => ({ ...x, otp: "Enter the 6-digit OTP" }));
        setBusy(true);
        try {
            const r = await axios.post(`${API_URL}/users/login`, { mobile: f.phone, otp: f.otp });
            const u = r.data.user;
            loginWithUser({ id: u._id, name: u.name || f.fullName, email: u.email, mobile: u.mobile, role: "customer" } as any, u.token);
            if (r.data.isNewUser && f.fullName) {
                await axios.put(`${API_URL}/users/profile`, { name: f.fullName }, { headers: { Authorization: `Bearer ${u.token}` } }).catch(() => undefined);
            }
            saveDraftAndContinue();
        } catch (err: any) {
            setErrors((x) => ({ ...x, otp: err?.response?.data?.message || "Invalid OTP" }));
        } finally {
            setBusy(false);
        }
    };

    const input = "h-10 w-full rounded-[8px] border border-[#111827]/[0.12] bg-white px-3 text-sm text-[#111827] placeholder:text-[#6b7487] transition-colors duration-150 focus:border-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 disabled:bg-[#eceff4]";
    const link = "text-[#0f766e] underline underline-offset-2";

    const title = mode === "apply" ? "Apply to become a Sales Ambassador" : s && s.left === 0 ? "Join the next batch" : "Reserve a founding spot";
    const sub =
        mode === "apply"
            ? "Step 1 of 2. Verify your mobile, then add your details"
            : !programme?.programmeEnabled
                ? "Applications open soon. Reserve your place and we'll invite you first"
                : "We're onboarding by invitation, in the order spots were reserved";

    if (done) {
        return (
            <div id="join" className="scroll-mt-28 rounded-2xl bg-white p-8 text-center ring-1 ring-[#111827]/[0.08]">
                <CheckCircle2 className="mx-auto h-8 w-8 text-[#0f766e]" strokeWidth={1.5} />
                <h3 className="mt-4 text-[22px] font-medium text-[#111827]">You&apos;re on the list, {f.fullName.split(" ")[0]}</h3>
                <p className="mt-2 text-[15px] text-[#4b5565]">We&apos;ll contact you on <span className={MONO}>{f.phone}</span> when your invite is ready. Until then, keep a note of everyone who asks you which laptop to buy.</p>
                <Link href="/products" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#0f766e]">See what you&apos;ll sell <ArrowRight className="h-4 w-4" strokeWidth={1.5} /></Link>
            </div>
        );
    }

    return (
        <form id="join" onSubmit={submit} noValidate className="scroll-mt-28 rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] ring-1 ring-[#111827]/[0.08] sm:p-8">
            <h3 className="text-[22px] font-medium leading-tight text-[#111827]">{title}</h3>
            <p className="mt-1 text-sm text-[#4b5565]">{sub}</p>
            {s && s.left > 0 && <div className="mt-5"><SeatStrip detail={false} /></div>}
            {mode === "loading" ? (
                <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#6b7487]" strokeWidth={1.5} /></div>
            ) : (
                <div className="mt-6 space-y-4 border-t border-[#111827]/[0.08] pt-6">
                    {msg && <p className={`rounded-[8px] px-3 py-2 text-sm ${msg.tone === "red" ? "bg-[#dc2626]/[0.06] text-[#b91c1c]" : "bg-[#16a34a]/[0.08] text-[#15803d]"}`}>{msg.text}</p>}
                    <Row label="Full name" req error={errors.fullName}><input className={input} placeholder="Your full name" value={f.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" /></Row>
                    {(mode === "waitlist" || !user) && (
                        <Row label="Mobile" req error={errors.phone}>
                            <div className="flex gap-2">
                                <span className={`${MONO} inline-flex h-10 items-center rounded-[8px] bg-[#eceff4] px-3 text-sm text-[#4b5565]`}>+91</span>
                                <input className={input} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" value={f.phone} onChange={(e) => { set("phone", e.target.value.replace(/\D/g, "")); setOtpSent(false); }} autoComplete="tel-national" />
                                {mode === "apply" && (
                                    <button type="button" onClick={sendOtp} disabled={busy || cooldown > 0} className="h-10 shrink-0 rounded-[8px] bg-[#111827] px-3 text-sm text-white transition-colors duration-150 hover:bg-[#1f2937] disabled:opacity-50">{cooldown > 0 ? <span className={MONO}>{cooldown}s</span> : otpSent ? "Resend" : "Send OTP"}</button>
                                )}
                            </div>
                        </Row>
                    )}
                    {mode === "apply" && !user && (
                        <Row label="OTP" req error={errors.otp}><input className={`${input} ${MONO}`} inputMode="numeric" maxLength={6} placeholder={otpSent ? "6-digit OTP" : "Send OTP first"} disabled={!otpSent} value={f.otp} onChange={(e) => set("otp", e.target.value.replace(/\D/g, ""))} autoComplete="one-time-code" /></Row>
                    )}
                    {mode === "apply" && user && <p className="rounded-[8px] bg-[#eceff4] px-3 py-2 text-sm text-[#4b5565]">Signed in as <span className={`${MONO} text-[#111827]`}>{(user as any).mobile}</span>, verified</p>}
                    <Row label="Email" req={mode === "apply"} error={errors.email}><input type="email" className={input} placeholder="you@example.com" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></Row>
                    <Row label="City" req>
                        <select className={input} value={f.city} onChange={(e) => set("city", e.target.value)}>
                            {["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Other city in Karnataka", "Outside Karnataka"].map((c) => <option key={c}>{c}</option>)}
                        </select>
                    </Row>
                    <Row label="Occupation" req error={errors.occupation}>
                        <select className={input} value={f.occupation} onChange={(e) => set("occupation", e.target.value)}>
                            <option value="">Select</option>
                            {OCCUPATIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </Row>
                    <Row label="Partner type" req info={<PartnerTypeInfo />}>
                        <div className="grid gap-2">
                            {([
                                ["referral", "Referral Ambassador", "Refer customers to Lapshark"],
                                ["independent", "Independent Sales Ambassador", "Find, negotiate and close sales"],
                            ] as const).map(([v, t, d]) => (
                                <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-[10px] p-3 ring-1 transition-colors duration-150 ${f.partnerType === v ? "bg-[#0f766e]/[0.05] ring-[#0f766e]" : "ring-[#111827]/[0.12] hover:ring-[#111827]/25"}`}>
                                    <input type="radio" name="ptype" className="mt-1 accent-[#0f766e]" checked={f.partnerType === v} onChange={() => set("partnerType", v)} />
                                    <span><span className="block text-sm text-[#111827]">{t}</span><span className="block text-[13px] text-[#6b7487]">{d}</span></span>
                                </label>
                            ))}
                        </div>
                    </Row>
                    <label className="flex items-start gap-3 pt-1 text-sm text-[#4b5565]">
                        <input type="checkbox" className="mt-1 accent-[#0f766e]" checked={f.agree} onChange={(e) => set("agree", e.target.checked)} />
                        <span>
                            {mode === "apply" ? <>I agree to the Sales Ambassador programme terms (shown in the next step), the <Link href="/terms" target="_blank" className={link}>Terms &amp; Conditions</Link> and the <Link href="/privacy" target="_blank" className={link}>Privacy Policy</Link></> : <>Lapshark may contact me on WhatsApp, phone or email about the Sales Ambassador programme. See the <Link href="/privacy" target="_blank" className={link}>Privacy Policy</Link></>}
                        </span>
                    </label>
                    {errors.agree && <p className="-mt-2 text-[13px] text-[#dc2626]">{errors.agree}</p>}
                    <button type="submit" disabled={busy} className={`flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0f766e] text-[15px] font-medium text-white transition-[background-color,transform] duration-150 ${EASE} hover:bg-[#115e59] active:scale-[0.98] disabled:opacity-60`}>
                        {busy && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />}
                        {mode === "apply" ? (user ? "Continue my application" : otpSent ? "Verify and continue" : "Send OTP and continue") : "Reserve my spot"}
                        {!busy && <ArrowRight className="h-4 w-4" strokeWidth={1.5} />}
                    </button>
                    <p className="flex items-center justify-center gap-2 text-[13px] text-[#6b7487]"><Lock className="h-4 w-4" strokeWidth={1.5} />{mode === "apply" ? "PAN and payout details are collected securely in step 2" : "No payment and no documents now"}</p>
                    {mode === "waitlist" && programme?.programmeEnabled && <p className="text-center text-[13px] text-[#6b7487]">Already invited? <Link href="/partner/register" className="text-[#0f766e]">Apply now</Link></p>}
                </div>
            )}
        </form>
    );
}

// ---------------------------------------------------------------- sticky CTA

export function StickyCta() {
    const { programme } = useLanding();
    const s = seats(programme);
    const [show, setShow] = useState(false);
    useEffect(() => {
        const onScroll = () => {
            const form = document.getElementById("join");
            const formVisible = form ? form.getBoundingClientRect().top < window.innerHeight && form.getBoundingClientRect().bottom > 0 : false;
            setShow(window.scrollY > 700 && !formVisible);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return (
        <div className={`fixed inset-x-0 bottom-0 z-40 transition-[transform,opacity] duration-300 ${EASE} ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}>
            <div className="mx-auto max-w-2xl px-3 pb-3">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.10)] ring-1 ring-[#111827]/[0.08]">
                    <div className="min-w-0 text-sm">
                        <p className="text-[#111827]">{s ? (s.left > 0 ? <><span className={META}>{s.left} of {s.size}</span> founding spots left</> : "Founding cohort full") : "Founding cohort, Bangalore"}</p>
                        <p className="hidden text-[13px] text-[#6b7487] sm:block">Customers go to the first partner who registers them</p>
                    </div>
                    <JoinButton size="sm" className="shrink-0">{s && s.left === 0 ? "Join the waitlist" : "Reserve a spot"}</JoinButton>
                </div>
            </div>
        </div>
    );
}

export function InterestLine() {
    const { programme } = useLanding();
    if (!programme || programme.interestCount < 5) return <>Be one of the first partners in Bangalore.</>;
    return <>{programme.interestCount} people have applied or reserved a spot so far.</>;
}
