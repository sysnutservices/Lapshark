"use client";

import { useEffect, useRef } from "react";
import { estimateFromPerMonth, calculateEstimatedEmi, EMI_TENURE_OPTIONS_MONTHS, EMI_PROVIDER_NAME } from "@/lib/emi";
import { STORE_POLICIES } from "@/lib/policies";
import { trackEvent } from "@/lib/analytics";

// Compact "From ₹X/month" line for cards — always labeled an estimate since
// no live financing API exists yet (see lib/emi.ts).
export function ProductEMILine({ price, className = "" }: { price: number; className?: string }) {
    const perMonth = estimateFromPerMonth(price);
    if (!perMonth) return null;
    return (
        <p className={`text-xs md:text-sm font-semibold text-teal-700 ${className}`}>
            Est. from ₹{perMonth.toLocaleString("en-IN")}/month
        </p>
    );
}

// Fuller breakdown for the product page's Payment Options section.
export function ProductEMIOptions({ price }: { price: number }) {
    const tracked = useRef(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (tracked.current || !ref.current) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !tracked.current) {
                tracked.current = true;
                trackEvent("emi_info_viewed", { price });
                observer.disconnect();
            }
        }, { threshold: 0.4 });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [price]);

    return (
        <div ref={ref} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 md:p-5">
            <p className="text-sm font-bold text-slate-900 mb-1">EMI &amp; Payment Options</p>
            <p className="text-xs text-slate-500 mb-4">
                Available via {EMI_PROVIDER_NAME} EMI Card. Figures below are estimates for planning — your
                actual approved rate and tenure depend on {EMI_PROVIDER_NAME}'s assessment at checkout.
            </p>
            <div className="grid grid-cols-3 gap-2">
                {EMI_TENURE_OPTIONS_MONTHS.map((months) => (
                    <div key={months} className="rounded-xl bg-white border border-slate-100 p-2.5 text-center">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">{months} mo</p>
                        <p className="text-sm font-bold text-slate-900">₹{calculateEstimatedEmi(price, months).toLocaleString("en-IN")}</p>
                    </div>
                ))}
            </div>
            {STORE_POLICIES.codAvailable && (
                <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">
                    <span className="font-bold text-slate-700">Cash on Delivery</span> available.
                    {price > STORE_POLICIES.codAdvanceAmount
                        ? ` A ₹${STORE_POLICIES.codAdvanceAmount} advance is required to confirm COD orders — the rest is collected on delivery.`
                        : " Pay the full amount on delivery."}
                </p>
            )}
        </div>
    );
}
