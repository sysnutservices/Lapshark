"use client";

// Customer-facing quotation (public link from a Sales Ambassador). Shows the
// locked price, validity and Lapshark's terms; "Buy at this price" opens the
// normal checkout in quotation mode, where the server re-checks everything.
// Print / Save as PDF reuses the warranty card's print approach.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock, Loader2, Printer, ShieldCheck, ShoppingCart } from "lucide-react";
import { apiError, inr, partnerApi, PublicQuote } from "@/lib/partnerApi";
import { STORE_POLICIES } from "@/lib/policies";

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

const CLOSED: Record<string, { title: string; text: string }> = {
    expired: { title: "This quotation has expired", text: "Quotations are valid for 24 hours. Ask your Lapshark partner for a fresh one, or shop at today's prices." },
    superseded: { title: "This quotation was updated", text: "Your partner sent a newer version. Ask them for the latest link." },
    converted: { title: "This quotation has been used", text: "An order was already placed with this quotation. Check My Orders for its status." },
    cancelled: { title: "This quotation is no longer available", text: "Ask your Lapshark partner for a new quotation, or shop at today's prices." },
    rejected: { title: "This quotation is no longer available", text: "Ask your Lapshark partner for a new quotation." },
    pending_approval: { title: "This quotation is being prepared", text: "Lapshark is still confirming the price. Your partner will send you the link when it's ready." },
};

