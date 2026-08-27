import type { Metadata } from "next";
import ShopClient from "./ProductsClient";
import { STORE_POLICIES } from "@/lib/policies";
import { getProductsServer } from "@/lib/getProductsServer";

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

    const products = await getProductsServer();

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
