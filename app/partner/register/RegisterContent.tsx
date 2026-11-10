"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, CheckCircle2, Link2, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CheckoutLogin } from "@/components/LoginComponent";
import { apiError, partnerApi, PartnerType, Programme, PARTNER_STATUS_LABEL } from "@/lib/partnerApi";
import { Banner, Btn, Card, Field, inputCls, PARTNER_THEME, Spinner } from "@/components/partner/ui";

const PROGRAMME_RULES = [
    "Registration is free. I am not required to buy laptops or hold inventory.",
    "I will never collect customer payments into a personal account. Customers pay Lapshark directly.",
    "I will not promise warranty terms beyond Lapshark's published warranty, or misstate specifications.",
    "I will not offer discounts beyond what the Lapshark platform permits.",
    "All customer orders will be placed through Lapshark.",
    "I will only register customers who agreed to be contacted, and will not share or misuse their information.",
    "Commission is paid only on successful, delivered sales after payment clears, and may be reversed for cancellations, refunds or fraud.",
    "I am an independent participant, not a Lapshark employee or agent, and cannot bind Lapshark to any contract.",
    "I will comply with my employer's policies on outside work, conflicts of interest and solicitation.",
    "Lapshark may suspend or terminate my account for fraud or policy violations.",
];

type Form = {
    partnerType: PartnerType | "";
    fullName: string;
    email: string;
    dateOfBirth: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    occupation: string;
    heardFrom: string;
    businessName: string;
    gstin: string;
    pan: string;
    payoutMethod: "upi" | "bank";
    upiId: string;
    accountName: string;
    accountNumber: string;
    ifsc: string;
    acceptAgreement: boolean;
};

const empty: Form = {
    partnerType: "", fullName: "", email: "", dateOfBirth: "", line1: "", line2: "", city: "Bengaluru", state: "Karnataka", pincode: "",
    occupation: "", heardFrom: "", businessName: "", gstin: "", pan: "", payoutMethod: "upi", upiId: "", accountName: "", accountNumber: "", ifsc: "", acceptAgreement: false,
};

