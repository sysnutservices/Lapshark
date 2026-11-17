"use client";

// The form half of the public /dealers landing page.
// - Dealer registration closed (or the API unreachable): a short enquiry form
//   that needs no login. Lapshark calls the person back.
// - Registration open: verify the mobile with the usual WhatsApp OTP, then the
//   full application (components/dealer/DealerRegister), the same form /dealer
//   shows. After applying, the card shows the application's status.
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Loader2, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { API_URL } from "@/api/api";
import { apiError } from "@/lib/partnerApi";
import {
    BUSINESS_TYPE_LABEL, dealerApi, DealerProfile, DealerProgramme, DEALER_STATUS_LABEL, MONTHLY_VOLUME_LABEL,
} from "@/lib/dealerApi";
import DealerRegister from "@/components/dealer/DealerRegister";
import { PARTNER_THEME } from "@/components/partner/ui";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const input = "h-10 w-full rounded-[8px] border border-[#111827]/[0.12] bg-white px-3 text-sm text-[#111827] placeholder:text-[#6b7487] transition-colors duration-150 focus:border-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 disabled:bg-[#eceff4]";
const shell = "rounded-[16px] bg-white p-6 ring-1 ring-[#111827]/[0.08] sm:p-8";

// PARTNER_THEME gives the shared form components (DealerRegister) the teal
// accent; it lives in a client module, so it's applied here, not in page.tsx.
export function DealerJoin() {
    return <div style={PARTNER_THEME}><DealerJoinInner /></div>;
}

function DealerJoinInner() {
    const [programme, setProgramme] = useState<DealerProgramme | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        dealerApi.programme().then(setProgramme).catch(() => setFailed(true));
    }, []);

    if (!programme && !failed) {
        return <div className={`${shell} flex min-h-[320px] items-center justify-center`}><Loader2 className="h-5 w-5 animate-spin text-[#6b7487]" strokeWidth={1.5} /></div>;
    }
    if (programme && programme.enabled && programme.registrationOpen) return <Apply programme={programme} />;
    return <Enquiry />;
}

// ---------------------------------------------------------------- enquiry

function Row({ label, req, error, children }: { label: string; req?: boolean; error?: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="text-sm text-[#4b5565]">{label}{req && <span className="text-[#dc2626]"> *</span>}</span>
            <div className="mt-1.5">{children}</div>
            {error && <p className="mt-1 text-[13px] text-[#dc2626]">{error}</p>}
        </label>
    );
}