export default function QuoteContent() {
    const { token } = useParams<{ token: string }>();
    const [q, setQ] = useState<PublicQuote | null>(null);
    const [error, setError] = useState("");
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        partnerApi.publicQuote(token).then((r) => setQ(r.quotation)).catch((e) => setError(apiError(e).status === 404 ? "This quotation link isn't valid. Check the link your partner sent you." : apiError(e).message));
        const t = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(t);
    }, [token]);

    if (error) return <Shell><div className="rounded-2xl bg-white border border-slate-200 p-8 text-center"><p className="font-semibold text-slate-900">{error}</p><Link href="/products" className="mt-4 inline-block text-teal-700 font-semibold">Browse laptops</Link></div></Shell>;
    if (!q) return <Shell><div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div></Shell>;

    const expired = q.status === "active" && q.validUntil && new Date(q.validUntil).getTime() <= now;
    const status = expired ? "expired" : q.status;
    const closed = status !== "active" ? CLOSED[status] || CLOSED.cancelled : null;
    const msLeft = q.validUntil ? new Date(q.validUntil).getTime() - now : 0;
    const left = msLeft > 0 ? (msLeft >= 3600000 ? `${Math.floor(msLeft / 3600000)} h ${Math.floor((msLeft % 3600000) / 60000)} min` : `${Math.max(1, Math.floor(msLeft / 60000))} min`) : "";

    return (
        <Shell>
            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 12mm; }
                    nav, footer, #site-marquee, #compare-bar, #cookie-consent { display: none !important; }
                    html, body { background: white !important; }
                    .quote-sheet, .quote-sheet * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>

            {closed && (
                <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 print:hidden">
                    <p className="font-bold text-amber-900">{closed.title}</p>
                    <p className="mt-1 text-sm text-amber-800">{closed.text}</p>
                    <Link href="/products" className="mt-3 inline-block text-sm font-semibold text-teal-700">Shop at today's prices →</Link>
                </div>
            )}

            <div className="quote-sheet rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none">
                <div className="bg-slate-900 text-white p-6 md:p-8 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Lapshark · Quotation</p>
                        <h1 className="mt-1 text-2xl font-bold font-mono">{q.quoteNumber}{q.version > 1 ? <span className="text-slate-400 text-lg"> v{q.version}</span> : null}</h1>
                        <p className="mt-1 text-sm text-slate-300">Prepared for {q.customer.name}{q.preparedBy ? ` by ${q.preparedBy.firstName}, Lapshark Sales Ambassador ${q.preparedBy.partnerCode}` : ""}</p>
                    </div>
                    <div className="text-sm sm:text-right">
                        <p className="text-slate-400">Issued {fmt(q.createdAt)}</p>
                        {q.validUntil && <p className="text-slate-200">Valid until <b>{fmt(q.validUntil)}</b></p>}
                        {status === "active" && left && <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-200 print:hidden"><Clock className="w-3 h-3" />{left} left at this price</p>}
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                            <tr><th className="py-2 pr-3">Laptop</th><th className="py-2 pr-3 text-center">Qty</th><th className="py-2 pr-3 sm:pr-4 text-right">Price each</th><th className="hidden sm:table-cell py-2 text-right print:table-cell">Amount</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {q.items.map((i, idx) => (
                                <tr key={idx} className="align-top">
                                    <td className="py-3 pr-3">
                                        <div className="flex gap-3">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {i.image && <img src={i.image} alt="" className="hidden sm:block h-14 w-14 rounded-lg object-contain bg-slate-50 print:hidden" />}
                                            <div>
                                                {i.slug ? <Link href={`/products/${i.slug}`} className="font-semibold text-slate-900 hover:text-teal-700">{i.title}</Link> : <p className="font-semibold text-slate-900">{i.title}</p>}
                                                {i.configLabels.length > 0 && <p className="text-xs text-slate-500">{i.configLabels.join(" · ")}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 pr-3 text-center">{i.quantity}</td>
                                    <td className="py-3 pr-3 sm:pr-4 text-right whitespace-nowrap">
                                        <p className="font-semibold">{inr(i.unitPrice)}</p>
                                        {i.listedUnitPrice > i.unitPrice && <p className="text-xs text-slate-400 line-through">{inr(i.listedUnitPrice)}</p>}
                                    </td>
                                    <td className="hidden sm:table-cell py-3 text-right font-semibold print:table-cell">{inr(i.unitPrice * i.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <dl className="ml-auto max-w-xs space-y-1.5 text-sm">
                        {q.totals.savings > 0 && <div className="flex justify-between"><dt className="text-slate-500">Your saving vs listed price</dt><dd className="font-semibold text-emerald-700">{inr(q.totals.savings)}</dd></div>}
                        <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>{q.totals.shipping ? inr(q.totals.shipping) : "Free"}</dd></div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold"><dt>Total</dt><dd>{inr(q.totals.total + q.totals.shipping)}</dd></div>
                    </dl>

                    {q.customerNote && <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Note from {q.preparedBy?.firstName || "your partner"}</p><p className="mt-1 whitespace-pre-line">{q.customerNote}</p></div>}

                    <div className="grid gap-3 sm:grid-cols-3 text-sm">
                        <div className="rounded-xl border border-slate-200 p-3"><ShieldCheck className="w-4 h-4 text-teal-600" /><p className="mt-1 font-semibold">Lapshark warranty</p><p className="text-xs text-slate-500">as listed for each laptop above</p></div>
                        <div className="rounded-xl border border-slate-200 p-3"><ShieldCheck className="w-4 h-4 text-teal-600" /><p className="mt-1 font-semibold">{STORE_POLICIES.returnDays}-day returns</p><p className="text-xs text-slate-500">as per Lapshark's return policy</p></div>
                        <div className="rounded-xl border border-slate-200 p-3"><ShieldCheck className="w-4 h-4 text-teal-600" /><p className="mt-1 font-semibold">Pay Lapshark only</p><p className="text-xs text-slate-500">secure checkout, invoice and support from Lapshark</p></div>
                    </div>

                    <ul className="list-disc pl-5 text-xs text-slate-500 space-y-1">
                        {q.terms.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3 print:hidden">
                {status === "active" && (
                    <Link href={`/checkout?quote=${encodeURIComponent(token)}`} className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-teal-200 hover:bg-teal-700">
                        <ShoppingCart className="w-5 h-5" /> Buy at this price
                    </Link>
                )}
                <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    <Printer className="w-4 h-4" /> Save as PDF
                </button>
            </div>
        </Shell>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    return <div className="bg-slate-100 min-h-screen py-8 md:py-12 print:bg-white print:py-0 print:min-h-0"><div className="max-w-3xl mx-auto px-4 sm:px-6 print:max-w-none print:px-0">{children}</div></div>;
}
