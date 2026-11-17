"use client";

// Dealer channel admin (distribution/docs/13-dealer-channel.md). Staff-role
// permissions are enforced by the API; a 403 shows as an inline error.
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Banknote, Boxes, ClipboardList, PackageCheck, Store, Truck, UserPlus } from "lucide-react";
import { apiError } from "@/lib/partnerApi";
import {
    BUSINESS_TYPE_LABEL,
    CLAIM_STATUS_LABEL,
    CLAIM_TYPE_LABEL,
    ClaimStatus,
    DEALER_STATUS_LABEL,
    dealerAdminApi as A,
    DealerEnquiry,
    DealerEnquiryStatus,
    DealerOrder,
    DealerOrderStatus,
    DealerProfile,
    DealerVetting,
    ENQUIRY_STATUS_LABEL,
    MONTHLY_VOLUME_LABEL,
    ORDER_STATUS_LABEL,
    orderTone,
    PAYMENT_LABEL,
    PaymentMethod,
    rs,
    rupeesInputToPaise,
    YEARS_IN_BUSINESS_LABEL,
} from "@/lib/dealerApi";
import { Banner, Btn, Card, Empty, Field, fmtDate, fmtDateTime, inputCls, Modal, Pill, Spinner, Stat } from "@/components/partner/ui";

const TABS = ["Overview", "Dealers", "Enquiries", "Orders", "Prices", "Serial lookup", "Settings"] as const;
type Tab = (typeof TABS)[number];

export default function DealersAdminPage() {
    const [tab, setTab] = useState<Tab>("Overview");
    const [orderFilter, setOrderFilter] = useState("");
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dealers</h1>
                <p className="text-sm text-gray-500">Trade buyers: applications, dealer prices, orders paid by bank transfer or cash, serials and claims.</p>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
                {TABS.map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}>{t}</button>
                ))}
            </div>
            {tab === "Overview" && <OverviewTab go={(t, f) => { setOrderFilter(f || ""); setTab(t); }} />}
            {tab === "Dealers" && <DealersTab />}
            {tab === "Enquiries" && <EnquiriesTab />}
            {tab === "Orders" && <OrdersTab initial={orderFilter} />}
            {tab === "Prices" && <PricesTab />}
            {tab === "Serial lookup" && <SerialTab />}
            {tab === "Settings" && <SettingsTab />}
        </div>
    );
}

function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const load = useCallback(() => { setError(""); fn().then(setData).catch((e) => setError(apiError(e).message)); }, deps);
    useEffect(load, [load]);
    return { data, error, load };
}

