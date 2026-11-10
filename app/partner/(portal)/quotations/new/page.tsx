"use client";

// Quotation builder for Independent Sales Ambassadors (Phase 2).
// Every number shown here comes from the server's pricing preview
// (POST /partners/quotations/price); the browser never decides a price
// level or a commission. ?lead=<id> · ?product=<id> · ?revise=<quotationId>
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info, Minus, Plus, Search, Trash2 } from "lucide-react";
import { apiError, inr, Lead, partnerApi, PartnerProduct, PRICING_LEVEL_LABEL, Quotation, QuoteItem, QuoteLineInput } from "@/lib/partnerApi";
import { Banner, Btn, Card, Field, inputCls, Pill, Spinner } from "@/components/partner/ui";
import { usePartner } from "@/components/partner/PartnerContext";

type Line = { key: string; product: PartnerProduct; quantity: number; unitPrice: string; config: { ram?: string; storage?: string; warranty?: string }; touched: boolean };

const listedOf = (p: PartnerProduct, config: Line["config"]) => {
    let extra = 0;
    for (const k of ["ram", "storage", "warranty"] as const) {
        const o = p.configOptions?.[k]?.find((x) => x.value === config[k]);
        if (o) extra += o.price;
    }
    return p.sellingPrice + extra;
};
const defaultConfig = (p: PartnerProduct) => ({
    ram: p.configOptions?.ram?.[0]?.value,
    storage: p.configOptions?.storage?.[0]?.value,
    warranty: p.configOptions?.warranty?.[0]?.value,
});
const levelTone = (l: 1 | 2 | 3) => (l === 1 ? "slate" : l === 2 ? "teal" : "amber");
let seq = 0;

