import { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { similarProducts } from "@/lib/product-recommendation";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

// Used both for the PDP's "Similar Laptops" section and for out-of-stock /
// removed-product pages that need to offer a real next step instead of a
// dead end (Section 19). Same relevance logic either way — brand, price
// band, use-case, performance-tier overlap — via lib/product-recommendation.
export function SimilarProducts({
    products,
    reference,
    title = "Similar Laptops",
    limit = 4,
}: {
    products: Product[];
    reference: Product;
    title?: string;
    limit?: number;
}) {
    const results = similarProducts(products, reference, limit);
    if (results.length === 0) return null;

    return (
        <div className="border-t border-slate-100 pt-12 md:pt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 md:mb-10">{title}</h2>
            <Carousel opts={{ align: "start" }}>
                <CarouselContent>
                    {results.map((p) => (
                        <CarouselItem key={p._id || p.id} className="basis-[260px] md:basis-1/3 lg:basis-1/4">
                            <ProductCard product={p} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-4" />
                <CarouselNext className="hidden md:flex -right-4" />
            </Carousel>
        </div>
    );
}
