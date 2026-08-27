import { estimateFromPerMonth, calculateEstimatedEmi, EMI_TENURE_OPTIONS_MONTHS, EMI_PROVIDER_NAME } from "@/lib/emi";

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
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 md:p-5">
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
        </div>
    );
}
