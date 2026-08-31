"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";
import { API_URL } from "@/api/api";
import { calculateProductPrice, getExtraOfferStatus, ExtraOfferStatus } from "@/lib/pricing";

interface Props {
    // Needs _id (must be an already-saved product — a new, unsaved one has
    // nowhere to PUT the offer to) and finalPrice (the selling price the
    // offer discounts from).
    product: Product;
    onSaved: (updated: Product) => void;
}

type OfferFormState = {
    discountType: "fixed" | "percentage" | "specialPrice";
    discountValue: string; // controlled input stays a string; parsed on save
    offerLabel: string;
    startAt: string; // datetime-local value, local time
    endAt: string;
    isActive: boolean;
    showOnProduct: boolean;
    showOnListing: boolean;
    showOnHomepage: boolean;
};

const EMPTY_FORM: OfferFormState = {
    discountType: "fixed",
    discountValue: "",
    offerLabel: "",
    startAt: "",
    endAt: "",
    isActive: true,
    showOnProduct: true,
    showOnListing: true,
    showOnHomepage: true,
};

function toDatetimeLocal(iso?: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(v: string): string | null {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const STATUS_BADGE: Record<ExtraOfferStatus, { label: string; className: string }> = {
    none: { label: "—", className: "text-gray-400" },
    scheduled: { label: "🕓 Scheduled", className: "text-amber-600" },
    active: { label: "🟢 Active", className: "text-green-600" },
    expired: { label: "⚪ Expired", className: "text-gray-500" },
    disabled: { label: "⛔ Disabled", className: "text-red-500" },
};

// "Pricing & Offers" — the admin UI for the Extra Product Offer feature.
// A standalone PUT/DELETE against /products/:id/extra-offer, separate from
// the (multipart) product-update form, so saving a promotion never requires
// re-submitting/re-uploading the rest of the product. Self-contained: owns
// its own form state, re-derived from the product whenever it changes
// rather than trying to two-way-sync with the parent's giant form state.
export default function ExtraOfferSection({ product, onSaved }: Props) {
    const [form, setForm] = useState<OfferFormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const o = product.extraOffer;
        setForm(
            o
                ? {
                    discountType: o.discountType,
                    discountValue: String(o.discountValue),
                    offerLabel: o.offerLabel || "",
                    startAt: toDatetimeLocal(o.startAt),
                    endAt: toDatetimeLocal(o.endAt),
                    isActive: o.isActive,
                    showOnProduct: o.showOnProduct,
                    showOnListing: o.showOnListing,
                    showOnHomepage: o.showOnHomepage,
                }
                : EMPTY_FORM
        );
        setError("");
    }, [product._id, product.extraOffer]);

    const sellingPrice = product.finalPrice || 0;
    const discountValueNum = Number(form.discountValue) || 0;
    const status = getExtraOfferStatus(product.extraOffer as any);

    // Live preview via the exact same calculateProductPrice the storefront
    // uses — never a second, hand-rolled preview formula. Ignores
    // start/end/isActive on purpose: "what would a customer see if this
    // were live right now", which is what an admin adjusting the numbers
    // actually wants to see before scheduling it.
    const preview = calculateProductPrice(sellingPrice, {
        discountType: form.discountType,
        discountValue: discountValueNum,
        isActive: true,
        showOnProduct: true,
        showOnListing: true,
        showOnHomepage: true,
    } as any);

    async function submit(method: "PUT" | "DELETE") {
        setSaving(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/products/${product._id}/extra-offer`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body:
                    method === "PUT"
                        ? JSON.stringify({
                            discountType: form.discountType,
                            discountValue: discountValueNum,
                            offerLabel: form.offerLabel || undefined,
                            startAt: fromDatetimeLocal(form.startAt),
                            endAt: fromDatetimeLocal(form.endAt),
                            isActive: form.isActive,
                            showOnProduct: form.showOnProduct,
                            showOnListing: form.showOnListing,
                            showOnHomepage: form.showOnHomepage,
                        })
                        : undefined,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Request failed");
            onSaved(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Request failed");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center">
                    <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-rose-600 font-bold">%</span>
                    </div>
                    Pricing & Offers
                </h3>
                {product.extraOffer && (
                    <span className={`text-xs font-bold ${STATUS_BADGE[status].className}`}>{STATUS_BADGE[status].label}</span>
                )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 flex justify-between">
                <span>Selling Price</span>
                <span className="font-bold text-gray-900">₹{sellingPrice.toLocaleString("en-IN")}</span>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Extra Product Offer</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                    <select
                        className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                        value={form.discountType}
                        onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as OfferFormState["discountType"] }))}
                    >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                        <option value="specialPrice">Special Final Price</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {form.discountType === "specialPrice" ? "Special Price (₹)" : form.discountType === "percentage" ? "Discount (%)" : "Discount (₹)"}
                    </label>
                    <input
                        type="number"
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                        value={form.discountValue}
                        onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                        placeholder={form.discountType === "percentage" ? "5" : "1500"}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Offer Label (optional)</label>
                <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                    value={form.offerLabel}
                    onChange={(e) => setForm((f) => ({ ...f, offerLabel: e.target.value }))}
                    placeholder="e.g. Extra ₹1,500 Off / Limited Time Offer"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date (optional — blank = immediately active)</label>
                    <input
                        type="datetime-local"
                        className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                        value={form.startAt}
                        onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date (optional — blank = no expiry)</label>
                    <input
                        type="datetime-local"
                        className="w-full p-3 border border-gray-300 rounded-lg outline-none"
                        value={form.endAt}
                        onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /> Enabled
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.showOnProduct} onChange={(e) => setForm((f) => ({ ...f, showOnProduct: e.target.checked }))} /> Show on product page
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.showOnListing} onChange={(e) => setForm((f) => ({ ...f, showOnListing: e.target.checked }))} /> Show on listing
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={form.showOnHomepage} onChange={(e) => setForm((f) => ({ ...f, showOnHomepage: e.target.checked }))} /> Show on homepage
                </label>
            </div>

            {discountValueNum > 0 && (
                <div className="bg-gradient-to-r from-rose-50 to-orange-50 p-4 rounded-lg border border-rose-100 space-y-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Preview</span>
                    <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-bold text-gray-900">₹{preview.finalPrice.toLocaleString("en-IN")}</span>
                        {preview.offer && <span className="text-sm text-gray-400 line-through">₹{sellingPrice.toLocaleString("en-IN")}</span>}
                        {preview.offer && (
                            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                {form.offerLabel || (form.discountType === "percentage" ? `EXTRA ${discountValueNum}% OFF` : `EXTRA ₹${preview.offer.discountAmount.toLocaleString("en-IN")} OFF`)}
                            </span>
                        )}
                    </div>
                    {preview.offer && (
                        <div className="text-xs text-gray-600 flex gap-6">
                            <span>You are giving: <b>₹{preview.offer.discountAmount.toLocaleString("en-IN")}</b></span>
                            <span>Effective discount: <b>{((preview.offer.discountAmount / sellingPrice) * 100).toFixed(2)}%</b></span>
                        </div>
                    )}
                </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
                <button
                    type="button"
                    disabled={saving || !discountValueNum}
                    onClick={() => submit("PUT")}
                    className="px-5 py-2.5 bg-rose-600 text-white rounded-lg font-bold text-sm hover:bg-rose-700 disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save Promotion"}
                </button>
                {product.extraOffer && (
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => submit("DELETE")}
                        className="px-5 py-2.5 border border-red-300 text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 disabled:opacity-50"
                    >
                        Remove Promotion
                    </button>
                )}
            </div>
        </div>
    );
}
