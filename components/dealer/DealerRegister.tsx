"use client";

import { useState } from "react";
import { apiError } from "@/lib/partnerApi";
import { dealerApi, DealerProgramme } from "@/lib/dealerApi";
import { Banner, Btn, Card, Field, inputCls } from "@/components/partner/ui";

// The terms a dealer accepts. Only rules the system actually enforces;
// the full agreement text is still to come from Lapshark's lawyer.
const terms = (claimDays: number) => [
    "You buy laptops from Lapshark and resell them under your own name, on your own bill, to your own customers.",
    "Laptops come without Lapshark warranty unless you add warranty to a laptop when ordering. That warranty covers you, the dealer, not your customer.",
    `Damage in transit, or a laptop that doesn't match your order, must be reported within ${claimDays} days of delivery. There are no other returns.`,
    "Payment is by bank transfer or cash, before the laptops are dispatched or handed over. Cash is accepted only below ₹2,00,000 per order and per day.",
    "Don't present yourself as Lapshark or promise a Lapshark warranty to your customers.",
];

export default function DealerRegister({ programme, onDone }: { programme: DealerProgramme; onDone: () => void }) {
    const [f, setF] = useState({ businessName: "", contactName: "", email: "", gstin: "", pan: "", line1: "", line2: "", city: "", state: "", pincode: "" });
    const [agree, setAgree] = useState(false);
    const [noWarranty, setNoWarranty] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setErrors({});
        try {
            await dealerApi.register({
                businessName: f.businessName,
                contactName: f.contactName,
                email: f.email || undefined,
                gstin: f.gstin || undefined,
                pan: f.pan || undefined,
                address: { line1: f.line1, line2: f.line2 || undefined, city: f.city, state: f.state, pincode: f.pincode },
                agreementVersion: agree ? programme.agreementVersion : "",
                noWarrantyAcknowledged: noWarranty,
            });
            onDone();
        } catch (err) {
            const x = apiError(err);
            setError(x.message);
            setErrors(x.errors);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <h1 className="text-xl font-medium text-slate-900">Apply as a Lapshark dealer</h1>
            <p className="mt-1 text-sm text-slate-600">We review every application before you can order.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Business name" error={errors.businessName}><input className={inputCls} value={f.businessName} onChange={set("businessName")} autoComplete="organization" /></Field>
                    <Field label="Contact person" error={errors.contactName}><input className={inputCls} value={f.contactName} onChange={set("contactName")} autoComplete="name" /></Field>
                    <Field label="GSTIN" error={errors.gstin} hint="GSTIN or PAN is required"><input className={`${inputCls} uppercase`} value={f.gstin} onChange={set("gstin")} maxLength={15} /></Field>
                    <Field label="PAN" error={errors.pan}><input className={`${inputCls} uppercase`} value={f.pan} onChange={set("pan")} maxLength={10} /></Field>
                    <Field label="Email (optional)" error={errors.email} className="sm:col-span-2"><input type="email" className={inputCls} value={f.email} onChange={set("email")} autoComplete="email" /></Field>
                    <Field label="Shop address" error={errors["address.line1"]} className="sm:col-span-2"><input className={inputCls} value={f.line1} onChange={set("line1")} autoComplete="address-line1" /></Field>
                    <Field label="Area / landmark (optional)" className="sm:col-span-2"><input className={inputCls} value={f.line2} onChange={set("line2")} autoComplete="address-line2" /></Field>
                    <Field label="City" error={errors["address.city"]}><input className={inputCls} value={f.city} onChange={set("city")} autoComplete="address-level2" /></Field>
                    <Field label="State" error={errors["address.state"]}><input className={inputCls} value={f.state} onChange={set("state")} autoComplete="address-level1" /></Field>
                    <Field label="Pincode" error={errors["address.pincode"]}><input className={inputCls} value={f.pincode} onChange={set("pincode")} inputMode="numeric" maxLength={6} autoComplete="postal-code" /></Field>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">Dealer terms</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700 list-disc pl-5">{terms(programme.claimWindowDays).map((t) => <li key={t}>{t}</li>)}</ul>
                    <p className="mt-2 text-xs text-slate-500">Terms version {programme.agreementVersion}</p>
                </div>
                <label className="flex items-start gap-3 text-sm text-slate-800">
                    <input type="checkbox" className="mt-1" checked={noWarranty} onChange={(e) => setNoWarranty(e.target.checked)} />
                    I understand laptops come without Lapshark warranty unless I add it, and that it covers me, not my customers.
                </label>
                {errors.noWarrantyAcknowledged && <p className="text-xs text-rose-600">{errors.noWarrantyAcknowledged}</p>}
                <label className="flex items-start gap-3 text-sm text-slate-800">
                    <input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                    I accept the dealer terms above.
                </label>
                {errors.agreement && <p className="text-xs text-rose-600">{errors.agreement}</p>}
                {error && <Banner tone="red">{error}</Banner>}
                <div className="flex justify-end"><Btn type="submit" loading={saving} disabled={!agree || !noWarranty}>Submit application</Btn></div>
            </form>
        </Card>
    );
}
