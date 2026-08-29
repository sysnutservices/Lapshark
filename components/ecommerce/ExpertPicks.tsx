import { Trophy, Wallet, Code2, GraduationCap } from "lucide-react";
import { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { productsForUseCase } from "@/lib/product-recommendation";

interface Pick {
    icon: typeof Trophy;
    label: string;
    reason: string;
    product: Product;
}

// Each pick is computed from real, currently in-stock inventory — never a
// hardcoded product id, so a sold-out or removed product can never linger
// here (Phase 13: "Do not manually hardcode misleading recommendations").
function buildPicks(products: Product[]): Pick[] {
    const inStock = products.filter((p) => p.stock > 0);
    const picks: Pick[] = [];
    const used = new Set<string>();
    const key = (p: Product) => String(p._id || p.id);

    // Best Overall — highest genuine rating (real reviews only, never the
    // fake-5.0-with-0-reviews case since that field is 0 until a review
    // exists — see the review-empty-state fix).
    const bestOverall = [...inStock].filter((p) => p.reviews > 0).sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)[0]
        ?? [...inStock].sort((a, b) => (b.isBestDeal ? 1 : 0) - (a.isBestDeal ? 1 : 0))[0];
    if (bestOverall) {
        picks.push({ icon: Trophy, label: "Best Overall", reason: "Highest-rated laptop in stock right now.", product: bestOverall });
        used.add(key(bestOverall));
    }

    // Best Value — biggest real discount off list price, excluding whatever
    // was just picked as Best Overall so the section doesn't repeat itself.
    const bestValue = [...inStock].filter((p) => !used.has(key(p))).sort((a, b) => b.discountPercent - a.discountPercent)[0];
    if (bestValue) {
        picks.push({ icon: Wallet, label: "Best Value", reason: `${Math.round(bestValue.discountPercent)}% off list price — the deepest current discount.`, product: bestValue });
        used.add(key(bestValue));
    }

    const programming = productsForUseCase(inStock, "programming").find((p) => !used.has(key(p)));
    if (programming) {
        picks.push({ icon: Code2, label: "Best for Programming", reason: "Tagged for programming — enough RAM/CPU for IDEs, builds, and multitasking.", product: programming });
        used.add(key(programming));
    }

    const student = productsForUseCase(inStock, "student").find((p) => !used.has(key(p)));
    if (student) {
        picks.push({ icon: GraduationCap, label: "Best for Students", reason: "Tagged for student use — light, reliable, and easy on the budget.", product: student });
        used.add(key(student));
    }

    return picks;
}

export function ExpertPicks({ products }: { products: Product[] }) {
    const picks = buildPicks(products);
    if (picks.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {picks.map(({ icon: Icon, label, reason, product }) => (
                <div key={label} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{label}</span>
                    </div>
                    <ProductCard product={product} />
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{reason}</p>
                </div>
            ))}
        </div>
    );
}
