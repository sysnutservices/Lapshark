import { Badge } from "@/components/ui/badge";
import { Product } from "@/types";
import { USE_CASES, productUseCases } from "@/lib/product-recommendation";

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
//
// Takes the product (not a raw useCases array): every real product in the
// catalogue currently has an empty useCases field (never editorially
// tagged), which made this line disappear everywhere even though
// productUseCases()'s category fallback already resolves a real, honest
// answer for every product (e.g. "Business Laptops" -> office/everyday) —
// the same fallback the recommendation engine and Shop-by-Need filtering
// already rely on. Reading the raw field directly here bypassed that and
// showed nothing. An explicit admin-entered tag still always wins.
export function BestForLine({ product, className = "" }: { product: Pick<Product, "useCases" | "category">; className?: string }) {
    const useCases = productUseCases(product as Product);
    if (useCases.length === 0) return null;
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
