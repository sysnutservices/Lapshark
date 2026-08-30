"use client";

import Link from "next/link";
import { USE_CASES } from "@/lib/product-recommendation";
import { trackEvent } from "@/lib/analytics";

// Links to /products?use=<value> — ProductsClient reads this param and
// filters the already-loaded catalogue via productsForUseCase(), the same
// matching logic the recommendation quiz uses. No new route, no duplicate
// content: it's the existing /products listing pre-filtered.
export function ShopByNeed() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {USE_CASES.map((uc) => (
                <Link
                    key={uc.value}
                    href={`/products?use=${uc.value}`}
                    onClick={() => trackEvent("shop_by_need_selected", { useCase: uc.value })}
                    className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 md:p-6 text-center shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
                >
                    <uc.icon className="w-7 h-7 md:w-8 md:h-8 text-teal-600 group-hover:text-teal-700" strokeWidth={1.75} aria-hidden />
                    <span className="text-xs md:text-sm font-bold text-slate-800 group-hover:text-teal-700">{uc.label}</span>
                </Link>
            ))}
        </div>
    );
}