export function RegisterContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [programme, setProgramme] = useState<Programme | null>(null);
    const [checking, setChecking] = useState(true);
    const [existingStatus, setExistingStatus] = useState<string | null>(null);
    const [form, setForm] = useState<Form>(empty);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState<string | null>(null);

    useEffect(() => {
        partnerApi.programme().then(setProgramme).catch(() => setProgramme(null));
        // Prefill from the /partner landing form (step 1), if the visitor came that way.
        try {
            const raw = sessionStorage.getItem("lapshark_partner_draft");
            if (raw) {
                const d = JSON.parse(raw);
                const known = ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"];
                setForm((f) => ({
                    ...f,
                    fullName: d.fullName || f.fullName,
                    email: d.email || f.email,
                    occupation: d.occupation || f.occupation,
                    partnerType: d.partnerType === "independent" || d.partnerType === "referral" ? d.partnerType : f.partnerType,
                    city: known.includes(d.city) ? d.city : f.city,
                }));
            }
        } catch {
            /* ignore a malformed draft */
        }
    }, []);

    useEffect(() => {
        if (!user) {
            setChecking(false);
            return;
        }
        setChecking(true);
        partnerApi
            .profile()
            .then(({ profile }) => setExistingStatus(profile.status))
            .catch(() => setExistingStatus(null))
            .finally(() => setChecking(false));
    }, [user]);

    const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setMessage("");
        setSubmitting(true);
        try {
            const body = {
                partnerType: form.partnerType,
                fullName: form.fullName,
                email: form.email,
                dateOfBirth: form.dateOfBirth,
                address: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
                occupation: form.occupation,
                heardFrom: form.heardFrom || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_source") || "" : ""),
                business: form.businessName || form.gstin ? { name: form.businessName, gstin: form.gstin } : undefined,
                pan: form.pan,
                payout:
                    form.payoutMethod === "upi"
                        ? { method: "upi", upiId: form.upiId }
                        : { method: "bank", accountName: form.accountName, accountNumber: form.accountNumber, ifsc: form.ifsc },
                agreementVersion: programme?.agreementVersion,
                acceptAgreement: form.acceptAgreement,
            };
            const r = await partnerApi.register(body);
            sessionStorage.removeItem("lapshark_partner_draft");
            setDone(r.profile.partnerCode);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            const e2 = apiError(err);
            setErrors(e2.errors);
            setMessage(e2.message);
            if (e2.code === "ALREADY_REGISTERED") router.push("/partner/dashboard");
        } finally {
            setSubmitting(false);
        }
    };

    const wrap = (children: React.ReactNode) => (
        <div style={PARTNER_THEME} className="min-h-[70vh] bg-[#f5f7fa] py-12">
            <div className="max-w-3xl mx-auto px-4">
                <Link href="/partner" className="text-sm text-[#0f766e] hover:underline">← Sales Ambassador Network</Link>
                <h1 className="mt-2 text-3xl font-medium text-slate-900">Apply to become a Lapshark partner</h1>
                <div className="mt-6 space-y-6">{children}</div>
            </div>
        </div>
    );

    if (programme && !programme.programmeEnabled) return wrap(<Banner tone="amber">Applications are not open yet. Please check back soon.</Banner>);

    if (!user) {
        return wrap(
            <>
                <Banner>Step 1 of 2: verify your mobile number. We use the same secure WhatsApp OTP as Lapshark checkout.</Banner>
                <CheckoutLogin showLogo={false} />
            </>
        );
    }

    if (checking) return wrap(<Spinner />);

    if (done) {
        return wrap(
            <Card className="text-center py-10">
                <CheckCircle2 className="w-12 h-12 mx-auto text-[#0f766e]" />
                <h2 className="mt-4 text-xl font-medium text-slate-900">Application received</h2>
                <p className="mt-2 text-slate-600">Your partner ID is <span className="font-mono font-medium">{done}</span>. Our team will review your application and you will be able to sign in to your dashboard once approved.</p>
                <div className="mt-6"><Link href="/partner/dashboard" className="text-[#0f766e] font-medium hover:underline">Check application status →</Link></div>
            </Card>
        );
    }

    if (existingStatus) {
        return wrap(
            <Card>
                <p className="text-slate-700">You have already applied. Current status: <span className="font-medium">{PARTNER_STATUS_LABEL[existingStatus as keyof typeof PARTNER_STATUS_LABEL] || existingStatus}</span>.</p>
                <div className="mt-4"><Link href="/partner/dashboard" className="text-[#0f766e] font-medium hover:underline">Go to your partner dashboard →</Link></div>
            </Card>
        );
    }

    return wrap(
        <form onSubmit={submit} className="space-y-6" noValidate>
            {programme && !programme.registrationOpen && (
                <Banner tone="amber">We're in a pilot. Registration works only for mobile numbers Lapshark has invited.</Banner>
            )}
            {message && <Banner tone="red">{message}</Banner>}

            <Card>
                <h2 className="font-medium text-slate-900">1. Choose your partner type</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {([
                        { v: "referral", icon: Link2, title: "Referral Ambassador", text: "Introduce customers; Lapshark's team closes the sale. Fixed commission." },
                        { v: "independent", icon: Briefcase, title: "Independent Sales Ambassador", text: "Recommend, negotiate within approved limits and close sales yourself." },
                    ] as const).map((o) => (
                        <button type="button" key={o.v} onClick={() => set("partnerType", o.v)} className={`text-left rounded-xl border-2 p-4 transition ${form.partnerType === o.v ? "border-[#0f766e] bg-[#0f766e]/[0.06]" : "border-slate-200 hover:border-slate-300"}`}>
                            <o.icon className={`h-[18px] w-[18px] ${form.partnerType === o.v ? "text-[#0f766e]" : "text-[#6b7487]"}`} strokeWidth={1.5} />
                            <p className="mt-2 font-medium text-slate-900">{o.title}</p>
                            <p className="mt-1 text-xs text-slate-600">{o.text}</p>
                        </button>
                    ))}
                </div>
                {errors.partnerType && <p className="mt-2 text-xs text-rose-600">{errors.partnerType}</p>}
            </Card>

            <Card>
                <h2 className="font-medium text-slate-900">2. Your details</h2>
                <p className="mt-1 text-xs text-slate-500">Mobile: {(user as any).mobile} (verified)</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Full name (as on PAN)" error={errors.fullName}><input className={inputCls} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" /></Field>
                    <Field label="Email" error={errors.email}><input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></Field>
                    <Field label="Date of birth" error={errors.dateOfBirth} hint={`You must be ${programme?.minimumAge ?? 18} or older`}><input type="date" className={inputCls} value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} /></Field>
                    <Field label="Occupation (optional)"><input className={inputCls} value={form.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="e.g. Software engineer" /></Field>
                    <Field label="Address" error={errors["address.line1"]} className="sm:col-span-2"><input className={inputCls} value={form.line1} onChange={(e) => set("line1", e.target.value)} autoComplete="address-line1" /></Field>
                    <Field label="Address line 2 (optional)" className="sm:col-span-2"><input className={inputCls} value={form.line2} onChange={(e) => set("line2", e.target.value)} autoComplete="address-line2" /></Field>
                    <Field label="City" error={errors["address.city"]}><input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
                    <Field label="State" error={errors["address.state"]}><input className={inputCls} value={form.state} onChange={(e) => set("state", e.target.value)} /></Field>
                    <Field label="Pincode" error={errors["address.pincode"]}><input inputMode="numeric" maxLength={6} className={inputCls} value={form.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} /></Field>
                    <Field label="How did you hear about us? (optional)"><input className={inputCls} value={form.heardFrom} onChange={(e) => set("heardFrom", e.target.value)} placeholder="Instagram, a friend, LinkedIn…" /></Field>
                    <Field label="Business name (optional)"><input className={inputCls} value={form.businessName} onChange={(e) => set("businessName", e.target.value)} /></Field>
                    <Field label="GSTIN (optional)" error={errors["business.gstin"]}><input className={inputCls} value={form.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} /></Field>
                </div>
            </Card>

            <Card>
                <div className="flex items-center gap-2">
                    <h2 className="font-medium text-slate-900">3. Payout and tax details</h2>
                    <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <p className="mt-1 text-xs text-slate-500">Encrypted and shown only in masked form. Used for commission payouts and tax compliance.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="PAN" error={errors.pan}><input className={`${inputCls} uppercase`} maxLength={10} value={form.pan} onChange={(e) => set("pan", e.target.value.toUpperCase())} placeholder="ABCDE1234F" /></Field>
                    <Field label="Payout method" error={errors["payout.method"]}>
                        <select className={inputCls} value={form.payoutMethod} onChange={(e) => set("payoutMethod", e.target.value as "upi" | "bank")}>
                            <option value="upi">UPI</option>
                            <option value="bank">Bank transfer</option>
                        </select>
                    </Field>
                    {form.payoutMethod === "upi" ? (
                        <Field label="UPI ID" error={errors["payout.upiId"]} className="sm:col-span-2"><input className={inputCls} value={form.upiId} onChange={(e) => set("upiId", e.target.value.trim())} placeholder="name@bank" /></Field>
                    ) : (
                        <>
                            <Field label="Account holder name" error={errors["payout.accountName"]}><input className={inputCls} value={form.accountName} onChange={(e) => set("accountName", e.target.value)} /></Field>
                            <Field label="Account number" error={errors["payout.accountNumber"]}><input inputMode="numeric" className={inputCls} value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, ""))} /></Field>
                            <Field label="IFSC" error={errors["payout.ifsc"]}><input className={`${inputCls} uppercase`} maxLength={11} value={form.ifsc} onChange={(e) => set("ifsc", e.target.value.toUpperCase())} /></Field>
                        </>
                    )}
                </div>
            </Card>

            <Card>
                <h2 className="font-medium text-slate-900">4. Programme agreement</h2>
                <p className="mt-1 text-xs text-slate-500">Version {programme?.agreementVersion}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700 list-disc pl-5">
                    {PROGRAMME_RULES.map((r) => <li key={r}>{r}</li>)}
                </ul>
                <label className="mt-4 flex items-start gap-3 text-sm text-slate-800">
                    <input type="checkbox" className="mt-1" checked={form.acceptAgreement} onChange={(e) => set("acceptAgreement", e.target.checked)} />
                    <span>I have read and accept the programme agreement, Lapshark&apos;s <Link href="/terms" className="underline" target="_blank">Terms</Link> and <Link href="/privacy" className="underline" target="_blank">Privacy Policy</Link>.</span>
                </label>
                {(errors.acceptAgreement || errors.agreementVersion) && <p className="mt-2 text-xs text-rose-600">{errors.acceptAgreement || errors.agreementVersion}</p>}
            </Card>

            <div className="flex justify-end">
                <Btn type="submit" loading={submitting} className="px-6 py-3">Submit application</Btn>
            </div>
        </form>
    );
}
