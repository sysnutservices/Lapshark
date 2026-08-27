import { Check, Minus } from "lucide-react";
import { STORE_POLICIES } from "@/lib/policies";

// "Typical Marketplace Seller" — deliberately generic, not naming any real
// competitor, and the "Lapshark" column only claims what STORE_POLICIES /
// this codebase's real features actually back up.
const ROWS: { feature: string; lapshark: boolean; typical: boolean }[] = [
    { feature: `${STORE_POLICIES.qualityCheckPoints}+ Point Quality Check`, lapshark: true, typical: false },
    { feature: "Battery Checked Before Listing", lapshark: true, typical: false },
    { feature: STORE_POLICIES.warrantyLabel, lapshark: true, typical: false },
    { feature: STORE_POLICIES.returnLabel, lapshark: true, typical: false },
    { feature: "Cleaned & Sanitized", lapshark: true, typical: false },
    { feature: "Secure Online Payment", lapshark: true, typical: true },
    { feature: "Dedicated Support", lapshark: true, typical: false },
];

export function TrustComparison() {
    return (
        <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full min-w-[480px] text-sm">
                <thead>
                    <tr className="border-b border-slate-100">
                        <th className="text-left p-4 md:p-5 font-bold text-slate-500">Feature</th>
                        <th className="p-4 md:p-5 font-extrabold text-teal-600">Lapshark</th>
                        <th className="p-4 md:p-5 font-bold text-slate-400">Typical Marketplace Seller</th>
                    </tr>
                </thead>
                <tbody>
                    {ROWS.map((row) => (
                        <tr key={row.feature} className="border-b border-slate-50 last:border-0">
                            <td className="p-4 md:p-5 font-medium text-slate-700">{row.feature}</td>
                            <td className="p-4 md:p-5 text-center">
                                {row.lapshark
                                    ? <Check className="w-5 h-5 text-teal-600 mx-auto" />
                                    : <Minus className="w-4 h-4 text-slate-300 mx-auto" />}
                            </td>
                            <td className="p-4 md:p-5 text-center">
                                {row.typical
                                    ? <Check className="w-5 h-5 text-slate-400 mx-auto" />
                                    : <Minus className="w-4 h-4 text-slate-300 mx-auto" />}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
