import { Product } from "@/types";

// Mirrors backend USE_CASES (lapshark_backend/src/models/Product.ts).
export const USE_CASES = [
    { value: "student", label: "Student", emoji: "🎓" },
    { value: "office", label: "Office & Business", emoji: "💼" },
    { value: "programming", label: "Programming", emoji: "👨‍💻" },
    { value: "design", label: "Design & Editing", emoji: "🎨" },
    { value: "gaming", label: "Gaming", emoji: "🎮" },
    { value: "everyday", label: "Everyday Use", emoji: "🏠" },
] as const;
export type UseCase = (typeof USE_CASES)[number]["value"];

export const PERFORMANCE_TIERS = [
    { value: "basic", label: "Basic" },
    { value: "balanced", label: "Balanced" },
    { value: "high-performance", label: "High Performance" },
] as const;
export type PerformanceTier = (typeof PERFORMANCE_TIERS)[number]["value"];

// Budget is deliberately NOT a stored product field — it's derived from
// finalPrice on the fly so it can never drift from the actual price (the
// same reasoning as STORE_POLICIES: one source of truth, not a copy to keep
// in sync). Bucket boundaries match the "Find Your Perfect Laptop" /
// "What Can I Buy For My Budget" UI copy.
export const BUDGET_RANGES = [
    { value: "under-20k", label: "Under ₹20,000", min: 0, max: 20000 },
    { value: "20k-30k", label: "₹20,000–₹30,000", min: 20000, max: 30000 },
    { value: "30k-50k", label: "₹30,000–₹50,000", min: 30000, max: 50000 },
    { value: "above-50k", label: "Above ₹50,000", min: 50000, max: Infinity },
] as const;
export type BudgetRange = (typeof BUDGET_RANGES)[number]["value"];

export function budgetRangeForPrice(price: number) {
    return BUDGET_RANGES.find((b) => price >= b.min && price < (b.max === Infinity ? Infinity : b.max))
        ?? BUDGET_RANGES[BUDGET_RANGES.length - 1];
}

// Category is the one use-case-ish signal every existing product already has
// (it predates the useCases field) — used as a fallback so recommendations
// still work for products nobody has manually tagged yet. Real useCases data
// on a product always wins when present.
const CATEGORY_FALLBACK_USE_CASES: Record<string, UseCase[]> = {
    "Business Laptops": ["office", "everyday"],
    "Gaming Laptops": ["gaming", "design"],
    "Ultrabooks": ["student", "everyday"],
    "Workstations": ["programming", "design"],
    "Student & Home": ["student", "everyday"],
    "Accessories": [],
};

// Exported so callers that need the raw use-case match (e.g. the /products
// "use=" filter, which composes it with other filters like brand/price
// rather than the stock-only filtering productsForUseCase applies) can reuse
// the same explicit-tag-with-category-fallback logic instead of duplicating it.
export function productUseCases(product: Product): UseCase[] {
    const explicit = (product as any).useCases as UseCase[] | undefined;
    if (explicit && explicit.length > 0) return explicit;
    return CATEGORY_FALLBACK_USE_CASES[product.category] || [];
}

export interface RecommendationInput {
    useCase: UseCase;
    budget: BudgetRange;
    performanceTier?: PerformanceTier;
}

// Scored, not a hard filter chain: a strict AND across use-case + budget +
// performance would too easily return zero results on a catalogue this
// small (a handful of SKUs per category). Scoring price/use-case matches
// higher and falling back to budget-only means the quiz always has
// *something* relevant to show, ranked by relevance instead of excluded.
export function recommendProducts(products: Product[], input: RecommendationInput, limit = 8): Product[] {
    const budget = BUDGET_RANGES.find((b) => b.value === input.budget) ?? BUDGET_RANGES[0];

    const scored = products
        .filter((p) => p.stock > 0 && p.category !== "Accessories" as any)
        .map((product) => {
            let score = 0;
            const inBudget = product.finalPrice >= budget.min && product.finalPrice < (budget.max === Infinity ? Infinity : budget.max);
            if (inBudget) score += 3;
            else {
                // Still usable, just penalized — closer to the band scores higher.
                const distance = product.finalPrice < budget.min
                    ? budget.min - product.finalPrice
                    : product.finalPrice - (budget.max === Infinity ? product.finalPrice : budget.max);
                score -= Math.min(3, distance / 10000);
            }

            if (productUseCases(product).includes(input.useCase)) score += 4;

            if (input.performanceTier && (product as any).performanceTier === input.performanceTier) score += 2;

            if (product.isBestDeal) score += 0.5;

            return { product, score };
        })
        .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => s.product);
}

// Powers /products?use=student style Shop-by-Need links — same relevance
// logic minus budget, since that page has no budget context yet.
export function productsForUseCase(products: Product[], useCase: UseCase): Product[] {
    return products.filter((p) => p.stock > 0 && productUseCases(p).includes(useCase));
}

// "Similar Products" for out-of-stock/related — brand + price-band + use-case
// overlap, matching Section 19's requested signals without needing a
// separate service.
export function similarProducts(products: Product[], reference: Product, limit = 4): Product[] {
    const refUseCases = productUseCases(reference);
    const refBudget = budgetRangeForPrice(reference.finalPrice);

    return products
        .filter((p) => p._id !== reference._id && p.id !== reference.id && p.stock > 0)
        .map((product) => {
            let score = 0;
            if (product.brand === reference.brand) score += 2;
            if (budgetRangeForPrice(product.finalPrice).value === refBudget.value) score += 2;
            if (product.category === reference.category) score += 2;
            score += productUseCases(product).filter((u) => refUseCases.includes(u)).length;
            if ((product as any).performanceTier && (product as any).performanceTier === (reference as any).performanceTier) score += 1;
            return { product, score };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((s) => s.product);
}
