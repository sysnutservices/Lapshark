import type { Metadata } from "next";
import { API_URL } from "@/api/api";
import ShopClient from "./ProductsClient";
import { STORE_POLICIES } from "@/lib/policies";

// Fetched server-side so the catalogue is in the initial HTML: crawlers that
// don't run JS (GPTBot, ClaudeBot, PerplexityBot) otherwise see an empty grid.
async function getProducts() {
    try {
        const res = await fetch(`${API_URL}/products`, { next: { revalidate: 60 } });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

// "Second hand laptop" outsearches "refurbished laptop" in India (49.5k vs
// 40.5k/mo) at lower difficulty, and this page is the target for both terms.
export const metadata: Metadata = {
    title: "Refurbished & Second Hand Laptops in India",
    description: `Buy refurbished and second hand laptops online in India — Dell, HP and Lenovo business models, quality-checked, with a ${STORE_POLICIES.warrantyMonths}-month warranty and ${STORE_POLICIES.returnDays}-day returns.`,
    alternates: {
        canonical: "https://lapshark.com/products",
    },
};

export default async function Shop({
    searchParams,
}: {
    searchParams: Promise<{
        category?: string;
        priceRange?: number;
        q?: string;
        use?: string;
    }>;
}) {
    // ✅ MUST await in Next.js 15
    const params = await searchParams;

    const categoryParam = params.category ?? "All";
    const priceRangeParam = params.priceRange ? Number(params.priceRange) : 300000;

    const products = await getProducts();

    return (
        <ShopClient
            initialCategory={categoryParam}
            initialPriceRange={priceRangeParam}
            initialSearch={params.q ?? ""}
            initialUseCase={params.use ?? ""}
            initialProducts={products}
        />
    );
}
