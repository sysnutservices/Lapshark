import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getProductsServer } from "@/lib/getProductsServer";

// Route-scoped override of the global 404 (app/not-found.tsx) — a removed
// product page is a real dead end for anyone who followed an old link (an
// Instagram post, a saved cart, a search result); "Return Home" alone drops
// them there. This still returns a real 404 status (inherited from the
// notFound() call in page.tsx that renders it), it just doesn't leave the
// visitor with nothing to do next (Section 19).
async function getFallbackProducts() {
    const products = await getProductsServer();
    return products
        .filter((p: any) => p.stock > 0)
        .sort((a: any, b: any) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0) || (b.isBestDeal ? 1 : 0) - (a.isBestDeal ? 1 : 0))
        .slice(0, 4);
}

export default async function ProductNotFound() {
    const fallbackProducts = await getFallbackProducts();

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">This laptop is no longer available</h1>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                It may have sold out or been removed from our catalogue. Here are some laptops still in stock.
            </p>

            <div className="flex items-center justify-center gap-3 mb-10 md:mb-14">
                <Link href="/products" className={cn(buttonVariants(), "h-auto rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold hover:bg-teal-700")}>
                    Browse All Laptops
                </Link>
                <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-auto rounded-xl px-6 py-3 text-sm font-bold")}>
                    Return Home
                </Link>
            </div>

            {fallbackProducts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 text-left">
                    {fallbackProducts.map((p: any) => (
                        <ProductCard key={p._id || p.id} product={p} />
                    ))}
                </div>
            )}
        </div>
    );
}
