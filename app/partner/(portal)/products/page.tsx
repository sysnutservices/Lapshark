"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Battery, Copy, ExternalLink, FileText, MessageCircle, Search } from "lucide-react";
import { apiError, inr, partnerApi, PartnerProduct } from "@/lib/partnerApi";
import { Banner, Empty, inputCls, Pill, Spinner } from "@/components/partner/ui";
import { usePartner } from "@/components/partner/PartnerContext";

const CATEGORIES = ["Business Laptops", "Ultrabooks", "Workstations", "Gaming Laptops", "Student & Home", "Accessories"];

export default function PartnerProductsPage() {
    const { profile } = usePartner();
    const [products, setProducts] = useState<PartnerProduct[] | null>(null);
    const [q, setQ] = useState("");
    const [category, setCategory] = useState("");
    const [error, setError] = useState("");
    const [copiedId, setCopiedId] = useState("");

    useEffect(() => {
        const t = setTimeout(() => {
            const params: Record<string, string> = {};
            if (q.trim()) params.q = q.trim();
            if (category) params.category = category;
            partnerApi.products(params).then((r) => setProducts(r.products)).catch((e) => setError(apiError(e).message));
        }, 250);
        return () => clearTimeout(t);
    }, [q, category]);

    const independent = profile.partnerType === "independent";
    const shareUrl = (p: PartnerProduct) => (p.productUrl ? `${p.productUrl}?ref=${profile.partnerCode}` : `https://lapshark.com/?ref=${profile.partnerCode}`);
    const brands = useMemo(() => new Set(products?.map((p) => p.brand)).size, [products]);

    const copy = async (p: PartnerProduct) => {
        await navigator.clipboard.writeText(shareUrl(p));
        setCopiedId(p._id);
        setTimeout(() => setCopiedId(""), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-medium text-slate-900">Live laptop catalogue</h1>
                    <p className="text-sm text-slate-500">In-stock laptops only{products ? ` · ${products.length} laptops from ${brands} brands` : ""}. Stock and price are confirmed again when the customer orders.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input className={`${inputCls} pl-9 w-56`} placeholder="Search model, brand, CPU" value={q} onChange={(e) => setQ(e.target.value)} />
                    </div>
                    <select className={`${inputCls} w-44`} value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="">All categories</option>
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {independent && <Banner>The <b>partner minimum</b> is the lowest price you may agree with a customer on your own (RAM, SSD and warranty upgrades are added at their full price). Commission grows with every rupee you sell above it. Use <b>Quote</b> to send a customer a price-locked quotation; anything below the minimum goes to Lapshark for approval.</Banner>}
            {error && <Banner tone="red">{error}</Banner>}
            {!products && !error && <Spinner />}
            {products && products.length === 0 && <Empty title="No laptops match" text="Try a different search or category." />}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products?.map((p) => {
                    const wa = encodeURIComponent(`${p.title} (${p.condition}): ${inr(p.sellingPrice)} at Lapshark. ${shareUrl(p)}`);
                    return (
                        <div key={p._id} className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.image} alt={p.title} className="h-44 w-full object-contain bg-slate-50 p-3" loading="lazy" />
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 text-xs">
                                    <Pill tone="slate">{p.brand}</Pill>
                                    <Pill tone="teal">{p.condition}</Pill>
                                    {p.stockStatus === "low_stock" && <Pill tone="amber">Low stock</Pill>}
                                </div>
                                <h3 className="mt-2 font-medium text-slate-900 line-clamp-2">{p.title}</h3>
                                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                                    {p.specs?.processor && <><dt className="text-slate-400">CPU</dt><dd className="truncate">{p.specs.processor}</dd></>}
                                    {p.specs?.ram && <><dt className="text-slate-400">RAM</dt><dd>{p.specs.ram}</dd></>}
                                    {p.specs?.storage && <><dt className="text-slate-400">Storage</dt><dd>{p.specs.storage}</dd></>}
                                    {p.specs?.display && <><dt className="text-slate-400">Display</dt><dd className="truncate">{p.specs.display}</dd></>}
                                    {p.specs?.graphics && <><dt className="text-slate-400">Graphics</dt><dd className="truncate">{p.specs.graphics}</dd></>}
                                    {p.batteryHealthPercent !== null && <><dt className="text-slate-400 flex items-center gap-1"><Battery className="w-3 h-3" />Battery</dt><dd>{p.batteryHealthPercent}%</dd></>}
                                    {p.warrantyOptions[0] && <><dt className="text-slate-400">Warranty</dt><dd>{p.warrantyOptions[0]}</dd></>}
                                </dl>
                                <div className="mt-3 flex items-end justify-between">
                                    <div>
                                        <p className="text-lg font-medium text-slate-900">{inr(p.sellingPrice)}</p>
                                        {p.mrp > p.sellingPrice && <p className="text-xs text-slate-400 line-through">{inr(p.mrp)}</p>}
                                        {p.offerLabel && <p className="text-xs text-emerald-600">{p.offerLabel}</p>}
                                    </div>
                                    {independent && (
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400">Partner minimum</p>
                                            <p className="text-sm font-medium text-[#111827]">{p.partnerMinimumPrice ? inr(p.partnerMinimumPrice) : "Not set"}</p>
                                        </div>
                                    )}
                                </div>
                                {independent && (
                                    <Link href={`/partner/quotations/new?product=${p._id}`} className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0f766e] px-3 py-2 text-sm font-medium text-white hover:bg-[#115e59]">
                                        <FileText className="w-4 h-4" /> Quote this laptop
                                    </Link>
                                )}
                                <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                                    <button onClick={() => copy(p)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><Copy className="w-3.5 h-3.5" />{copiedId === p._id ? "Copied" : "Link"}</button>
                                    <a href={`https://wa.me/?text=${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2 py-1.5 text-xs font-medium text-white"><MessageCircle className="w-3.5 h-3.5" />Share</a>
                                    {p.productUrl && <a href={p.productUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><ExternalLink className="w-3.5 h-3.5" />View</a>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
