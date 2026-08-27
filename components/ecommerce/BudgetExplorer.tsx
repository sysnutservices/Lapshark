"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { BUDGET_RANGES, BudgetRange } from "@/lib/product-recommendation";
import { trackEvent } from "@/lib/analytics";

// Generic, representative expectations per price band — not tied to any one
// listing, so it stays true regardless of which exact products are in stock.
const BUDGET_COPY: Record<BudgetRange, string[]> = {
    "under-20k": ["Students", "Web browsing & MS Office", "Online classes", "Light multitasking"],
    "20k-30k": ["College & everyday office work", "Multiple browser tabs + Office", "Video calls", "Entry-level coding"],
    "30k-50k": ["Business-grade builds", "Programming & multitasking", "Light photo editing", "Faster SSD storage"],
    "above-50k": ["Demanding multitasking", "Programming & design work", "Higher RAM/storage configs", "Premium build quality"],
};

export function BudgetExplorer({ products }: { products: Product[] }) {
    const [active, setActive] = useState<BudgetRange>("under-20k");
    const range = BUDGET_RANGES.find((b) => b.value === active)!;

    const matches = products
        .filter((p) => p.stock > 0 && p.finalPrice >= range.min && p.finalPrice < (range.max === Infinity ? Infinity : range.max))
        .sort((a, b) => (b.isBestDeal ? 1 : 0) - (a.isBestDeal ? 1 : 0) || b.rating - a.rating)
        .slice(0, 4);

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
                {BUDGET_RANGES.map((b) => (
                    <button
                        key={b.value}
                        onClick={() => {
                            setActive(b.value);
                            trackEvent("budget_category_selected", { budget: b.value });
                        }}
                        className={`rounded-full px-4 py-2 text-xs md:text-sm font-bold transition-colors ${active === b.value ? "bg-teal-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300"
                            }`}
                    >
                        {b.label}
                    </button>
                ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-10">
                <div className="md:col-span-1">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3">Great for</p>
                    <ul className="space-y-2.5">
                        {BUDGET_COPY[active].map((item) => (
                            <li key={item} className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
                                <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" /> {item}
                            </li>
                        ))}
                    </ul>
                    <Link
                        href={`/products?priceRange=${range.max === Infinity ? 300000 : range.max}`}
                        className="inline-block mt-5 text-sm font-bold text-teal-600 hover:text-teal-700"
                    >
                        See all in this range →
                    </Link>
                </div>
                <div className="md:col-span-2">
                    {matches.length === 0 ? (
                        <p className="text-sm text-slate-400 py-8 text-center">No laptops currently in stock in this range.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {matches.map((p) => (
                                <ProductCard key={p._id || p.id} product={p} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
