"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Search } from "lucide-react";
import { apiError } from "@/lib/partnerApi";
import { CatalogueProduct, dealerApi, PaymentMethod, rs } from "@/lib/dealerApi";
import { useDealer } from "@/components/dealer/DealerContext";
import { Banner, Btn, Card, Empty, Field, inputCls, Spinner } from "@/components/partner/ui";

const CASH_LIMIT_PAISE = 200000 * 100;

export default function DealerCataloguePage() {
    const { profile } = useDealer();
    const router = useRouter();
    const [products, setProducts] = useState<CatalogueProduct[] | null>(null);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");
    const [cart, setCart] = useState<Record<string, { qty: number; warranty: boolean }>>({});
    const [payment, setPayment] = useState<PaymentMethod>("bank_transfer");
    const [method, setMethod] = useState<"courier" | "pickup">("courier");
    const [addr, setAddr] = useState({ ...profile.address, line2: profile.address.line2 || "" });
    const [note, setNote] = useState("");
    const [placing, setPlacing] = useState(false);
    const [orderError, setOrderError] = useState("");

    useEffect(() => {
        dealerApi.catalogue().then((r) => setProducts(r.products)).catch((e) => setError(apiError(e).message));
    }, []);

    const byId = useMemo(() => new Map((products || []).map((p) => [p.productId, p])), [products]);
    const lines = Object.entries(cart)
        .filter(([, c]) => c.qty > 0)
        .map(([id, c]) => ({ p: byId.get(id)!, ...c }))
        .filter((l) => l.p);
    const total = lines.reduce((s, l) => s + (l.p.pricePaise + (l.warranty && l.p.warranty ? l.p.warranty.pricePaise : 0)) * l.qty, 0);
    const units = lines.reduce((s, l) => s + l.qty, 0);
    const cashBlocked = total >= CASH_LIMIT_PAISE;
    const payWith: PaymentMethod = cashBlocked ? "bank_transfer" : payment;

    const setQty = (p: CatalogueProduct, qty: number) => setCart((c) => ({ ...c, [p.productId]: { qty: Math.max(0, Math.min(p.stock, qty)), warranty: c[p.productId]?.warranty || false } }));
    const toggleWarranty = (p: CatalogueProduct) => setCart((c) => ({ ...c, [p.productId]: { qty: c[p.productId]?.qty || 0, warranty: !c[p.productId]?.warranty } }));

    const place = async () => {
        setPlacing(true);
        setOrderError("");
        try {
            const r = await dealerApi.placeOrder({
                items: lines.map((l) => ({ productId: l.p.productId, quantity: l.qty, withWarranty: l.warranty && !!l.p.warranty })),
                paymentMethod: payWith,
                fulfilment: method === "pickup" ? { method } : { method, address: { ...addr, line2: addr.line2 || undefined } },
                note: note || undefined,
            });
            router.push(`/dealer/orders/${r.order.id}`);
        } catch (e) {
            setOrderError(apiError(e).message);
            dealerApi.catalogue().then((r) => setProducts(r.products)).catch(() => undefined);
        } finally {
            setPlacing(false);
        }
    };

    if (error) return <Banner tone="red">{error}</Banner>;
    if (!products) return <Spinner />;
    const shown = products.filter((p) => !q || `${p.title} ${p.brand || ""}`.toLowerCase().includes(q.toLowerCase()));

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-medium text-slate-900">Laptops at dealer prices</h1>
                    <label className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={1.5} />
                        <input className={`${inputCls} pl-9`} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
                    </label>
                </div>
                <Banner>Laptops come without Lapshark warranty unless you add it below. Added warranty covers you, the dealer.</Banner>
                {shown.length === 0 ? (
                    <Empty title={products.length ? "No laptops match" : "No laptops available right now"} text={products.length ? undefined : "Check back soon, stock changes daily."} />
                ) : (
                    <div className="space-y-3">
                        {shown.map((p) => {
                            const c = cart[p.productId];
                            const specs = Object.entries(p.specs || {}).slice(0, 4).map(([, v]) => v).filter(Boolean).join(" · ");
                            return (
                                <Card key={p.productId} className="flex flex-col sm:flex-row gap-4 sm:items-center">
                                    {p.image && <img src={p.image} alt="" className="h-20 w-28 rounded-lg object-contain bg-slate-50 shrink-0" />}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-slate-900">{p.title}</p>
                                        <p className="mt-0.5 text-xs text-slate-500">{[p.condition, specs].filter(Boolean).join(" · ")}</p>
                                        <p className="mt-1 text-xs text-slate-500 tabular-nums">{p.stock} in stock · retail {rs(p.listedPricePaise)}</p>
                                        {p.warranty && (
                                            <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                                                <input type="checkbox" checked={!!c?.warranty} onChange={() => toggleWarranty(p)} />
                                                Add {p.warranty.months}-month warranty {p.warranty.pricePaise ? `(+${rs(p.warranty.pricePaise)} each)` : "(free)"}
                                            </label>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                                        <p className="text-lg font-medium text-slate-900 tabular-nums">{rs(p.pricePaise)}</p>
                                        <div className="flex items-center gap-1">
                                            <button aria-label="Fewer" onClick={() => setQty(p, (c?.qty || 0) - 1)} className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50"><Minus className="h-4 w-4" strokeWidth={1.5} /></button>
                                            <input aria-label={`Quantity of ${p.title}`} className="w-12 rounded-md border border-slate-300 py-1 text-center text-sm tabular-nums" value={c?.qty || 0} inputMode="numeric" onChange={(e) => setQty(p, parseInt(e.target.value || "0", 10) || 0)} />
                                            <button aria-label="More" onClick={() => setQty(p, (c?.qty || 0) + 1)} disabled={(c?.qty || 0) >= p.stock} className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><Plus className="h-4 w-4" strokeWidth={1.5} /></button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <Card className="lg:sticky lg:top-24 space-y-4">
                <h2 className="font-medium text-slate-900">Your order</h2>
                {lines.length === 0 ? (
                    <p className="text-sm text-slate-500">Add laptops to start an order.</p>
                ) : (
                    <>
                        <ul className="space-y-2 text-sm">
                            {lines.map((l) => (
                                <li key={l.p.productId} className="flex justify-between gap-3">
                                    <span className="text-slate-700">{l.qty} × {l.p.title}{l.warranty && l.p.warranty ? ` + ${l.p.warranty.months}m warranty` : ""}</span>
                                    <span className="tabular-nums text-slate-900">{rs((l.p.pricePaise + (l.warranty && l.p.warranty ? l.p.warranty.pricePaise : 0)) * l.qty)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex justify-between border-t border-slate-200 pt-3 font-medium text-slate-900">
                            <span>Total · {units} laptop{units > 1 ? "s" : ""}</span>
                            <span className="tabular-nums">{rs(total)}</span>
                        </div>

                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium text-slate-700">Payment</legend>
                            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="radio" checked={payWith === "bank_transfer"} onChange={() => setPayment("bank_transfer")} /> Bank transfer</label>
                            <label className={`flex items-center gap-2 text-sm ${cashBlocked ? "text-slate-400" : "text-slate-700"}`}><input type="radio" disabled={cashBlocked} checked={payWith === "cash"} onChange={() => setPayment("cash")} /> Cash</label>
                            {cashBlocked && <p className="text-xs text-slate-500">Cash isn&apos;t accepted for orders of ₹2,00,000 or more.</p>}
                        </fieldset>

                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium text-slate-700">Delivery</legend>
                            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="radio" checked={method === "courier"} onChange={() => setMethod("courier")} /> Courier to my address</label>
                            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="radio" checked={method === "pickup"} onChange={() => setMethod("pickup")} /> I&apos;ll collect from Lapshark</label>
                        </fieldset>
                        {method === "courier" && (
                            <div className="grid gap-2">
                                <input className={inputCls} aria-label="Address" placeholder="Address" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} />
                                <input className={inputCls} aria-label="Area or landmark" placeholder="Area / landmark" value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} />
                                <div className="grid grid-cols-3 gap-2">
                                    <input className={inputCls} aria-label="City" placeholder="City" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
                                    <input className={inputCls} aria-label="State" placeholder="State" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} />
                                    <input className={inputCls} aria-label="Pincode" placeholder="Pincode" value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value })} />
                                </div>
                            </div>
                        )}
                        <Field label="Note for Lapshark (optional)"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></Field>
                        {orderError && <Banner tone="red">{orderError}</Banner>}
                        <Btn className="w-full" onClick={place} loading={placing}>Place order</Btn>
                        <p className="text-xs text-slate-500">Laptops are held for you once you place the order. They&apos;re dispatched or handed over after payment.</p>
                    </>
                )}
            </Card>
        </div>
    );
}
