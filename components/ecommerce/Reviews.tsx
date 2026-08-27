"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Check, User } from "lucide-react";
import { api } from "@/api/api";

interface FeaturedReview {
    _id: string;
    userName: string;
    rating: number;
    comment: string;
    verifiedPurchase: boolean;
    createdAt: string;
    productTitle?: string;
    productSlug?: string;
}

// "Trusted by Laptop Buyers" — real reviews only (GET /reviews/featured,
// highest-rated + verified-first, see reviewController.getFeaturedReviews).
// Renders nothing rather than a fake testimonial when there aren't enough
// genuine reviews yet — an empty section is honest, a fabricated one isn't.
export function Reviews() {
    const [reviews, setReviews] = useState<FeaturedReview[] | null>(null);

    useEffect(() => {
        api.get("/reviews/featured?limit=9")
            .then((res) => setReviews(res.data || []))
            .catch(() => setReviews([]));
    }, []);

    if (reviews === null || reviews.length === 0) return null;

    return (
        <div>
            <div className="text-center mb-8 md:mb-12">
                <span className="text-teal-600 font-bold tracking-widest uppercase text-xs mb-2 block">Testimonials</span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Trusted by Laptop Buyers</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {reviews.slice(0, 6).map((r) => (
                    <div key={r._id} className="rounded-2xl border border-slate-100 bg-white p-5 md:p-6 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-current" : "text-slate-200"}`} />
                                ))}
                            </div>
                            {r.verifiedPurchase && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                    <Check className="w-3 h-3" /> Verified
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed flex-1 line-clamp-4">{r.comment}</p>
                        <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-slate-100">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{r.userName}</p>
                                {r.productSlug && r.productTitle && (
                                    <Link href={`/products/${r.productSlug}`} className="text-[11px] text-slate-400 hover:text-teal-600 truncate block">
                                        {r.productTitle}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
