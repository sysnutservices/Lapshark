import { Check, X } from "lucide-react";

// Illustrative only — deliberately not tied to a specific new-laptop model or
// live pricing (no data source for that exists in this codebase), so it's
// labeled as a representative example rather than a verified claim.
export function ValueComparison() {
    return (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 md:p-10 shadow-sm">
            <div className="text-center mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-slate-900">₹30,000 Budget — A Representative Example</h3>
                <p className="text-sm text-slate-500 mt-1">Illustrative comparison of what that budget typically buys new vs. refurbished.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 p-6">
                    <h4 className="font-bold text-slate-500 mb-4">Buying New</h4>
                    <ul className="space-y-3 text-sm text-slate-600">
                        {["Entry-level processor", "Basic RAM, often not upgradeable", "Lower-tier build quality"].map((t) => (
                            <li key={t} className="flex items-start gap-2.5"><X className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" /> {t}</li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-2xl border-2 border-teal-500 bg-teal-50/40 p-6">
                    <h4 className="font-bold text-teal-700 mb-4">Buying Refurbished from Lapshark</h4>
                    <ul className="space-y-3 text-sm text-slate-700">
                        {["A business-class laptop model", "Typically a stronger processor for the price", "Often upgradeable RAM/storage", "Premium original build quality"].map((t) => (
                            <li key={t} className="flex items-start gap-2.5"><Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" /> {t}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
