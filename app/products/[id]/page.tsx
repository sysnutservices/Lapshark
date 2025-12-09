import { Metadata } from "next";
import { API_URL, API_URL2 } from "@/api/api";
import ProductDetailsClient from "./ProductsDetailsClient";

// Fetch product (your API – unchanged)
async function getProduct(productId: string) {
    try {
        const res = await fetch(`${API_URL}/products/${productId}`, {
            cache: "no-store",
        });

        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// ⭐ SEO: Generate Meta Tags Dynamically
export async function generateMetadata({ params }): Promise<Metadata> {
    const { id } = await params; // ⭐ FIX
    const product = await getProduct(id);

    if (!product) {
        return {
            title: "Product Not Found | Lapshark",
            description: "This product could not be found.",
        };
    }

    const title = `${product.title} | Lapshark`;
    const description =
        product.description?.slice(0, 150) ||
        "Refurbished laptop at best prices.";

    const imageUrl = API_URL2 + product.image;

    return {
        title,
        description,
        alternates: {
            canonical: `https://lapshark.com/products/${product.id}`,
        },
        openGraph: {
            title,
            type: "website", // Required by Next.js
            description,
            url: `https://lapshark.com/products/${product.id}`,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: product.title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [imageUrl],
        },
    };
}

// ⭐ Page Render (Server → Client)
export default async function ProductPage({ params }) {
    const { id } = await params; // ⭐ FIX
    return (
        <>
            {/* Breadcrumb Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            {
                                "@type": "ListItem",
                                position: 1,
                                name: "Products",
                                item: "https://lapshark.com/products",
                            },
                            {
                                "@type": "ListItem",
                                position: 2,
                                name: id,
                                item: `https://lapshark.com/products/${id}`,
                            },
                        ],
                    }),
                }}
            />

            <ProductDetailsClient productId={id} />
        </>
    );
}
