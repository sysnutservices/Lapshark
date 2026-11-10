"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy, ExternalLink, MessageCircle, Pencil, XCircle } from "lucide-react";
import { apiError, inr, partnerApi, PRICING_LEVEL_LABEL, Quotation, QUOTE_STATUS_LABEL, quoteTone } from "@/lib/partnerApi";
import { Banner, Btn, Card, fmtDateTime, Pill, Spinner } from "@/components/partner/ui";

type Detail = Awaited<ReturnType<typeof partnerApi.quotation>>;

function useCountdown(until: string | null) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(t);
    }, []);
    if (!until) return "";
    const ms = new Date(until).getTime() - now;
    if (ms <= 0) return "expired";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h ? `${h} h ${m} min left` : `${m} min left`;
}

export default function QuotationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<Detail | null>(null);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        partnerApi.quotation(id).then(setData).catch((e) => setError(apiError(e).message));
    }, [id]);
    useEffect(load, [load]);

    const q: Quotation | undefined = data?.quotation;
    const left = useCountdown(q?.status === "active" ? q.validUntil : null);

    if (error) return <Banner tone="red">{error}</Banner>;
    if (!data || !q) return <Spinner />;

    const first = q.customer.name.split(" ")[0];
    const waText = q.shareUrl
        ? encodeURIComponent(
              `Hi ${first}, here is your Lapshark quotation ${q.quoteNumber}: ${q.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")} for ${inr(q.totals.quoted)}${q.totals.shipping ? ` + ${inr(q.totals.shipping)} shipping` : " with free shipping"}. ` +
                  `Valid until ${fmtDateTime(q.validUntil)}, subject to stock. You pay Lapshark directly on this secure link: ${q.shareUrl}`
          )
        : "";
    const waPhone = `91${q.customer.phone}`;
    const canChange = ["active", "pending_approval", "rejected", "expired"].includes(q.status);

    const copy = async () => {
        if (!q.shareUrl) return;
        await navigator.clipboard.writeText(q.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const cancel = async () => {
        setBusy(true);
        try {
            await partnerApi.cancelQuotation(q._id);
            load();
        } catch (e) {
            setError(apiError(e).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link href="/partner/quotations" className="text-slate-500 hover:text-slate-800" aria-label="Back to quotations"><ArrowLeft className="w-5 h-5" /></Link>
                    <div>
                        <h1 className="text-xl font-medium text-slate-900 font-mono">{q.quoteNumber} <span className="text-slate-400 text-base">v{q.version}</span></h1>
                        <p className="text-sm text-slate-500">For {q.customer.name} · {q.customer.phone} · created {fmtDateTime(q.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Pill tone={quoteTone(q.status)}>{QUOTE_STATUS_LABEL[q.status]}</Pill>
                    {left && <span className="text-xs font-medium text-amber-700">{left}</span>}
                </div>
            </div>

            {q.status === "pending_approval" && <Banner tone="amber">Waiting for Lapshark to approve the special price. You'll be able to share the link once it's approved.</Banner>}
            {q.status === "rejected" && <Banner tone="red">Lapshark didn't approve this special price{data.discountRequest?.decisionNote ? `: "${data.discountRequest.decisionNote}"` : "."} Revise the price to send a new version.</Banner>}
            {q.status === "expired" && <Banner tone="amber">This quotation has expired. Revise it to send the customer a fresh 24-hour link (prices and stock are re-checked).</Banner>}
            {q.status === "converted" && <Banner tone="green">The customer paid. Order {q.convertedOrderNumber}. Commission appears in My Earnings and is earned after delivery and the return period.</Banner>}

            {q.shareUrl && (
                <Card>
                    <h2 className="font-medium text-slate-900">Send to {first}</h2>
                    <p className="mt-1 text-sm text-slate-600">The link opens the quotation with a <b>Buy at this price</b> button. {first} pays Lapshark directly; never collect money yourself.</p>
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <input readOnly value={q.shareUrl} onFocus={(e) => e.currentTarget.select()} className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs" />
                        <button onClick={copy} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"><Copy className="w-4 h-4" />{copied ? "Copied" : "Copy"}</button>
                        <a href={`https://wa.me/${waPhone}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white"><MessageCircle className="w-4 h-4" />WhatsApp {first}</a>
                        <a href={q.shareUrl.replace(/^https?:\/\/[^/]+/, "")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"><ExternalLink className="w-4 h-4" />Customer view / PDF</a>
                    </div>
                </Card>
            )}

            <Card className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left text-xs text-slate-500">
                        <tr><th className="py-2 pr-4">Laptop</th><th className="py-2 pr-4 text-right">Listed</th><th className="py-2 pr-4 text-right">Your minimum</th><th className="py-2 pr-4 text-right">Quoted</th><th className="py-2 pr-4">Pricing</th><th className="py-2 text-right">Est. commission</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {q.items.map((i, idx) => (
                            <tr key={i._id || idx}>
                                <td className="py-3 pr-4"><p className="font-medium text-slate-900">{i.quantity}× {i.title}</p>{i.configLabels.length > 0 && <p className="text-xs text-slate-500">{i.configLabels.join(" · ")}</p>}</td>
                                <td className="py-3 pr-4 text-right">{inr(i.listedUnitPrice)}</td>
                                <td className="py-3 pr-4 text-right text-slate-600">{i.floorUnitPrice === null ? "Not set" : inr(i.floorUnitPrice)}</td>
                                <td className="py-3 pr-4 text-right font-medium">{inr(i.quotedUnitPrice)}</td>
                                <td className="py-3 pr-4"><Pill tone={i.level === 1 ? "slate" : i.level === 2 ? "teal" : "amber"}>{PRICING_LEVEL_LABEL[i.level]}</Pill></td>
                                <td className="py-3 text-right">{i.level === 3 && !i.commissionApproved ? "On approval" : inr(i.estCommissionPerUnit * i.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
                    <div className="flex justify-between"><dt className="text-slate-500">Listed total</dt><dd>{inr(q.totals.listed)}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd className="text-emerald-700">−{inr(q.totals.discount)}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>{q.totals.shipping ? inr(q.totals.shipping) : "Free"}</dd></div>
                    <div className="flex justify-between border-t border-slate-100 pt-1 font-medium"><dt>Customer pays</dt><dd>{inr(q.totals.quoted + q.totals.shipping)}</dd></div>
                    <div className="flex justify-between text-[#111827]"><dt>Your est. commission</dt><dd className="font-medium">{inr(q.totals.estCommission)}</dd></div>
                </dl>
                {q.customerNote && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><span className="text-xs text-slate-400 block">Your note to the customer</span>{q.customerNote}</p>}
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                    <h2 className="font-medium text-slate-900">Versions</h2>
                    <ul className="mt-3 divide-y divide-slate-100 text-sm">
                        {data.versions.map((v) => (
                            <li key={v._id} className="flex items-center justify-between py-2">
                                <Link href={`/partner/quotations/${v._id}`} className={`font-mono ${v._id === q._id ? "font-medium text-slate-900" : "text-[#0f766e]"}`}>v{v.version}</Link>
                                <span>{inr(v.total)}</span>
                                <Pill tone={quoteTone(v.status)}>{QUOTE_STATUS_LABEL[v.status]}</Pill>
                                <span className="text-xs text-slate-500">{fmtDateTime(v.createdAt)}</span>
                            </li>
                        ))}
                    </ul>
                    {data.discountRequest && (
                        <div className="mt-4 rounded-lg border border-slate-200 p-3 text-sm">
                            <p className="text-xs font-medium text-slate-400">Special-price request</p>
                            <p className="mt-1">Status: <b>{data.discountRequest.status}</b></p>
                            <p className="text-slate-600">Your reason: {data.discountRequest.reason}</p>
                            {data.discountRequest.decisionNote && <p className="text-slate-600">Lapshark: {data.discountRequest.decisionNote}</p>}
                        </div>
                    )}
                </Card>
                {canChange && (
                    <Card>
                        <h2 className="font-medium text-slate-900">Change this quotation</h2>
                        <p className="mt-1 text-sm text-slate-600">Revising creates version {q.version + 1} with a new link; this link stops working.</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link href={`/partner/quotations/new?revise=${q._id}`} className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-medium text-white"><Pencil className="w-4 h-4" />Revise</Link>
                            {q.status !== "expired" && <Btn variant="secondary" loading={busy} onClick={cancel}><XCircle className="w-4 h-4" />Cancel quotation</Btn>}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