// ---------------------------------------------------------------- Overview
function OverviewTab({ go }: { go: (t: Tab, filter?: string) => void }) {
    const { data, error } = useLoad<any>(() => Promise.all([A.get("/admin/dealers/overview"), A.get("/admin/dealer-settings")]).then(([o, s]) => ({ ...o, settings: s.settings })), []);
    if (error) return <Banner tone="red">{error}</Banner>;
    if (!data) return <Spinner />;
    const o = data.orders;
    return (
        <div className="space-y-4">
            {!data.settings.enabled && <Banner tone="amber">Dealer ordering is <b>off</b>. Set dealer prices first, then turn it on under Settings.</Banner>}
            {data.settings.enabled && !data.settings.bankTransferInstructions && <Banner tone="amber">Dealers paying by bank transfer see no bank details yet. Add them under Settings.</Banner>}
            {data.dealers.applied > 0 && <Banner>{data.dealers.applied} dealer application(s) waiting for review. <button className="underline font-semibold" onClick={() => go("Dealers")}>Review</button></Banner>}
            {data.enquiries?.new > 0 && <Banner>{data.enquiries.new} new dealer {data.enquiries.new === 1 ? "enquiry" : "enquiries"} from lapshark.com/dealers to call back. <button className="underline font-semibold" onClick={() => go("Enquiries")}>View</button></Banner>}
            {data.openClaims > 0 && <Banner tone="amber">{data.openClaims} open dealer claim(s). <button className="underline font-semibold" onClick={() => go("Orders", "open_claims")}>Review</button></Banner>}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Stat label="Applications to review" value={data.dealers.applied} icon={UserPlus} tone="blue" />
                <Stat label="Approved dealers" value={data.dealers.approved} icon={Store} tone="teal" />
                <Stat label={`Awaiting payment · ${rs(o.placed.totalPaise)}`} value={o.placed.count} icon={Banknote} tone="amber" />
                <Stat label="Paid, to pack" value={o.paid.count} icon={Boxes} tone="navy" />
                <Stat label="Packed, to dispatch" value={o.packed.count} icon={PackageCheck} tone="navy" />
                <Stat label="In transit" value={o.dispatched.count} icon={Truck} tone="slate" />
                <Stat label="Delivered value" value={rs(o.delivered.totalPaise)} icon={ClipboardList} tone="teal" />
                <Stat label="Open claims" value={data.openClaims} icon={AlertTriangle} tone="amber" />
            </div>
            <div className="flex flex-wrap gap-2">
                {(["placed", "paid", "packed", "dispatched"] as DealerOrderStatus[]).map((s) => (
                    <Btn key={s} variant="secondary" onClick={() => go("Orders", s)}>{ORDER_STATUS_LABEL[s]} ({o[s].count})</Btn>
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- Dealers
type AdminDealer = DealerProfile & { statusHistory: { status: string; at: string; reason?: string }[]; flags: { type: string; detail?: string; at: string }[]; notes: string; vetting: DealerVetting | null };

function DealersTab() {
    const [status, setStatus] = useState("");
    const [q, setQ] = useState("");
    const [open, setOpen] = useState<string | null>(null);
    const { data, error, load } = useLoad<{ dealers: AdminDealer[] }>(() => A.get("/admin/dealers", { status, q }), [status, q]);
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All statuses</option>
                    {Object.entries(DEALER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input className={`${inputCls} w-64`} placeholder="Search name, code, mobile, city" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {error && <Banner tone="red">{error}</Banner>}
            {!data ? <Spinner /> : data.dealers.length === 0 ? <Empty title="No dealers" /> : (
                <Card className="p-0 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-gray-500"><tr className="border-b">
                            <th className="px-4 py-3">Dealer</th><th className="px-4 py-3">Business</th><th className="px-4 py-3">Mobile</th><th className="px-4 py-3">City</th><th className="px-4 py-3">GSTIN / PAN</th><th className="px-4 py-3">Applied</th><th className="px-4 py-3">Status</th>
                        </tr></thead>
                        <tbody>
                            {data.dealers.map((d) => (
                                <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => setOpen(d.id)}>
                                    <td className="px-4 py-3 font-mono">{d.dealerCode}</td>
                                    <td className="px-4 py-3">{d.businessName}<div className="text-xs text-gray-500">{d.contactName}</div></td>
                                    <td className="px-4 py-3">{d.phone}</td>
                                    <td className="px-4 py-3">{d.address.city}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{d.gstinMasked || d.panMasked}</td>
                                    <td className="px-4 py-3">{fmtDate(d.createdAt)}</td>
                                    <td className="px-4 py-3"><Pill tone={d.status === "approved" ? "green" : d.status === "applied" ? "blue" : d.status === "suspended" ? "amber" : "red"}>{DEALER_STATUS_LABEL[d.status]}</Pill> {d.flags.length > 0 && <AlertTriangle className="inline h-4 w-4 text-amber-500" />}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
            {open && <DealerModal id={open} onClose={() => { setOpen(null); load(); }} />}
        </div>
    );
}

function DealerModal({ id, onClose }: { id: string; onClose: () => void }) {
    const { data, error, load } = useLoad<{ dealer: AdminDealer; orders: DealerOrder[] }>(() => A.get(`/admin/dealers/${id}`), [id]);
    const [msg, setMsg] = useState("");
    const [reason, setReason] = useState("");
    const [revealed, setRevealed] = useState<{ gstin: string | null; pan: string | null } | null>(null);
    const [notes, setNotes] = useState<string | null>(null);
    const act = async (fn: () => Promise<any>) => {
        setMsg("");
        try { await fn(); load(); } catch (e) { setMsg(apiError(e).message); }
    };
    const d = data?.dealer;
    return (
        <Modal open onClose={onClose} title={d ? `${d.businessName} · ${d.dealerCode}` : "Dealer"} wide>
            {error ? <Banner tone="red">{error}</Banner> : !d ? <Spinner /> : (
                <div className="space-y-4 text-sm">
                    {d.flags.map((f, i) => <Banner key={i} tone="amber">{f.detail || f.type}</Banner>)}
                    <div className="grid gap-2 sm:grid-cols-2">
                        <p><span className="text-gray-500">Status</span> {DEALER_STATUS_LABEL[d.status]}</p>
                        <p><span className="text-gray-500">Contact</span> {d.contactName} · {d.phone}{d.email ? ` · ${d.email}` : ""}</p>
                        <p className="sm:col-span-2"><span className="text-gray-500">Address</span> {[d.address.line1, d.address.line2, d.address.city, d.address.state, d.address.pincode].filter(Boolean).join(", ")}</p>
                        <p><span className="text-gray-500">GSTIN</span> <span className="font-mono">{revealed ? revealed.gstin || "—" : d.gstinMasked || "—"}</span></p>
                        <p><span className="text-gray-500">PAN</span> <span className="font-mono">{revealed ? revealed.pan || "—" : d.panMasked || "—"}</span></p>
                        <p><span className="text-gray-500">Terms</span> {d.agreementVersion}</p>
                        {d.vetting && (
                            <>
                                <p><span className="text-gray-500">Business</span> {BUSINESS_TYPE_LABEL[d.vetting.businessType] ?? d.vetting.businessType}</p>
                                <p><span className="text-gray-500">In business</span> {YEARS_IN_BUSINESS_LABEL[d.vetting.yearsInBusiness] ?? d.vetting.yearsInBusiness}</p>
                                <p><span className="text-gray-500">Expects to buy</span> {MONTHLY_VOLUME_LABEL[d.vetting.monthlyVolume] ?? d.vetting.monthlyVolume} a month</p>
                                {d.vetting.interests && <p className="sm:col-span-2"><span className="text-gray-500">Wants</span> {d.vetting.interests}</p>}
                            </>
                        )}
                    </div>
                    {!revealed && <Btn variant="ghost" onClick={() => act(async () => setRevealed(await A.post(`/admin/dealers/${id}/reveal`)))}>Show full GSTIN / PAN (logged)</Btn>}
                    <Field label="Reason (needed to reject or suspend)"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                    <div className="flex flex-wrap gap-2">
                        {(d.status === "applied" || d.status === "rejected") && <Btn onClick={() => act(() => A.patch(`/admin/dealers/${id}/approve`, { reason }))}>Approve</Btn>}
                        {d.status === "applied" && <Btn variant="danger" onClick={() => act(() => A.patch(`/admin/dealers/${id}/reject`, { reason }))}>Reject</Btn>}
                        {d.status === "approved" && <Btn variant="danger" onClick={() => act(() => A.patch(`/admin/dealers/${id}/suspend`, { reason }))}>Suspend</Btn>}
                        {d.status === "suspended" && <Btn onClick={() => act(() => A.patch(`/admin/dealers/${id}/reactivate`))}>Reactivate</Btn>}
                    </div>
                    <Field label="Internal notes"><textarea className={inputCls} rows={2} value={notes ?? d.notes} onChange={(e) => setNotes(e.target.value)} /></Field>
                    {notes !== null && <Btn variant="secondary" onClick={() => act(async () => { await A.patch(`/admin/dealers/${id}/notes`, { notes }); setNotes(null); })}>Save notes</Btn>}
                    {msg && <Banner tone="red">{msg}</Banner>}
                    <div>
                        <p className="font-medium text-gray-900">History</p>
                        <ul className="mt-1 text-gray-600">{d.statusHistory.map((h, i) => <li key={i}>{fmtDateTime(h.at)} · {h.status}{h.reason ? ` · ${h.reason}` : ""}</li>)}</ul>
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">Orders</p>
                        {data!.orders.length === 0 ? <p className="text-gray-500">None yet</p> : (
                            <ul className="mt-1 text-gray-700">{data!.orders.map((o) => <li key={o.id} className="tabular-nums"><span className="font-mono">{o.orderNumber}</span> · {fmtDate(o.createdAt)} · {rs(o.totalPaise)} · {ORDER_STATUS_LABEL[o.status]}</li>)}</ul>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
}

// ---------------------------------------------------------------- Enquiries
// Interest left on the public /dealers page while registration is closed.
// Not applications: no GSTIN/PAN, mobile not verified. Call them back.
function EnquiriesTab() {
    const [status, setStatus] = useState<DealerEnquiryStatus | "">("new");
    const [q, setQ] = useState("");
    const [msg, setMsg] = useState("");
    const { data, error, load } = useLoad<{ enquiries: DealerEnquiry[] }>(() => A.get("/admin/dealer-enquiries", { status, q }), [status, q]);
    const setTo = async (id: string, to: DealerEnquiryStatus) => {
        setMsg("");
        try { await A.patch(`/admin/dealer-enquiries/${id}/status`, { status: to }); load(); } catch (e) { setMsg(apiError(e).message); }
    };
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value as DealerEnquiryStatus | "")}>
                    <option value="">All</option>
                    {Object.entries(ENQUIRY_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input className={`${inputCls} w-64`} placeholder="Search business, name, mobile, city" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <p className="text-sm text-gray-500">Left on lapshark.com/dealers while registration is closed. The mobile number isn&apos;t verified. Once registration is open, ask them to apply on the same page.</p>
            {(error || msg) && <Banner tone="red">{error || msg}</Banner>}
            {!data ? <Spinner /> : data.enquiries.length === 0 ? <Empty title="No enquiries" /> : (
                <Card className="p-0 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-gray-500"><tr className="border-b">
                            <th className="px-4 py-3">Received</th><th className="px-4 py-3">Business</th><th className="px-4 py-3">Mobile</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Per month</th><th className="px-4 py-3">Status</th>
                        </tr></thead>
                        <tbody>
                            {data.enquiries.map((e) => (
                                <tr key={e.id} className="border-b last:border-0 align-top">
                                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(e.createdAt)}{e.source?.utmSource && <div className="text-xs text-gray-500">{e.source.utmSource}</div>}</td>
                                    <td className="px-4 py-3">{e.businessName}<div className="text-xs text-gray-500">{e.contactName}</div>{e.message && <div className="mt-1 max-w-xs text-xs text-gray-600">{e.message}</div>}</td>
                                    <td className="px-4 py-3 whitespace-nowrap"><a className="text-blue-700 underline" href={`tel:+91${e.phone}`}>{e.phone}</a></td>
                                    <td className="px-4 py-3">{e.city}</td>
                                    <td className="px-4 py-3">{BUSINESS_TYPE_LABEL[e.businessType] ?? e.businessType}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{MONTHLY_VOLUME_LABEL[e.monthlyVolume] ?? e.monthlyVolume}</td>
                                    <td className="px-4 py-3">
                                        <select className={`${inputCls} w-auto py-1`} value={e.status} onChange={(ev) => setTo(e.id, ev.target.value as DealerEnquiryStatus)}>
                                            {Object.entries(ENQUIRY_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
}

// ---------------------------------------------------------------- Orders
function OrdersTab({ initial }: { initial: string }) {
    const [status, setStatus] = useState(initial);
    const [open, setOpen] = useState<string | null>(null);
    const { data, error, load } = useLoad<{ orders: DealerOrder[] }>(() => A.get("/admin/dealer-orders", { status }), [status]);
    return (
        <div className="space-y-4">
            <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All orders</option>
                {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                <option value="open_claims">With open claims</option>
            </select>
            {error && <Banner tone="red">{error}</Banner>}
            {!data ? <Spinner /> : data.orders.length === 0 ? <Empty title="No orders" /> : (
                <Card className="p-0 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-gray-500"><tr className="border-b">
                            <th className="px-4 py-3">Order</th><th className="px-4 py-3">Dealer</th><th className="px-4 py-3">Placed</th><th className="px-4 py-3 text-right">Laptops</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Due</th><th className="px-4 py-3">Pay by</th><th className="px-4 py-3">Delivery</th><th className="px-4 py-3">Status</th>
                        </tr></thead>
                        <tbody>
                            {data.orders.map((o) => (
                                <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => setOpen(o.id)}>
                                    <td className="px-4 py-3 font-mono">{o.orderNumber}</td>
                                    <td className="px-4 py-3">{o.businessName}<div className="text-xs text-gray-500 font-mono">{o.dealerCode}</div></td>
                                    <td className="px-4 py-3">{fmtDateTime(o.createdAt)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{o.lines.reduce((s, l) => s + l.quantity, 0)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{rs(o.totalPaise)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{o.status === "cancelled" ? "—" : rs(o.duePaise)}</td>
                                    <td className="px-4 py-3">{PAYMENT_LABEL[o.paymentMethod]}</td>
                                    <td className="px-4 py-3">{o.fulfilment.method === "pickup" ? "Pickup" : "Courier"}</td>
                                    <td className="px-4 py-3"><Pill tone={orderTone(o.status)}>{ORDER_STATUS_LABEL[o.status]}</Pill>{o.claims.some((c) => c.status === "open") && <AlertTriangle className="inline ml-1 h-4 w-4 text-amber-500" />}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
            {open && <OrderModal id={open} onClose={() => { setOpen(null); load(); }} />}
        </div>
    );
}

function OrderModal({ id, onClose }: { id: string; onClose: () => void }) {
    const { data, error, load } = useLoad<{ order: DealerOrder }>(() => A.get(`/admin/dealer-orders/${id}`), [id]);
    const [msg, setMsg] = useState("");
    const [busy, setBusy] = useState(false);
    const run = async (fn: () => Promise<any>) => {
        setMsg("");
        setBusy(true);
        try { await fn(); load(); } catch (e) { setMsg(apiError(e).message); } finally { setBusy(false); }
    };
    const o = data?.order;
    return (
        <Modal open onClose={onClose} title={o ? `${o.orderNumber} · ${o.businessName}` : "Order"} wide>
            {error ? <Banner tone="red">{error}</Banner> : !o ? <Spinner /> : (
                <div className="space-y-5 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={orderTone(o.status)}>{ORDER_STATUS_LABEL[o.status]}</Pill>
                        <span className="text-gray-600">Total {rs(o.totalPaise)} · paid {rs(o.paidPaise)} · due {rs(o.duePaise)}</span>
                        <span className="text-gray-600">· {PAYMENT_LABEL[o.paymentMethod]} · {o.fulfilment.method === "pickup" ? "Pickup" : "Courier"}</span>
                    </div>
                    {o.dealerNote && <Banner>Dealer note: {o.dealerNote}</Banner>}
                    <table className="min-w-full">
                        <thead className="text-left text-gray-500"><tr className="border-b"><th className="py-2">Laptop</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Each</th><th className="py-2">Warranty</th><th className="py-2 text-right">Total</th></tr></thead>
                        <tbody>{o.lines.map((l) => (
                            <tr key={l.id} className="border-b align-top">
                                <td className="py-2">{l.title}{l.serials.length > 0 && <div className="font-mono text-xs text-gray-500">{l.serials.join(", ")}</div>}</td>
                                <td className="py-2 text-right tabular-nums">{l.quantity}</td>
                                <td className="py-2 text-right tabular-nums">{rs(l.unitPricePaise)}{l.warrantyPricePaise ? ` + ${rs(l.warrantyPricePaise)}` : ""}</td>
                                <td className="py-2">{l.warrantyMonths ? `${l.warrantyMonths} months (dealer)` : "None"}</td>
                                <td className="py-2 text-right tabular-nums">{rs(l.lineTotalPaise)}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                    {o.fulfilment.method === "courier" && o.fulfilment.address && <p className="text-gray-600">Ship to: {[o.fulfilment.address.line1, o.fulfilment.address.line2, o.fulfilment.address.city, o.fulfilment.address.state, o.fulfilment.address.pincode].filter(Boolean).join(", ")}</p>}

                    {o.payments.length > 0 && (
                        <div>
                            <p className="font-medium text-gray-900">Payments</p>
                            <ul className="text-gray-700">{o.payments.map((p) => <li key={p.id} className="tabular-nums">{fmtDate(p.receivedAt)} · {PAYMENT_LABEL[p.method]} · {rs(p.amountPaise)} · <span className="font-mono">{p.reference}</span>{p.note ? ` · ${p.note}` : ""}</li>)}</ul>
                        </div>
                    )}

                    {o.status === "placed" && <PaymentForm order={o} busy={busy} onSubmit={(b) => run(() => A.post(`/admin/dealer-orders/${o.id}/payments`, b))} />}
                    {o.status === "paid" && <SerialsForm order={o} busy={busy} onSubmit={(lines) => run(() => A.post(`/admin/dealer-orders/${o.id}/serials`, { lines }))} />}
                    {o.status === "packed" && <DispatchForm order={o} busy={busy} onSubmit={(b) => run(() => A.post(`/admin/dealer-orders/${o.id}/dispatch`, b))} />}
                    {o.status === "dispatched" && (
                        <Card className="space-y-2">
                            <p className="text-gray-700">{o.fulfilment.courier} · <span className="font-mono">{o.fulfilment.awb}</span> · dispatched {fmtDate(o.dispatchedAt)}</p>
                            <Btn loading={busy} onClick={() => run(() => A.post(`/admin/dealer-orders/${o.id}/delivered`))}>Mark delivered</Btn>
                        </Card>
                    )}

                    {o.claims.length > 0 && (
                        <div className="space-y-2">
                            <p className="font-medium text-gray-900">Claims</p>
                            {o.claims.map((c) => <ClaimRow key={c.id} claim={c} busy={busy} onDecide={(status, resolutionNote) => run(() => A.post(`/admin/dealer-orders/${o.id}/claims/${c.id}/decide`, { status, resolutionNote }))} />)}
                        </div>
                    )}

                    <InvoiceRef order={o} busy={busy} onSubmit={(b) => run(() => A.post(`/admin/dealer-orders/${o.id}/invoice-ref`, b))} />
                    {["placed", "paid", "packed"].includes(o.status) && <CancelForm order={o} busy={busy} onSubmit={(b) => run(() => A.post(`/admin/dealer-orders/${o.id}/cancel`, b))} />}
                    {o.status === "cancelled" && <Banner tone="amber">Cancelled {fmtDate(o.cancelledAt)}: {o.cancelReason}{o.refundNote ? ` · Refund: ${o.refundNote}` : ""}</Banner>}

                    {msg && <Banner tone="red">{msg}</Banner>}
                    <div>
                        <p className="font-medium text-gray-900">History</p>
                        <ul className="text-gray-600">{o.statusHistory.map((h, i) => <li key={i}>{fmtDateTime(h.at)} · {ORDER_STATUS_LABEL[h.status]}{h.note ? ` · ${h.note}` : ""}</li>)}</ul>
                    </div>
                </div>
            )}
        </Modal>
    );
}

function PaymentForm({ order, busy, onSubmit }: { order: DealerOrder; busy: boolean; onSubmit: (b: unknown) => void }) {
    const [method, setMethod] = useState<PaymentMethod>(order.paymentMethod);
    const [amount, setAmount] = useState(String(order.duePaise / 100));
    const [reference, setReference] = useState("");
    const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState("");
    const paise = rupeesInputToPaise(amount);
    return (
        <Card className="space-y-3">
            <p className="font-medium text-gray-900">Record payment received</p>
            <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Method">
                    <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                        <option value="bank_transfer">Bank transfer</option>
                        <option value="cash">Cash</option>
                    </select>
                </Field>
                <Field label="Amount (₹)" error={amount && Number.isNaN(paise) ? "Enter an amount" : undefined}><input className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" /></Field>
                <Field label={method === "cash" ? "Cash receipt number" : "UTR / bank reference"}><input className={inputCls} value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
                <Field label="Received on"><input type="date" className={inputCls} value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} /></Field>
                <Field label="Note (optional)" className="sm:col-span-2"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            </div>
            {method === "cash" && <p className="text-xs text-gray-500">Cash is refused if the order is ₹2,00,000 or more, or if this dealer&apos;s cash for the day would reach ₹2,00,000.</p>}
            <Btn loading={busy} disabled={Number.isNaN(paise) || !reference} onClick={() => onSubmit({ method, amountPaise: paise, reference, receivedAt: receivedDate(receivedAt), note: note || undefined })}>Record payment</Btn>
        </Card>
    );
}

// A date picked today means "now"; an earlier date means midday IST that day.
function receivedDate(day: string) {
    const today = new Date().toISOString().slice(0, 10);
    return day === today ? new Date().toISOString() : new Date(`${day}T12:00:00+05:30`).toISOString();
}

function SerialsForm({ order, busy, onSubmit }: { order: DealerOrder; busy: boolean; onSubmit: (lines: { lineId: string; serials: string[] }[]) => void }) {
    const [text, setText] = useState<Record<string, string>>({});
    const parse = (s: string) => s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);
    const ready = order.lines.every((l) => parse(text[l.id] || "").length === l.quantity);
    return (
        <Card className="space-y-3">
            <p className="font-medium text-gray-900">Pack: enter the serial number of every laptop</p>
            {order.lines.map((l) => {
                const n = parse(text[l.id] || "").length;
                return (
                    <Field key={l.id} label={`${l.title} · ${n} of ${l.quantity}`} hint="One per line">
                        <textarea className={`${inputCls} font-mono`} rows={Math.min(6, l.quantity + 1)} value={text[l.id] || ""} onChange={(e) => setText({ ...text, [l.id]: e.target.value })} />
                    </Field>
                );
            })}
            <Btn loading={busy} disabled={!ready} onClick={() => onSubmit(order.lines.map((l) => ({ lineId: l.id, serials: parse(text[l.id] || "") })))}>Save serials and mark packed</Btn>
        </Card>
    );
}

function DispatchForm({ order, busy, onSubmit }: { order: DealerOrder; busy: boolean; onSubmit: (b: unknown) => void }) {
    const [courier, setCourier] = useState("");
    const [awb, setAwb] = useState("");
    const [handedTo, setHandedTo] = useState("");
    if (order.fulfilment.method === "pickup") {
        return (
            <Card className="space-y-3">
                <p className="font-medium text-gray-900">Hand over to the dealer</p>
                <Field label="Collected by (name)"><input className={inputCls} value={handedTo} onChange={(e) => setHandedTo(e.target.value)} /></Field>
                <Btn loading={busy} disabled={!handedTo} onClick={() => onSubmit({ handedTo })}>Mark handed over</Btn>
            </Card>
        );
    }
    return (
        <Card className="space-y-3">
            <p className="font-medium text-gray-900">Dispatch</p>
            <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Courier"><input className={inputCls} value={courier} onChange={(e) => setCourier(e.target.value)} /></Field>
                <Field label="AWB / tracking number"><input className={inputCls} value={awb} onChange={(e) => setAwb(e.target.value)} /></Field>
            </div>
            <Btn loading={busy} disabled={!courier || !awb} onClick={() => onSubmit({ courier, awb })}>Mark dispatched</Btn>
        </Card>
    );
}

function ClaimRow({ claim: c, busy, onDecide }: { claim: DealerOrder["claims"][number]; busy: boolean; onDecide: (s: ClaimStatus, note: string) => void }) {
    const [status, setStatus] = useState<ClaimStatus>("replacement");
    const [note, setNote] = useState("");
    return (
        <Card className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-gray-500">{c.serial}</span>
                <span>{CLAIM_TYPE_LABEL[c.type]}</span>
                <Pill tone={c.status === "open" ? "amber" : c.status === "rejected" ? "red" : "green"}>{CLAIM_STATUS_LABEL[c.status]}</Pill>
                <span className="text-xs text-gray-500">{fmtDateTime(c.createdAt)}</span>
            </div>
            <p className="text-gray-700">{c.description}</p>
            {c.evidenceUrl && <a href={c.evidenceUrl} target="_blank" rel="noreferrer noopener" className="text-blue-700 underline break-all">{c.evidenceUrl}</a>}
            {c.status === "open" ? (
                <div className="flex flex-wrap gap-2 items-end">
                    <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value as ClaimStatus)}>
                        {(["replacement", "credit_note", "repair", "rejected"] as ClaimStatus[]).map((s) => <option key={s} value={s}>{CLAIM_STATUS_LABEL[s]}</option>)}
                    </select>
                    <input className={`${inputCls} flex-1 min-w-48`} placeholder="Resolution note (shown to the dealer)" value={note} onChange={(e) => setNote(e.target.value)} />
                    <Btn loading={busy} disabled={!note} onClick={() => onDecide(status, note)}>Decide</Btn>
                </div>
            ) : c.resolutionNote && <p className="text-gray-600">Resolution: {c.resolutionNote}</p>}
        </Card>
    );
}

function InvoiceRef({ order, busy, onSubmit }: { order: DealerOrder; busy: boolean; onSubmit: (b: unknown) => void }) {
    const [number, setNumber] = useState(order.invoiceRef?.number || "");
    const [note, setNote] = useState(order.invoiceRef?.note || "");
    return (
        <div className="flex flex-wrap items-end gap-2">
            <Field label="Invoice number (optional, raised outside this system)"><input className={inputCls} value={number} onChange={(e) => setNumber(e.target.value)} /></Field>
            <Field label="Note"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <Btn variant="secondary" loading={busy} onClick={() => onSubmit({ number, note })}>Save</Btn>
        </div>
    );
}

function CancelForm({ order, busy, onSubmit }: { order: DealerOrder; busy: boolean; onSubmit: (b: unknown) => void }) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [refundNote, setRefundNote] = useState("");
    if (!open) return <Btn variant="ghost" onClick={() => setOpen(true)}>Cancel this order…</Btn>;
    return (
        <Card className="space-y-3">
            <p className="font-medium text-gray-900">Cancel order</p>
            <p className="text-gray-600">Laptops go back into stock{order.status === "packed" ? " and the recorded serials are released" : ""}.</p>
            <Field label="Reason"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
            {order.paidPaise > 0 && <Field label={`Refund of ${rs(order.paidPaise)}: how and reference`}><input className={inputCls} value={refundNote} onChange={(e) => setRefundNote(e.target.value)} /></Field>}
            <div className="flex gap-2">
                <Btn variant="danger" loading={busy} disabled={!reason || (order.paidPaise > 0 && !refundNote)} onClick={() => onSubmit({ reason, refundNote: refundNote || undefined })}>Cancel order</Btn>
                <Btn variant="secondary" onClick={() => setOpen(false)}>Keep it</Btn>
            </div>
        </Card>
    );
}

// ---------------------------------------------------------------- Prices
type PriceRow = { productId: string; title: string; brand: string; condition: string; stock: number; listedPricePaise: number; dealerPrice: { pricePaise: number; warranty: { months: number; pricePaise: number } | null; active: boolean } | null };

function PricesTab() {
    const { data, error, load } = useLoad<{ products: PriceRow[] }>(() => A.get("/admin/dealer-prices"), []);
    const [q, setQ] = useState("");
    const [onlyPriced, setOnlyPriced] = useState(false);
    if (error) return <Banner tone="red">{error}</Banner>;
    if (!data) return <Spinner />;
    const rows = data.products.filter((p) => (!q || p.title.toLowerCase().includes(q.toLowerCase())) && (!onlyPriced || p.dealerPrice));
    return (
        <div className="space-y-4">
            <Banner>Dealers see a laptop only when it has an active dealer price and stock. Prices are visible to approved dealers only. Only the super admin can change them.</Banner>
            <div className="flex flex-wrap items-center gap-3">
                <input className={`${inputCls} w-64`} placeholder="Search laptops" value={q} onChange={(e) => setQ(e.target.value)} />
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={onlyPriced} onChange={(e) => setOnlyPriced(e.target.checked)} /> Only laptops with a dealer price</label>
            </div>
            <Card className="p-0 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left text-gray-500"><tr className="border-b">
                        <th className="px-4 py-3">Laptop</th><th className="px-4 py-3 text-right">Stock</th><th className="px-4 py-3 text-right">Retail</th><th className="px-4 py-3">Dealer price (₹)</th><th className="px-4 py-3">Optional warranty</th><th className="px-4 py-3">Visible</th><th className="px-4 py-3"></th>
                    </tr></thead>
                    <tbody>{rows.map((p) => <PriceRowEditor key={p.productId} row={p} onSaved={load} />)}</tbody>
                </table>
            </Card>
        </div>
    );
}

function PriceRowEditor({ row, onSaved }: { row: PriceRow; onSaved: () => void }) {
    const dp = row.dealerPrice;
    const [price, setPrice] = useState(dp ? String(dp.pricePaise / 100) : "");
    const [months, setMonths] = useState(dp?.warranty ? String(dp.warranty.months) : "");
    const [wPrice, setWPrice] = useState(dp?.warranty ? String(dp.warranty.pricePaise / 100) : "");
    const [active, setActive] = useState(dp ? dp.active : true);
    const [msg, setMsg] = useState("");
    const [saving, setSaving] = useState(false);
    const dirty = price !== (dp ? String(dp.pricePaise / 100) : "") || months !== (dp?.warranty ? String(dp.warranty.months) : "") || wPrice !== (dp?.warranty ? String(dp.warranty.pricePaise / 100) : "") || active !== (dp ? dp.active : true);
    const save = async () => {
        setMsg("");
        const pricePaise = rupeesInputToPaise(price);
        if (Number.isNaN(pricePaise)) return setMsg("Enter a price");
        let warranty: { months: number; pricePaise: number } | null = null;
        if (months) {
            const wp = wPrice ? rupeesInputToPaise(wPrice) : 0;
            if (Number.isNaN(wp)) return setMsg("Enter the warranty price");
            warranty = { months: parseInt(months, 10), pricePaise: wp };
        }
        setSaving(true);
        try { await A.put(`/admin/dealer-prices/${row.productId}`, { pricePaise, warranty, active }); onSaved(); } catch (e) { setMsg(apiError(e).message); } finally { setSaving(false); }
    };
    const atOrAboveRetail = !!price && rupeesInputToPaise(price) >= row.listedPricePaise;
    return (
        <tr className="border-b last:border-0 align-top">
            <td className="px-4 py-3">{row.title}<div className="text-xs text-gray-500">{row.condition}</div>{msg && <div className="text-xs text-rose-600">{msg}</div>}</td>
            <td className="px-4 py-3 text-right tabular-nums">{row.stock}</td>
            <td className="px-4 py-3 text-right tabular-nums">{rs(row.listedPricePaise)}</td>
            <td className="px-4 py-3"><input className={`${inputCls} w-28`} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="Not sold" />{atOrAboveRetail && <div className="text-xs text-amber-600">At or above retail</div>}</td>
            <td className="px-4 py-3">
                <div className="flex gap-1 items-center">
                    <input className={`${inputCls} w-16`} value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, ""))} placeholder="Months" aria-label="Warranty months" />
                    <input className={`${inputCls} w-24`} value={wPrice} onChange={(e) => setWPrice(e.target.value)} placeholder="₹ each" aria-label="Warranty price" disabled={!months} />
                </div>
            </td>
            <td className="px-4 py-3"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} aria-label="Visible to dealers" /></td>
            <td className="px-4 py-3"><Btn variant="secondary" loading={saving} disabled={!dirty || !price} onClick={save}>Save</Btn></td>
        </tr>
    );
}

// ---------------------------------------------------------------- Serial lookup
function SerialTab() {
    const [serial, setSerial] = useState("");
    const [res, setRes] = useState<any>(null);
    const [msg, setMsg] = useState("");
    const look = async (e: React.FormEvent) => {
        e.preventDefault();
        setRes(null);
        setMsg("");
        try { setRes(await A.get(`/admin/dealer-serials/${encodeURIComponent(serial.trim())}`)); } catch (err) { setMsg(apiError(err).message); }
    };
    return (
        <div className="space-y-4 max-w-2xl">
            <p className="text-sm text-gray-600">For support: check who a laptop was sold to and whether Lapshark warranty applies.</p>
            <form onSubmit={look} className="flex gap-2">
                <input className={`${inputCls} font-mono`} placeholder="Serial number" value={serial} onChange={(e) => setSerial(e.target.value)} />
                <Btn type="submit" disabled={!serial.trim()}>Look up</Btn>
            </form>
            {msg && <Banner tone="amber">{msg}</Banner>}
            {res && (
                <Card className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900">{res.summary}</p>
                    <p className="text-gray-700">{res.productTitle} · sold {fmtDate(res.soldAt)}</p>
                    {res.channel === "dealer" ? (
                        <>
                            <p className="text-gray-700">Dealer {res.dealer.businessName} (<span className="font-mono">{res.dealer.dealerCode}</span>) · {res.dealer.phone}{res.dealer.city ? ` · ${res.dealer.city}` : ""} · order <span className="font-mono">{res.orderNumber}</span></p>
                            <p className="text-gray-700">{res.warranty ? `Warranty ${res.warranty.months} months for the dealer${res.warranty.until ? `, until ${fmtDate(res.warranty.until)}` : ", starts on delivery"}${res.warranty.active === false ? " (ended)" : ""}` : "No Lapshark warranty"}</p>
                        </>
                    ) : (
                        <p className="text-gray-700">Retail order <span className="font-mono">{res.orderId}</span> · {res.orderStatus}</p>
                    )}
                </Card>
            )}
        </div>
    );
}

// ---------------------------------------------------------------- Settings
function SettingsTab() {
    const { data, error, load } = useLoad<{ settings: any }>(() => A.get("/admin/dealer-settings"), []);
    const [f, setF] = useState<any>(null);
    const [msg, setMsg] = useState<{ tone: "red" | "green"; text: string } | null>(null);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (data) setF({ ...data.settings, cashLimit: String(data.settings.cashLimitPaise / 100) });
    }, [data]);
    if (error) return <Banner tone="red">{error}</Banner>;
    if (!f) return <Spinner />;
    const save = async () => {
        setSaving(true);
        setMsg(null);
        try {
            await A.put("/admin/dealer-settings", {
                enabled: f.enabled,
                registrationOpen: f.registrationOpen,
                claimWindowDays: parseInt(String(f.claimWindowDays), 10),
                cashLimitPaise: rupeesInputToPaise(f.cashLimit),
                agreementVersion: f.agreementVersion,
                bankTransferInstructions: f.bankTransferInstructions,
                pickupInstructions: f.pickupInstructions,
            });
            setMsg({ tone: "green", text: "Saved" });
            load();
        } catch (e) {
            setMsg({ tone: "red", text: apiError(e).message });
        } finally {
            setSaving(false);
        }
    };
    return (
        <Card className="space-y-4 max-w-2xl">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} /> Dealer ordering on</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.registrationOpen} onChange={(e) => setF({ ...f, registrationOpen: e.target.checked })} /> New dealer applications open</label>
            <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Claim window (days after delivery)"><input className={inputCls} value={f.claimWindowDays} onChange={(e) => setF({ ...f, claimWindowDays: e.target.value.replace(/\D/g, "") })} /></Field>
                <Field label="Cash limit (₹, must stay below)" hint="Max ₹2,00,000 (Income Tax Act s.269ST)"><input className={inputCls} value={f.cashLimit} onChange={(e) => setF({ ...f, cashLimit: e.target.value })} /></Field>
                <Field label="Terms version"><input className={inputCls} value={f.agreementVersion} onChange={(e) => setF({ ...f, agreementVersion: e.target.value })} /></Field>
            </div>
            <Field label="Bank transfer details shown to dealers" hint="Account name, number, IFSC. Shown on unpaid bank-transfer orders."><textarea className={inputCls} rows={4} value={f.bankTransferInstructions} onChange={(e) => setF({ ...f, bankTransferInstructions: e.target.value })} /></Field>
            <Field label="Pickup details shown to dealers" hint="Address and hours for collection."><textarea className={inputCls} rows={3} value={f.pickupInstructions} onChange={(e) => setF({ ...f, pickupInstructions: e.target.value })} /></Field>
            {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
            <Btn loading={saving} onClick={save}>Save settings</Btn>
        </Card>
    );
}
