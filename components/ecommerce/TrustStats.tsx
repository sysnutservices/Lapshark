"use client";

import { AnimatedCounter } from "@/components/AnimatedCounter";
import { STORE_POLICIES } from "@/lib/policies";

// The 4 headline numbers, sourced from the single policy config so this band
// can never drift from what /warranty and /returns actually say. Numeric
// stats get the count-up decoration (AnimatedCounter now always renders the
// real value at rest — see its own fix); "COD Available" isn't a number, so
// it renders as plain text instead of a fake "100%" stat.
const STATS = [
    { value: STORE_POLICIES.warrantyMonths, suffix: "-Month", label: "Official Warranty" },
    { value: STORE_POLICIES.qualityCheckPoints, suffix: "+", label: "Point Quality Check" },
    { value: STORE_POLICIES.returnDays, suffix: "-Day", label: "Easy Returns" },
] as const;

export function TrustStats({ className = "" }: { className?: string }) {
    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-800 ${className}`}>
            {STATS.map((stat) => (
                <div key={stat.label}>
                    <AnimatedCounter
                        value={stat.value}
                        suffix={stat.suffix}
                        className="block text-3xl md:text-5xl font-extrabold tracking-tight text-teal-400"
                    />
                    <p className="mt-2 text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wide">
                        {stat.label}
                    </p>
                </div>
            ))}
            {STORE_POLICIES.codAvailable && (
                <div>
                    <span className="block text-3xl md:text-5xl font-extrabold tracking-tight text-teal-400">COD</span>
                    <p className="mt-2 text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wide">Available</p>
                </div>
            )}
        </div>
    );
}
