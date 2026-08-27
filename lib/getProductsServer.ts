import { API_URL } from "@/api/api";
import { Product } from "@/types";

// Shared server-side product fetch for pages that need the catalogue in
// their initial HTML (crawlers, SSR) — was duplicated ad hoc across
// app/products/page.tsx and app/products/[id]/not-found.tsx; campaign
// landing pages reuse this instead of a 3rd+ copy.
export async function getProductsServer(): Promise<Product[]> {
    try {
        const res = await fetch(`${API_URL}/products`, { next: { revalidate: 60 } });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}