function Enquiry() {
    const [f, setF] = useState({ businessName: "", contactName: "", phone: "", city: "", gstin: "", businessType: "", monthlyVolume: "", message: "", consent: false });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState<null | { again: boolean }>(null);
    const set = (k: keyof typeof f, v: string | boolean) => {
        setF((x) => ({ ...x, [k]: v }));
        setErrors((e) => (e[k] ? { ...e, [k]: "" } : e));
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (f.businessName.trim().length < 2) e.businessName = "Enter your business name";
        if (f.contactName.trim().length < 2) e.contactName = "Enter your name";
        if (!/^[6-9]\d{9}$/.test(f.phone)) e.phone = "Enter a valid 10-digit mobile number";
        if (!f.city.trim()) e.city = "Enter your city";
        if (f.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(f.gstin)) e.gstin = "Enter a valid 15-character GSTIN, or leave it blank";
        if (!f.businessType) e.businessType = "Choose your type of business";
        if (!f.monthlyVolume) e.monthlyVolume = "Choose how many laptops a month";
        if (!f.consent) e.consent = "Please agree to be contacted";
        setErrors(e);
        return !Object.keys(e).length;
    };

    const submit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setError("");
        if (!validate()) return;
        setBusy(true);
        try {
            const q = new URLSearchParams(window.location.search);
            const r = await dealerApi.enquire({
                businessName: f.businessName, contactName: f.contactName, phone: f.phone, city: f.city, gstin: f.gstin || undefined, businessType: f.businessType, monthlyVolume: f.monthlyVolume,
                message: f.message || undefined, consent: true,
                utmSource: q.get("utm_source") || undefined, utmMedium: q.get("utm_medium") || undefined, utmCampaign: q.get("utm_campaign") || undefined, referrer: document.referrer || undefined,
            });
            setDone({ again: r.alreadyEnquired });
        } catch (err) {
            const x = apiError(err);
            setErrors(x.errors || {});
            setError(x.message);
        } finally {
            setBusy(false);
        }
    };

    if (done) {
        return (
            <div className={`${shell} text-center`}>
                <CheckCircle2 className="mx-auto h-8 w-8 text-[#0f766e]" strokeWidth={1.5} />
                <h2 className="mt-4 text-xl font-medium text-[#111827]">{done.again ? "Details updated" : "Thanks, we have your details"}</h2>
                <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-[#4b5565]">We&apos;ll call you on +91 {f.phone} about buying as a dealer. When applications open, you can apply on this page.</p>
            </div>
        );
    }

    return (
        <form onSubmit={submit} noValidate className={shell}>
            <h2 className="text-xl font-medium text-[#111827]">Talk to us about dealer pricing</h2>
            <p className="mt-1.5 text-sm text-[#4b5565]">Dealer applications open soon. Leave your details and we&apos;ll call you</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Row label="Business name" req error={errors.businessName}><input className={input} value={f.businessName} onChange={(e) => set("businessName", e.target.value)} autoComplete="organization" /></Row>
                <Row label="Your name" req error={errors.contactName}><input className={input} value={f.contactName} onChange={(e) => set("contactName", e.target.value)} autoComplete="name" /></Row>
                <Row label="Mobile" req error={errors.phone}>
                    <div className="flex gap-2">
                        <span className="flex h-10 items-center rounded-[8px] bg-[#eceff4] px-3 text-sm text-[#4b5565]">+91</span>
                        <input className={input} value={f.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile" />
                    </div>
                </Row>
                <Row label="City" req error={errors.city}><input className={input} value={f.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" /></Row>
                <div className="sm:col-span-2">
                    <Row label="GSTIN (optional)" error={errors.gstin}>
                        <input className={`${input} uppercase tabular-nums placeholder:normal-case`} value={f.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15))} maxLength={15} autoComplete="off" spellCheck={false} placeholder="15-character GST number, if your business has one" />
                    </Row>
                </div>
                <div className="sm:col-span-2">
                    <Row label="Type of business" req error={errors.businessType}>
                        <select className={input} value={f.businessType} onChange={(e) => set("businessType", e.target.value)}>
                            <option value="">Select</option>
                            {Object.entries(BUSINESS_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </Row>
                </div>
                <div className="sm:col-span-2">
                    <Row label="Laptops you expect to buy a month" req error={errors.monthlyVolume}>
                        <select className={input} value={f.monthlyVolume} onChange={(e) => set("monthlyVolume", e.target.value)}>
                            <option value="">Select</option>
                            {Object.entries(MONTHLY_VOLUME_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </Row>
                </div>
                <div className="sm:col-span-2">
                    <Row label="Brands or models you want (optional)"><textarea className={`${input} h-20 py-2`} value={f.message} onChange={(e) => set("message", e.target.value)} maxLength={500} placeholder="e.g. Dell Latitude, Lenovo ThinkPad, i5 8th gen" /></Row>
                </div>
            </div>
            <label className="mt-5 flex items-start gap-3 text-sm text-[#4b5565]">
                <input type="checkbox" className="mt-1 accent-[#0f766e]" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} />
                <span>Lapshark may contact me on WhatsApp or phone about buying as a dealer. See the <Link href="/privacy" target="_blank" className="text-[#0f766e] underline underline-offset-2">Privacy Policy</Link></span>
            </label>
            {errors.consent && <p className="mt-1 text-[13px] text-[#dc2626]">{errors.consent}</p>}
            {error && <p className="mt-4 rounded-[8px] bg-[#dc2626]/[0.06] px-3 py-2 text-sm text-[#b91c1c]">{error}</p>}
            <button type="submit" disabled={busy} className={`mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0f766e] text-[15px] font-medium text-white transition-[background-color,transform] duration-150 ${EASE} hover:bg-[#115e59] active:scale-[0.98] disabled:opacity-60`}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} /> : null}
                Send my details
                {!busy && <ArrowRight className="h-4 w-4" strokeWidth={1.5} />}
            </button>
            <p className="mt-3 flex items-center justify-center gap-2 text-[13px] text-[#6b7487]"><Lock className="h-4 w-4" strokeWidth={1.5} />No PAN or documents needed now. GSTIN is stored encrypted</p>
        </form>
    );
}

// ---------------------------------------------------------------- application

// Step 1: WhatsApp OTP sign-in (same endpoints as the /partner form). Once
// AuthContext has the user, Apply re-renders into the application form.
function VerifyMobile() {
    const { loginWithUser } = useAuth();
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [sent, setSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [note, setNote] = useState("");

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const send = async () => {
        setError("");
        setNote("");
        if (!/^[6-9]\d{9}$/.test(phone)) return setError("Enter a valid 10-digit mobile number");
        setBusy(true);
        try {
            await axios.post(`${API_URL}/users/otp`, { mobile: phone });
            setSent(true);
            setCooldown(60);
            setNote("OTP sent on WhatsApp");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Couldn't send the OTP. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const submit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!sent) return send();
        setError("");
        if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit OTP");
        setBusy(true);
        try {
            const r = await axios.post(`${API_URL}/users/login`, { mobile: phone, otp });
            const u = r.data.user;
            loginWithUser({ id: u._id, name: u.name, email: u.email, mobile: u.mobile, role: "customer" } as any, u.token);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Invalid OTP");
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} noValidate className={shell}>
            <h2 className="text-xl font-medium text-[#111827]">Apply as a Lapshark dealer</h2>
            <p className="mt-1.5 text-sm text-[#4b5565]">Step 1 of 2. Verify your mobile number on WhatsApp, then add your business details</p>
            <div className="mt-6 grid gap-4">
                <Row label="Mobile" req>
                    <div className="flex gap-2">
                        <span className="flex h-10 items-center rounded-[8px] bg-[#eceff4] px-3 text-sm text-[#4b5565]">+91</span>
                        <input className={input} value={phone} disabled={sent} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile" />
                    </div>
                </Row>
                {sent && (
                    <Row label="OTP">
                        <input className={`${input} tabular-nums tracking-[0.2em]`} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" autoFocus />
                    </Row>
                )}
            </div>
            {sent && (
                <p className="mt-2 text-[13px] text-[#6b7487]">
                    {cooldown > 0 ? <>Resend in <span className="tabular-nums">{cooldown}</span>s</> : <button type="button" className="text-[#0f766e] underline underline-offset-2" onClick={send}>Resend OTP</button>}
                    {" · "}<button type="button" className="text-[#0f766e] underline underline-offset-2" onClick={() => { setSent(false); setOtp(""); setNote(""); }}>Change number</button>
                </p>
            )}
            {note && !error && <p className="mt-3 text-[13px] text-[#0f766e]">{note}</p>}
            {error && <p className="mt-3 text-[13px] text-[#dc2626]">{error}</p>}
            <button type="submit" disabled={busy} className={`mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0f766e] text-[15px] font-medium text-white transition-[background-color,transform] duration-150 ${EASE} hover:bg-[#115e59] active:scale-[0.98] disabled:opacity-60`}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />}
                {sent ? "Verify and continue" : "Send OTP on WhatsApp"}
                {!busy && <ArrowRight className="h-4 w-4" strokeWidth={1.5} />}
            </button>
            <p className="mt-3 flex items-center justify-center gap-2 text-[13px] text-[#6b7487]"><Lock className="h-4 w-4" strokeWidth={1.5} />GSTIN and PAN are collected in step 2 and stored encrypted</p>
        </form>
    );
}

function Apply({ programme }: { programme: DealerProgramme }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState<DealerProfile | null | undefined>(undefined);
    const [error, setError] = useState("");

    const load = useCallback(() => {
        if (!user) return;
        setProfile(undefined);
        setError("");
        dealerApi.profile().then((r) => setProfile(r.profile)).catch((err) => setError(apiError(err).message));
    }, [user]);
    useEffect(load, [load]);

    if (!user) return <VerifyMobile />;
    if (error) return <div className={shell}><p className="text-sm text-[#b91c1c]">{error}</p></div>;
    if (profile === undefined) return <div className={`${shell} flex min-h-[320px] items-center justify-center`}><Loader2 className="h-5 w-5 animate-spin text-[#6b7487]" strokeWidth={1.5} /></div>;
    if (!profile) return <DealerRegister programme={programme} onDone={load} embedded />;

    const approved = profile.status === "approved";
    return (
        <div className={`${shell} text-center`}>
            {approved ? <CheckCircle2 className="mx-auto h-8 w-8 text-[#0f766e]" strokeWidth={1.5} /> : <Clock className="mx-auto h-8 w-8 text-[#b45309]" strokeWidth={1.5} />}
            <h2 className="mt-4 text-xl font-medium text-[#111827]">{approved ? "You're an approved dealer" : profile.status === "applied" ? "Application under review" : `Dealer account ${DEALER_STATUS_LABEL[profile.status].toLowerCase()}`}</h2>
            <p className="mt-2 text-[15px] text-[#4b5565]">{profile.businessName} · <span className="tabular-nums">{profile.dealerCode}</span></p>
            {profile.status === "applied" && <p className="mx-auto mt-2 max-w-sm text-sm text-[#6b7487]">We&apos;ll contact you on {profile.phone} once it has been reviewed.</p>}
            <Link href="/dealer" className={`mt-6 inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#0f766e] px-5 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-[#115e59]`}>
                {approved ? "Open dealer catalogue" : "Go to my dealer account"} <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
        </div>
    );
}
