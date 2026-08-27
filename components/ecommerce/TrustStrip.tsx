import { ShieldCheck, RotateCcw, Truck, Lock, BadgeCheck } from "lucide-react";
import { STORE_POLICIES } from "@/lib/policies";

// Compact 5-bullet strip for right below the hero — distinct from TrustStats
// (the big animated-number band further down the page): this is a quick,
// icon-led scan, not a headline stat.
const ITEMS = [
    { icon: BadgeCheck, label: `${STORE_POLICIES.qualityCheckLabel}` },
    { icon: ShieldCheck, label: STORE_POLICIES.warrantyLabel },
    { icon: RotateCcw, label: STORE_POLICIES.returnLabel },
    { icon: Truck, label: "Doorstep Delivery" },
    { icon: Lock, label: "Secure Payments" },
];

export function TrustStrip({ className = "" }: { className?: string }) {
    return (
        <div className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:gap-x-10 ${className}`}>
            {ITEMS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-slate-700">
                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-teal-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm font-bold">{label}</span>
                </div>
            ))}
        </div>
    );
}
