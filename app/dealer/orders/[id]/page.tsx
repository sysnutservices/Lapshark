"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiError } from "@/lib/partnerApi";
import { CLAIM_STATUS_LABEL, CLAIM_TYPE_LABEL, ClaimType, dealerApi, ORDER_STATUS_LABEL, orderTone, PAYMENT_LABEL, rs } from "@/lib/dealerApi";
import { Banner, Btn, Card, Field, fmtDate, fmtDateTime, inputCls, Modal, Pill, Spinner } from "@/components/partner/ui";

type Detail = Awaited<ReturnType<typeof dealerApi.order>>;

export default function DealerOrderPage() {
    const { id } = useParams<{ id: string }>();
    const [d, setD] = useState<Detail | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [claimOpen, setClaimOpen] = useState(false);

    const load = useCallback(() => {
        dealerApi.order(id).then(setD).catch((e) => setError(apiError(e).message));
    }, [id]);
    useEffect(load, [load]);

    if (error && !d) return <Banner tone="red">{error}</Banner>;
    if (!d) return <Spinner />;
    const { order: o, payment, units, claimWindowDays } = d;
    const warrantyBySerial = new Map(units.map((u) => [u.serial, u]));
    const claimDeadline = o.deliveredAt ? new Date(new Date(o.deliveredAt).getTime() + claimWindowDays * 864e5) : null;
    const claimable = o.status === "delivered" && units.length > 0;

    const cancel = async () => {
        setBusy(true);
        setError("");
        try {
            await dealerApi.cancel(o.id);
            load();
        } catch (e) {
            setError(apiError(e).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-5 max-w-4xl">
            <Link href="/dealer/orders" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> My orders</Link>
            <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-medium text-slate-900 font-mono">{o.orderNumber}</h1>
                <Pill tone={orderTone(o.status)}>{ORDER_STATUS_LABEL[o.status]}</Pill>
                <span className="text-sm text-slate-500">Placed {fmtDateTime(o.createdAt)}</span>
            </div>
            {error && <Banner tone="red">{error}</Banner>}

            {o.status === "placed" && (
                <Card className="space-y-3">
                    <h2 className="font-medium text-slate-900">Payment due: <span className="tabular-nums">{rs(o.duePaise)}</span></h2>
                    {o.paymentMethod === "bank_transfer" ? (
                        payment.bankTransfer ? <p className="whitespace-pre-line text-sm text-slate-700">{payment.bankTransfer}</p> : <p className="text-sm text-slate-600">Lapshark will share the bank details for this order with you.</p>
                    ) : (
                        <p className="text-sm text-slate-700">Pay in cash when you collect, or at Lapshark before dispatch. Keep the receipt Lapshark gives you.</p>
                    )}
                    <p className="text-sm text-slate-600">Quote <span className="font-mono">{o.orderNumber}</span> with your payment. Laptops are held for this order until it is paid or cancelled.</p>
                    {o.paidPaise === 0 && <Btn variant="secondary" onClick={cancel} loading={busy}>Cancel order</Btn>}
                </Card>
            )}
            {o.status === "cancelled" && <Banner tone="amber">Cancelled {fmtDate(o.cancelledAt)}{o.cancelReason ? `: ${o.cancelReason}` : ""}</Banner>}

            <Card className="p-0 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-500">
                        <tr className="border-b border-slate-200">
                            <th className="px-4 py-3 font-medium">Laptop</th>
                            <th className="px-4 py-3 font-medium text-right">Qty</th>
                            <th className="px-4 py-3 font-medium text-right">Price each</th>
                            <th className="px-4 py-3 font-medium">Warranty</th>
                            <th className="px-4 py-3 font-medium text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {o.lines.map((l) => (
                            <tr key={l.id} className="border-b border-slate-100 align-top">
                                <td className="px-4 py-3">
                                    <p className="text-slate-900">{l.title}</p>
                                    {l.serials.length > 0 && <p className="mt-1 font-mono text-xs text-slate-500">{l.serials.join(", ")}</p>}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">{l.quantity}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{rs(l.unitPricePaise + l.warrantyPricePaise)}</td>
                                <td className="px-4 py-3 text-slate-600">{l.warrantyMonths ? `${l.warrantyMonths} months, covers you` : "None"}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{rs(l.lineTotalPaise)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan={4} className="px-4 py-3 text-right font-medium text-slate-900">Total</td>
                            <td className="px-4 py-3 text-right font-medium tabular-nums">{rs(o.totalPaise)}</td>
                        </tr>
                    </tbody>
                </table>
            </Card>

            <div className="grid gap-5 md:grid-cols-2">
                <Card>
                    <h2 className="font-medium text-slate-900">Payment</h2>
                    <p className="mt-1 text-sm text-slate-600">{PAYMENT_LABEL[o.paymentMethod]} · paid {rs(o.paidPaise)} of {rs(o.totalPaise)}</p>
                    {o.payments.length > 0 && (
                        <ul className="mt-3 space-y-1 text-sm text-slate-700">
                            {o.payments.map((p) => <li key={p.id} className="tabular-nums">{fmtDate(p.receivedAt)} · {PAYMENT_LABEL[p.method]} · {rs(p.amountPaise)} · <span className="font-mono text-xs">{p.reference}</span></li>)}
                        </ul>
                    )}
                    {o.invoiceRef?.number && <p className="mt-3 text-sm text-slate-600">Invoice {o.invoiceRef.number}</p>}
                </Card>
                <Card>
                    <h2 className="font-medium text-slate-900">Delivery</h2>
                    {o.fulfilment.method === "pickup" ? (
                        <p className="mt-1 text-sm text-slate-600">Collect from Lapshark{o.fulfilment.handedTo ? ` · collected by ${o.fulfilment.handedTo}` : ""}</p>
                    ) : (
                        <p className="mt-1 text-sm text-slate-600">{[o.fulfilment.address?.line1, o.fulfilment.address?.line2, o.fulfilment.address?.city, o.fulfilment.address?.pincode].filter(Boolean).join(", ")}</p>
                    )}
                    {payment.pickup && o.fulfilment.method === "pickup" && o.status !== "delivered" && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{payment.pickup}</p>}
                    {o.fulfilment.awb && <p className="mt-2 text-sm text-slate-700">{o.fulfilment.courier} · <span className="font-mono">{o.fulfilment.awb}</span></p>}
                    {o.deliveredAt && <p className="mt-2 text-sm text-slate-600">Delivered {fmtDate(o.deliveredAt)}</p>}
                </Card>
            </div>

            {(claimable || o.claims.length > 0) && (
                <Card className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="font-medium text-slate-900">Problems with a laptop</h2>
                            {claimDeadline && (
                                <p className="mt-1 text-sm text-slate-600">
                                    Report transit damage or a laptop that doesn&apos;t match the order by {fmtDate(claimDeadline.toISOString())}. Laptops with added warranty can be reported until their warranty ends.
                                </p>
                            )}
                        </div>
                        {claimable && <Btn variant="secondary" onClick={() => setClaimOpen(true)}>Report a problem</Btn>}
                    </div>
                    {o.claims.length > 0 && (
                        <ul className="divide-y divide-slate-100 text-sm">
                            {o.claims.map((c) => (
                                <li key={c.id} className="py-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-xs text-slate-500">{c.serial}</span>
                                        <span className="text-slate-800">{CLAIM_TYPE_LABEL[c.type]}</span>
                                        <Pill tone={c.status === "open" ? "amber" : c.status === "rejected" ? "red" : "green"}>{CLAIM_STATUS_LABEL[c.status]}</Pill>
                                        <span className="text-xs text-slate-500">{fmtDate(c.createdAt)}</span>
                                    </div>
                                    <p className="mt-1 text-slate-600">{c.description}</p>
                                    {c.resolutionNote && <p className="mt-1 text-slate-700">Lapshark: {c.resolutionNote}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            )}

            <ClaimModal open={claimOpen} onClose={() => setClaimOpen(false)} orderId={o.id} serials={units.map((u) => ({ serial: u.serial, warranty: !!warrantyBySerial.get(u.serial)?.warrantyUntil }))} onDone={() => { setClaimOpen(false); load(); }} />
        </div>
    );
}

function ClaimModal({ open, onClose, orderId, serials, onDone }: { open: boolean; onClose: () => void; orderId: string; serials: { serial: string; warranty: boolean }[]; onDone: () => void }) {
    const [type, setType] = useState<ClaimType>("transit_damage");
    const [serial, setSerial] = useState("");
    const [description, setDescription] = useState("");
    const [evidenceUrl, setEvidenceUrl] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const submit = async () => {
        setSaving(true);
        setError("");
        try {
            await dealerApi.claim(orderId, { type, serial, description, evidenceUrl: evidenceUrl || undefined });
            setDescription("");
            setEvidenceUrl("");
            onDone();
        } catch (e) {
            setError(apiError(e).message);
        } finally {
            setSaving(false);
        }
    };
    return (
        <Modal open={open} onClose={onClose} title="Report a problem">
            <div className="space-y-4">
                <Field label="Laptop">
                    <select className={inputCls} value={serial} onChange={(e) => setSerial(e.target.value)}>
                        <option value="">Choose a serial number</option>
                        {serials.map((s) => <option key={s.serial} value={s.serial}>{s.serial}{s.warranty ? " (warranty)" : ""}</option>)}
                    </select>
                </Field>
                <Field label="Problem">
                    <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as ClaimType)}>
                        {(Object.keys(CLAIM_TYPE_LABEL) as ClaimType[]).map((t) => <option key={t} value={t}>{CLAIM_TYPE_LABEL[t]}</option>)}
                    </select>
                </Field>
                <Field label="What's wrong"><textarea className={inputCls} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} /></Field>
                <Field label="Link to photos or unboxing video (optional)"><input className={inputCls} value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://" /></Field>
                {error && <Banner tone="red">{error}</Banner>}
                <div className="flex justify-end gap-2">
                    <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                    <Btn onClick={submit} loading={saving} disabled={!serial}>Send</Btn>
                </div>
            </div>
        </Modal>
    );
}
