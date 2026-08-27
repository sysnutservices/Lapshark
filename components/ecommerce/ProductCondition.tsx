import { CheckCircle } from "lucide-react";

// Grade labels match the admin form's own condition dropdown exactly
// (app/admin/(dashboard)/products/page.tsx) — these are Lapshark's real
// grading tiers, just finally explained to the customer instead of shown as
// an unexplained one-word badge.
export const CONDITION_INFO: Record<string, { grade: string; description: string }> = {
    "Like New": {
        grade: "Grade A+",
        description: "Minimal to no visible signs of prior use. Screen and body are in pristine condition.",
    },
    "Excellent": {
        grade: "Grade A",
        description: "Light signs of use possible (minor surface wear), fully functional with no dents or cracks.",
    },
    "Good": {
        grade: "Grade B",
        description: "Visible signs of use — light scratches or scuffs — but fully functional and quality-checked.",
    },
    "New": {
        grade: "New",
        description: "Unused, sealed in original packaging.",
    },
};

export function ConditionExplainer({ condition }: { condition?: string }) {
    const info = condition ? CONDITION_INFO[condition] : undefined;
    if (!info) return null;
    return (
        <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4">
            <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
                <p className="text-sm font-bold text-slate-900">{condition} <span className="text-slate-400 font-medium">({info.grade})</span></p>
                <p className="text-xs md:text-sm text-slate-500 mt-0.5">{info.description}</p>
            </div>
        </div>
    );
}
