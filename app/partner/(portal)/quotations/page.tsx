"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { apiError, inr, partnerApi, Quotation, QUOTE_STATUS_LABEL, quoteTone } from "@/lib/partnerApi";
import { Banner, Empty, fmtDateTime, Pill, Spinner } from "@/components/partner/ui";
import { usePartner } from "@/components/partner/PartnerContext";

const FILTERS: [string, string][] = [
    ["", "All"],
    ["active", "Active"],
    ["pending_approval", "Waiting for approval"],
    ["converted", "Order placed"],
    ["expired", "Expired"],
    ["rejected", "Rejected"],
    ["cancelled", "Cancelled"],
];

export default function QuotationsPage() {
    const { profile } = usePartner();
    const [status, setStatus] = useState("");
    const [rows, setRows] = useState<Quotation[] | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        setRows(null);
        partnerApi.quotations(status ? { status } : {}).then((r) => setRows(r.quotations)).catch((e) => setError(apiError(e).message));
    }, [status]);

    if (profile.partnerType !== "independent") return <Banner tone="amber">Quotations are for Independent Sales Ambassadors.</Banner>;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-medium text-slate-900">Quotations</h1>
                    <p className="text-sm text-slate-500">Price-locked offers for your customers. Each is valid for 24 hours, subject to stock.</p>
                </div>
                <Link href="/partner/quotations/new" className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-medium text-white hover:bg-[#115e59]"><Plus className="w-4 h-4" />New quotation</Link>
            </div>
            <div className="flex flex-wrap gap-2">
                {FILTERS.map(([v, label]) => (
                    <button key={v} onClick={() => setStatus(v)} className={`rounded-full border px-3 py-1 text-xs font-medium ${status === v ? "border-[#0f766e] bg-[#0f766e] text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>{label}</button>
                ))}
            </div>
            {error && <Banner tone="red">{error}</Banner>}
            {!rows && !error && <Spinner />}
            {rows && rows.length === 0 && <Empty title="No quotations yet" text="Create one from the catalogue or from a customer in your list." action={<Link href="/partner/quotations/new" className="text-sm font-medium text-[#0f766e]">New quotation</Link>} />}
            {rows && rows.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs text-slate-500">
                            <tr><th className="px-4 py-3">Quotation</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Laptops</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Est. commission</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Valid until</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((q) => (
                                <tr key={q._id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3"><Link href={`/partner/quotations/${q._id}`} className="inline-flex items-center gap-1.5 font-mono font-medium text-[#0f766e]"><FileText className="w-4 h-4" />{q.quoteNumber}{q.version > 1 ? ` v${q.version}` : ""}</Link></td>
                                    <td className="px-4 py-3">{q.customer.name}</td>
                                    <td className="px-4 py-3 max-w-[16rem] truncate">{q.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}</td>
                                    <td className="px-4 py-3 text-right font-medium">{inr(q.totals.quoted)}</td>
                                    <td className="px-4 py-3 text-right">{inr(q.totals.estCommission)}</td>
                                    <td className="px-4 py-3"><Pill tone={quoteTone(q.status)}>{QUOTE_STATUS_LABEL[q.status]}</Pill></td>
                                    <td className="px-4 py-3 text-slate-600">{q.status === "active" ? fmtDateTime(q.validUntil) : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