export default function NewQuotationPage() {
    const { profile } = usePartner();
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [reviseOf, setReviseOf] = useState<Quotation | null>(null);
    const [lead, setLead] = useState<Lead | null>(null);
    const [myLeads, setMyLeads] = useState<Lead[]>([]);
    const [customer, setCustomer] = useState({ name: "", phone: "", location: "", email: "" });
    const [consent, setConsent] = useState(false);
    const [lines, setLines] = useState<Line[]>([]);
    const [customerNote, setCustomerNote] = useState("");
    const [discountReason, setDiscountReason] = useState("");
    const [preview, setPreview] = useState<{ items: QuoteItem[]; totals: Quotation["totals"]; needsApproval: boolean } | null>(null);
    const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<PartnerProduct[] | null>(null);
    const catalogue = useRef<Map<string, PartnerProduct>>(new Map());

    const addProduct = useCallback((p: PartnerProduct, over: Partial<Line> = {}) => {
        const config = over.config || defaultConfig(p);
        setLines((ls) => (ls.length >= 10 ? ls : [...ls, { key: String(++seq), product: p, quantity: 1, config, unitPrice: String(listedOf(p, config)), touched: false, ...over }]));
        setSearch("");
        setResults(null);
    }, []);

    // Initial load: catalogue, own leads, and whatever the URL asks for.
    useEffect(() => {
        const sp = new URLSearchParams(window.location.search);
        (async () => {
            try {
                const [cat, ls] = await Promise.all([partnerApi.products({}), partnerApi.leads({})]);
                cat.products.forEach((p) => catalogue.current.set(p._id, p));
                setMyLeads(ls.leads.filter((l) => l.ownershipActive && l.status !== "won" && l.status !== "lost"));
                const revise = sp.get("revise");
                const leadId = sp.get("lead");
                const productId = sp.get("product");
                if (revise) {
                    const r = await partnerApi.quotation(revise);
                    setReviseOf(r.quotation);
                    setCustomerNote(r.quotation.customerNote || "");
                    setLines(
                        r.quotation.items.flatMap((i) => {
                            const p = catalogue.current.get(i.productId);
                            return p ? [{ key: String(++seq), product: p, quantity: Math.min(i.quantity, p.stock || i.quantity), config: i.config, unitPrice: String(i.quotedUnitPrice), touched: true }] : [];
                        })
                    );
                    if (r.quotation.items.some((i) => !catalogue.current.has(i.productId))) setMessage("A laptop from the earlier version is no longer in stock and was removed.");
                } else {
                    if (leadId) {
                        const l = await partnerApi.lead(leadId);
                        setLead(l.lead);
                    }
                    if (productId && catalogue.current.has(productId)) addProduct(catalogue.current.get(productId)!);
                }
            } catch (e) {
                setMessage(apiError(e).message);
            } finally {
                setReady(true);
            }
        })();
    }, [addProduct]);

    // Product search (server-side, same as the catalogue page).
    useEffect(() => {
        if (!search.trim()) return setResults(null);
        const t = setTimeout(() => {
            partnerApi.products({ q: search.trim() }).then((r) => {
                r.products.forEach((p) => catalogue.current.set(p._id, p));
                setResults(r.products.slice(0, 8));
            }).catch(() => setResults([]));
        }, 250);
        return () => clearTimeout(t);
    }, [search]);

    const payload: QuoteLineInput[] = useMemo(
        () => lines.map((l) => ({ productId: l.product._id, quantity: l.quantity, unitPrice: Number(l.unitPrice), config: l.config })),
        [lines]
    );

    // Live server pricing preview.
    useEffect(() => {
        if (!payload.length) {
            setPreview(null);
            setLineErrors({});
            return;
        }
        const t = setTimeout(() => {
            partnerApi
                .quotePreview(payload)
                .then((r) => { setPreview(r); setLineErrors({}); })
                .catch((e) => { setPreview(null); setLineErrors(apiError(e).errors); });
        }, 350);
        return () => clearTimeout(t);
    }, [payload]);

    const update = (key: string, patch: Partial<Line>) =>
        setLines((ls) =>
            ls.map((l) => {
                if (l.key !== key) return l;
                const next = { ...l, ...patch };
                // Changing an add-on moves the listed price; keep "at listed price" lines in step.
                if (patch.config && !l.touched) next.unitPrice = String(listedOf(l.product, next.config));
                return next;
            })
        );

    const submit = async () => {
        setSaving(true);
        setErrors({});
        setMessage("");
        try {
            const body: any = { items: payload, customerNote: customerNote || undefined, discountReason: preview?.needsApproval ? discountReason : undefined };
            let res: { quotation: Quotation };
            if (reviseOf) res = await partnerApi.reviseQuotation(reviseOf._id, body);
            else if (lead) res = await partnerApi.createQuotation({ ...body, leadId: lead._id });
            else res = await partnerApi.createQuotation({ ...body, customer, consent });
            router.push(`/partner/quotations/${res.quotation._id}`);
        } catch (e) {
            const er = apiError(e);
            setErrors(er.errors);
            setLineErrors(Object.fromEntries(Object.entries(er.errors).filter(([k]) => k.startsWith("items."))));
            setMessage(er.message);
            setSaving(false);
        }
    };

    if (profile.partnerType !== "independent") return <Banner tone="amber">Quotations are for Independent Sales Ambassadors.</Banner>;
    if (!ready) return <Spinner />;

    const customerLocked = !!reviseOf || !!lead;
    const shownCustomer = reviseOf?.customer || (lead ? { name: lead.customerName, phone: lead.phone, location: lead.location } : null);

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <Link href="/partner/quotations" className="text-slate-500 hover:text-slate-800" aria-label="Back to quotations"><ArrowLeft className="w-5 h-5" /></Link>
                <div>
                    <h1 className="text-xl font-medium text-slate-900">{reviseOf ? `Revise ${reviseOf.quoteNumber} (new version ${reviseOf.version + 1})` : "New quotation"}</h1>
                    <p className="text-sm text-slate-500">Prices are checked live against stock and your pricing limits. The customer pays Lapshark directly through a price-locked checkout link.</p>
                </div>
            </div>
            {message && <Banner tone="red">{message}</Banner>}

            <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-5 min-w-0">
                    {/* Customer */}
                    <Card>
                        <h2 className="font-medium text-slate-900">Customer</h2>
                        {customerLocked && shownCustomer ? (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                                <p><b>{shownCustomer.name}</b> · {shownCustomer.phone}{shownCustomer.location ? ` · ${shownCustomer.location}` : ""}</p>
                                {lead && !reviseOf && <button className="text-xs font-medium text-[#0f766e]" onClick={() => setLead(null)}>Change</button>}
                            </div>
                        ) : (
                            <div className="mt-3 space-y-3">
                                {myLeads.length > 0 && (
                                    <Field label="Pick one of your customers">
                                        <select className={inputCls} value="" onChange={(e) => setLead(myLeads.find((l) => l._id === e.target.value) || null)}>
                                            <option value="">Choose a lead…</option>
                                            {myLeads.map((l) => <option key={l._id} value={l._id}>{l.customerName} · {l.phone}</option>)}
                                        </select>
                                    </Field>
                                )}
                                <p className="text-xs font-medium text-slate-400">{myLeads.length ? "Or a new customer" : "New customer"}</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Field label="Name" error={errors["customer.name"]}><input className={inputCls} value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></Field>
                                    <Field label="Mobile" error={errors["customer.phone"]}><input className={inputCls} inputMode="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></Field>
                                    <Field label="Location (optional)"><input className={inputCls} value={customer.location} onChange={(e) => setCustomer({ ...customer, location: e.target.value })} /></Field>
                                    <Field label="Email (optional)" error={errors["customer.email"]}><input className={inputCls} type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></Field>
                                </div>
                                <label className="flex items-start gap-2 text-sm text-slate-700">
                                    <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                                    <span>The customer agreed to be contacted by me and Lapshark about this purchase.{errors.consent && <span className="block text-xs text-rose-600">{errors.consent}</span>}</span>
                                </label>
                                <p className="text-xs text-slate-500">They're added to your customers and registered to you for 30 days, unless another partner registered them first.</p>
                            </div>
                        )}
                    </Card>

                    {/* Lines */}
                    <Card>
                        <h2 className="font-medium text-slate-900">Laptops</h2>
                        <div className="relative mt-3">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input className={`${inputCls} pl-9`} placeholder="Search in-stock laptops to add" value={search} onChange={(e) => setSearch(e.target.value)} disabled={lines.length >= 10} />
                            {results && (
                                <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] max-h-72 overflow-y-auto">
                                    {results.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">No in-stock laptop matches.</p>}
                                    {results.map((p) => (
                                        <button key={p._id} onClick={() => addProduct(p)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50">
                                            <span className="truncate">{p.title}</span>
                                            <span className="shrink-0 font-medium">{inr(p.sellingPrice)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {lines.length === 0 && <p className="mt-4 text-sm text-slate-500">Add at least one laptop.</p>}
                        <div className="mt-4 space-y-4">
                            {lines.map((l, idx) => {
                                const pv = preview?.items[idx];
                                const err = lineErrors[`items.${idx}`];
                                const listed = pv?.listedUnitPrice ?? listedOf(l.product, l.config);
                                return (
                                    <div key={l.key} className={`rounded-lg border p-4 ${err ? "border-rose-300" : "border-slate-200"}`}>
                                        <div className="flex items-start gap-3">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={l.product.image} alt="" className="h-14 w-14 rounded object-contain bg-slate-50" />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-slate-900">{l.product.title}</p>
                                                <p className="text-xs text-slate-500">{l.product.condition} · listed {inr(listed)}{pv?.floorUnitPrice != null ? ` · your minimum ${inr(pv.floorUnitPrice)}` : pv ? " · no minimum set (any discount needs approval)" : ""}</p>
                                            </div>
                                            <button onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="text-slate-400 hover:text-rose-600" aria-label="Remove line"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                            {(["ram", "storage", "warranty"] as const).map((k) =>
                                                l.product.configOptions?.[k]?.length ? (
                                                    <Field key={k} label={k === "ram" ? "RAM" : k === "storage" ? "Storage" : "Warranty"}>
                                                        <select className={inputCls} value={l.config[k] || ""} onChange={(e) => update(l.key, { config: { ...l.config, [k]: e.target.value } })}>
                                                            {l.product.configOptions[k].map((o) => <option key={o.value} value={o.value}>{o.label}{o.price ? ` (+${inr(o.price)})` : ""}</option>)}
                                                        </select>
                                                    </Field>
                                                ) : null
                                            )}
                                        </div>
                                        <div className="mt-3 grid gap-3 sm:grid-cols-3 items-end">
                                            <Field label="Quantity">
                                                <div className="flex items-center gap-2">
                                                    <button className="rounded border border-slate-300 p-2 disabled:opacity-40" disabled={l.quantity <= 1} onClick={() => update(l.key, { quantity: l.quantity - 1 })} aria-label="Fewer"><Minus className="w-3 h-3" /></button>
                                                    <span className="w-6 text-center font-medium">{l.quantity}</span>
                                                    <button className="rounded border border-slate-300 p-2 disabled:opacity-40" disabled={l.quantity >= Math.min(5, l.product.stock || 5)} onClick={() => update(l.key, { quantity: l.quantity + 1 })} aria-label="More"><Plus className="w-3 h-3" /></button>
                                                </div>
                                            </Field>
                                            <Field label="Your price per laptop (₹)">
                                                <input className={inputCls} inputMode="numeric" value={l.unitPrice} onChange={(e) => update(l.key, { unitPrice: e.target.value.replace(/[^\d]/g, ""), touched: true })} />
                                            </Field>
                                            <div className="text-sm">
                                                {pv ? (
                                                    <div className="space-y-1">
                                                        <Pill tone={levelTone(pv.level)}>{PRICING_LEVEL_LABEL[pv.level]}</Pill>
                                                        <p className="text-slate-600">Est. commission <b className="text-slate-900">{inr(pv.estCommissionPerUnit * pv.quantity)}</b>{pv.level === 3 ? " (set by Lapshark on approval)" : ""}</p>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                        {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <Card>
                        <Field label="Note to the customer (optional, shown on the quotation)">
                            <textarea className={inputCls} rows={3} maxLength={1000} value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} placeholder="e.g. Price as discussed on our call. Includes free delivery in Bangalore." />
                        </Field>
                    </Card>
                </div>

                {/* Summary */}
                <div className="space-y-4 lg:sticky lg:top-4 self-start min-w-0">
                    <Card>
                        <h2 className="font-medium text-slate-900">Summary</h2>
                        {preview ? (
                            <dl className="mt-3 space-y-2 text-sm">
                                <div className="flex justify-between"><dt className="text-slate-500">Listed total</dt><dd>{inr(preview.totals.listed)}</dd></div>
                                <div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd className="text-emerald-700">−{inr(preview.totals.discount)}</dd></div>
                                <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>{preview.totals.shipping ? inr(preview.totals.shipping) : "Free"}</dd></div>
                                <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-medium"><dt>Customer pays</dt><dd>{inr(preview.totals.quoted + preview.totals.shipping)}</dd></div>
                                <div className="flex justify-between rounded-lg bg-[#0f766e]/[0.06] px-3 py-2 text-[#111827]"><dt>Your est. commission</dt><dd className="font-medium">{inr(preview.totals.estCommission)}</dd></div>
                            </dl>
                        ) : (
                            <p className="mt-3 text-sm text-slate-500">{lines.length ? "Checking prices…" : "Add a laptop to see the totals."}</p>
                        )}
                        <p className="mt-3 flex gap-2 text-xs text-slate-500"><Info className="w-4 h-4 shrink-0" />Commission is an estimate. It's fixed when the customer pays and earned after delivery and the return period.</p>
                    </Card>

                    {preview?.needsApproval && (
                        <Card className="border-amber-300 bg-amber-50">
                            <p className="text-sm text-amber-900"><b>Needs Lapshark approval.</b> One or more prices are below your minimum. The customer link is created once Lapshark approves, and Lapshark sets the commission for those laptops.</p>
                            <Field label="Why does this customer need this price?" error={errors.discountReason} className="mt-3">
                                <textarea className={inputCls} rows={3} maxLength={1000} value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} placeholder="e.g. Ordering 3 units for their office; has a competing offer at ₹22,000." />
                            </Field>
                        </Card>
                    )}

                    <Btn className="w-full" loading={saving} disabled={!preview || saving} onClick={submit}>
                        {preview?.needsApproval ? "Submit for approval" : reviseOf ? "Save new version" : "Create quotation"}
                    </Btn>
                    <p className="text-xs text-slate-500 text-center">Valid for 24 hours from {preview?.needsApproval ? "approval" : "now"}, subject to stock.</p>
                </div>
            </div>
        </div>
    );
}
