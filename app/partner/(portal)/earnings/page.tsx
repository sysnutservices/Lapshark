"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Hourglass, PackageCheck, Undo2, Wallet } from "lucide-react";
import { apiError, Commission, COMMISSION_STATUS_LABEL, CommissionStatus, Dashboard, inr, partnerApi, PayoutSummary } from "@/lib/partnerApi";
import { Banner, Card, Empty, fmtDate, inputCls, Pill, Spinner, Stat, statusTone } from "@/components/partner/ui";

const REASON: Record<string, string> = {
    slab: "Standard rate",
    margin_share: "Base + margin share",
    below_slab: "Below commission range",
    above_slab: "Rate pending review",
    below_floor: "Below minimum price, under review",
    no_rule: "Rate pending review",
    special_approval: "Special price approved by Lapshark",
};

export default function PartnerEarningsPage() {
    const [rows, setRows] = useState<Commission[] | null>(null);
    const [summary, setSummary] = useState<Dashboard["cards"] | null>(null);
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [error, setError] = useState("");
    const [pay, setPay] = useState<PayoutSummary | null>(null);

    useEffect(() => {
        partnerApi.dashboard().then((d) => setSummary(d.cards)).catch(() => undefined);
        partnerApi.payouts().then(setPay).catch(() => undefined);
    }, []);
    useEffect(() => {
        const params: Record<string, string> = { page: String(page) };
        if (status) params.status = status;
        partnerApi.commissions(params).then((r) => { setRows(r.commissions); setTotal(r.total); setPageSize(r.pageSize); }).catch((e) => setError(apiError(e).message));
    }, [status, page]);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-medium text-slate-900">My earnings</h1>
                <p className="text-sm text-slate-500">Each sale is recorded when the customer pays, confirmed on delivery, and paid after payment clears and the 14-day return window passes.</p>
            </div>
            {summary && (
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    <Stat tone="slate" label="Pending (paid → eligible)" value={inr(summary.pendingCommission)} icon={Hourglass} />
                    <Stat tone="slate" label="Approved / processing" value={inr(summary.approvedCommission)} icon={CheckCircle2} />
                    <Stat tone="slate" label="Paid out" value={inr(summary.paidCommission)} icon={Wallet} />
                    <Stat label="Laptops sold" value={summary.laptopsSold} icon={PackageCheck} tone="slate" />
                </div>
            )}

            {pay && (pay.summary.eligible > 0 || pay.summary.approved > 0 || pay.summary.inPayout > 0 || pay.summary.openAdjustments !== 0) && (
                <Card>
                    <h2 className="font-medium text-slate-900">Coming to you</h2>
                    <dl className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
                        <div><dt className="text-xs text-slate-500">Eligible, awaiting Lapshark approval</dt><dd className="font-medium">{inr(pay.summary.eligible)}</dd></div>
                        <div><dt className="text-xs text-slate-500">Approved, in the next payout</dt><dd className="font-medium">{inr(pay.summary.approved)}</dd></div>
                        <div><dt className="text-xs text-slate-500">Payout being transferred</dt><dd className="font-medium">{inr(pay.summary.inPayout)}</dd></div>
                        <div><dt className="text-xs text-slate-500">Adjustments</dt><dd className={`font-medium ${pay.summary.openAdjustments < 0 ? "text-rose-700" : ""}`}>{inr(pay.summary.openAdjustments)}</dd></div>
                    </dl>
                    {pay.adjustments.length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-slate-600">
                            {pay.adjustments.map((a, i) => <li key={i}>{fmtDate(a.createdAt)} · <b className={a.amount < 0 ? "text-rose-700" : "text-emerald-700"}>{inr(a.amount)}</b> · {a.reason}</li>)}
                        </ul>
                    )}
                    <p className="mt-3 text-xs text-slate-500">A sale that is cancelled, returned or refunded after its commission was paid is deducted from your next payout.</p>
                </Card>
            )}

            {pay && pay.payouts.length > 0 && (
                <Card className="p-0 overflow-x-auto">
                    <p className="px-4 pt-4 font-medium text-slate-900">Payouts</p>
                    <table className="mt-2 min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs text-slate-500">
                            <tr><th className="px-4 py-3">Payout</th><th className="px-4 py-3">To</th><th className="px-4 py-3 text-right">Commission</th><th className="px-4 py-3 text-right">Adjustments</th><th className="px-4 py-3 text-right">TDS</th><th className="px-4 py-3 text-right">Paid to you</th><th className="px-4 py-3">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pay.payouts.map((p) => (
                                <tr key={p._id}>
                                    <td className="px-4 py-3"><p className="font-mono text-xs">{p.payoutNumber}</p><p className="text-xs text-slate-400">{fmtDate(p.createdAt)} · {p.commissionCount} sale(s)</p></td>
                                    <td className="px-4 py-3 text-xs">{p.method === "upi" ? "UPI" : "Bank"} {p.destinationMasked}</td>
                                    <td className="px-4 py-3 text-right">{inr(p.gross)}</td>
                                    <td className="px-4 py-3 text-right">{p.adjustments ? inr(p.adjustments) : "—"}</td>
                                    <td className="px-4 py-3 text-right">{p.tds ? `−${inr(p.tds)}` : "—"}</td>
                                    <td className="px-4 py-3 text-right font-medium">{inr(p.net)}</td>
                                    <td className="px-4 py-3">
                                        <Pill tone={p.status === "paid" ? "green" : p.status === "failed" ? "red" : "blue"}>{p.status === "paid" ? "Paid" : p.status === "failed" ? "Transfer failed" : "Transferring"}</Pill>
                                        {p.status === "paid" && <p className="mt-1 text-xs text-slate-500">{fmtDate(p.paidAt)} · Ref {p.reference}</p>}
                                        {p.status === "failed" && <p className="mt-1 text-xs text-slate-500">Will be retried. Check your payout details with Lapshark.</p>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            <div className="flex items-center gap-2">
                <select className={`${inputCls} w-52`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                    <option value="">All statuses</option>
                    {(Object.keys(COMMISSION_STATUS_LABEL) as CommissionStatus[]).map((s) => <option key={s} value={s}>{COMMISSION_STATUS_LABEL[s]}</option>)}
                </select>
            </div>

            {error && <Banner tone="red">{error}</Banner>}
            {!rows && !error && <Spinner />}
            {rows && rows.length === 0 && <Empty title="No commissions yet" text="When a customer you referred pays for an order, it appears here." />}
            {rows && rows.length > 0 && (
                <Card className="p-0 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs text-slate-500">
                            <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Order</th><th className="px-4 py-3">Laptop</th><th className="px-4 py-3 text-right">Sold at</th><th className="px-4 py-3 text-right">Commission</th><th className="px-4 py-3">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((c) => (
                                <tr key={c._id}>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{c.orderNumber}</td>
                                    <td className="px-4 py-3"><p className="text-slate-900">{c.productTitle}{c.quantity > 1 ? ` × ${c.quantity}` : ""}</p><p className="text-xs text-slate-400">{REASON[c.calcReason] || c.calcReason}{c.ruleVersion ? ` · rule v${c.ruleVersion}` : ""} · via {c.attributionType === "lead" ? "your lead" : c.attributionType === "manual" ? "Lapshark review" : "your link"}</p></td>
                                    <td className="px-4 py-3 text-right">{inr(c.unitSellingPrice)}</td>
                                    <td className={`px-4 py-3 text-right font-medium ${c.status === "reversed" ? "text-slate-400 line-through" : "text-slate-900"}`}>{inr(c.commission)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1 items-start">
                                            <Pill tone={statusTone(c.status)}>{COMMISSION_STATUS_LABEL[c.status]}</Pill>
                                            {c.holdNote && c.status !== "reversed" && <span className="text-xs text-amber-700">{c.holdNote}</span>}
                                            {c.status === "reversed" && c.reversalReason && <span className="text-xs text-slate-500 inline-flex items-center gap-1"><Undo2 className="w-3 h-3" />{c.reversalReason}</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
            {total > pageSize && (
                <div className="flex justify-end gap-2 text-sm">
                    <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Previous</button>
                    <span className="px-2 py-1 text-slate-500">Page {page} of {Math.ceil(total / pageSize)}</span>
                    <button disabled={page * pageSize >= total} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button>
                </div>
            )}
        </div>
    );
}
