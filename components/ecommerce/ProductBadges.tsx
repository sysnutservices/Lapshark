import { Badge } from "@/components/ui/badge";
import { USE_CASES } from "@/lib/product-recommendation";

const USE_CASE_LABEL: Record<string, string> = Object.fromEntries(
    USE_CASES.map((u) => [u.value, u.label])
);

// Human-readable label for a free-form marketing tag (see Product.tags).
// "best-for-students" style slugs -> "Best For Students".
function formatTag(tag: string): string {
    return tag
        .split("-")
        .map((w) => (w === "for" ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(" ");
}

// "Best for" line — one place that reads useCases/tags so ProductCard, the
// PDP, and Shop-by-Need never hand-roll this label differently.
export function BestForLine({ useCases, className = "" }: { useCases?: string[]; className?: string }) {
    if (!useCases || useCases.length === 0) return null;
    const labels = useCases.map((u) => USE_CASE_LABEL[u] || u);
    return (
        <p className={`text-xs md:text-sm text-slate-500 ${className}`}>
            <span className="font-bold text-slate-700">Best for:</span> {labels.join(" • ")}
        </p>
    );
}

export function ProductTagBadges({ tags, className = "" }: { tags?: string[]; className?: string }) {
    if (!tags || tags.length === 0) return null;
    return (
        <div className={`flex flex-wrap gap-1.5 ${className}`}>
            {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-full border-teal-200 bg-teal-50 px-2 py-0.5 text-[9px] md:text-[10px] font-bold text-teal-700 hover:bg-teal-50">
                    {formatTag(tag)}
                </Badge>
            ))}
        </div>
    );
}
