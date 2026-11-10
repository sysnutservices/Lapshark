"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BadgeIndianRupee, Bell, CheckCircle2, Copy, Download, FileText, Hourglass, Laptop, MessageCircle, Plus, ShoppingBag, TrendingUp, Users, Wallet } from "lucide-react";
import { apiError, Dashboard, inr, LEAD_STATUS_LABEL, LeadStatus, partnerApi } from "@/lib/partnerApi";
import { Banner, Card, Spinner, Stat } from "@/components/partner/ui";
import { usePartner } from "@/components/partner/PartnerContext";

export default function PartnerDashboardPage() {
    const { profile } = usePartner();
    const [data, setData] = useState<Dashboard | null>(null);
    const [link, setLink] = useState<{ code: string; url: string } | null>(null);
    const [qr, setQr] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        partnerApi.dashboard().then(setData).catch((e) => setError(apiError(e).message));
        partnerApi
            .referralLink()
            .then(async (l) => {
                setLink(l);
                setQr(await QRCode.toDataURL(l.url, { margin: 1, width: 320, color: { dark: "#0b1530", light: "#ffffff" } }));
            })
            .catch(() => undefined);
    }, []);

    const copy = async () => {
        if (!link) return;
        await navigator.clipboard.writeText(link.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const whatsappText = link ? encodeURIComponent(`Looking for a reliable business laptop? Lapshark sells quality-checked refurbished laptops with warranty. Browse here: ${link.url}`) : "";

    if (error) return <Banner tone="red">{error}</Banner>;
    if (!data) return <Spinner />;
    const c = data.cards;
    const independent = profile.partnerType === "independent";

    return (
        <div className="space-y-6">
            {c.followUpsDue > 0 && (
                <Link href="/partner/leads?due=1" className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100">
                    <Bell className="w-4 h-4" />
                    <span><b>{c.followUpsDue}</b> customer follow-up{c.followUpsDue === 1 ? " is" : "s are"} due. Open your list →</span>
                </Link>
            )}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Stat tone="slate" label="Total leads" value={c.totalLeads} icon={Users} />
                <Stat tone="slate" label="Active leads" value={c.activeLeads} icon={TrendingUp} />
                <Stat tone="slate" label="Quotations sent" value={c.quotationsSent} icon={FileText} />
                <Stat tone="slate" label="Orders completed" value={c.ordersCompleted} icon={CheckCircle2} />
                <Stat label="Laptops sold" value={c.laptopsSold} icon={Laptop} tone="slate" />
                <Stat tone="slate" label="Total sales" value={inr(c.totalSales)} icon={ShoppingBag} />
                <Stat tone="slate" label="Pending commission" value={inr(c.pendingCommission)} icon={Hourglass} />
                <Stat tone="slate" label="Paid commission" value={inr(c.paidCommission)} icon={Wallet} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <h2 className="font-medium text-slate-900">Commission by month</h2>
                    <p className="text-xs text-slate-500">Last 6 months, excluding reversed sales</p>
                    <div className="mt-4 h-64">
                        {data.monthly.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.monthly}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} width={70} />
                                    <Tooltip formatter={(v) => inr(Number(v))} />
                                    <Bar dataKey="commission" name="Commission" fill="#0f766e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-sm text-slate-500">Your first sale will show up here.</div>
                        )}
                    </div>
                </Card>

                <Card>
                    <h2 className="font-medium text-slate-900">Lead pipeline</h2>
                    <p className="text-xs text-slate-500">Conversion {data.leadConversion.rate}% ({data.leadConversion.won} of {data.leadConversion.total})</p>
                    <ul className="mt-4 space-y-2">
                        {(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map((s) => {
                            const n = data.leadsByStatus[s] || 0;
                            const pct = data.leadConversion.total ? (n / data.leadConversion.total) * 100 : 0;
                            return (
                                <li key={s}>
                                    <div className="flex justify-between text-sm"><span className="text-slate-600">{LEAD_STATUS_LABEL[s]}</span><span className="font-medium text-slate-900">{n}</span></div>
                                    <div className="mt-1 h-1.5 rounded bg-slate-100"><div className="h-1.5 rounded bg-[#0f766e]" style={{ width: `${pct}%` }} /></div>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
            </div>

            <Card className="scroll-mt-24" >
                <div id="referral" className="scroll-mt-24" />
                <div className="grid gap-6 md:grid-cols-[1fr_auto] items-start">
                    <div>
                        <h2 className="font-medium text-slate-900">Your referral link</h2>
                        <p className="mt-1 text-sm text-slate-600">Anyone who opens this link and orders within 30 days is credited to you. It works on every Lapshark page. Add <span className="font-mono">?ref={profile.partnerCode}</span> to any product link.</p>
                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                            <input readOnly value={link?.url || ""} className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm" onFocus={(e) => e.currentTarget.select()} />
                            <button onClick={copy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-medium text-white"><Copy className="w-4 h-4" />{copied ? "Copied" : "Copy"}</button>
                            <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white"><MessageCircle className="w-4 h-4" />WhatsApp</a>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                            <Link href="/partner/products" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Laptop className="w-4 h-4" />Browse laptops</Link>
                            <Link href="/partner/leads?new=1" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Plus className="w-4 h-4" />Add customer lead</Link>
                            <Link href="/partner/earnings" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><BadgeIndianRupee className="w-4 h-4" />View commissions</Link>
                            {independent && <Link href="/partner/quotations/new" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><FileText className="w-4 h-4" />New quotation</Link>}
                        </div>
                    </div>
                    {qr && (
                        <div className="text-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qr} alt={`QR code for ${link?.url}`} className="w-40 h-40 rounded-lg border border-slate-200" />
                            <a href={qr} download={`lapshark-${profile.partnerCode}-qr.png`} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#0f766e]"><Download className="w-3.5 h-3.5" />Download QR</a>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
