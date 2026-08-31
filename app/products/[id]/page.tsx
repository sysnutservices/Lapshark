import { Metadata } from "next";
import { notFound } from "next/navigation";
import { API_URL } from "@/api/api";
import { STORE_POLICIES } from "@/lib/policies";
import ProductDetailsClient from "./ProductsDetailsClient";
import { calculateProductPrice } from "@/lib/pricing";

// Markdown -> plain text for meta descriptions.
function plainText(md?: string) {
    return (md || "")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")   // images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> label
        .replace(/[*_`#>~]/g, "")                // emphasis, headings, code
        .replace(/\s+/g, " ")
        .trim();
}

// Cut at a word boundary so meta descriptions don't end mid-word.
function clamp(s: string, max: number) {
    if (s.length <= max) return s;
    const cut = s.slice(0, max - 1);
    return cut.slice(0, cut.lastIndexOf(" ")).trimEnd() + "…";
}

// Fetch product (your API – unchanged)
async function getProduct(productSlug: string) {
    try {
        const res = await fetch(`${API_URL}/products/slug/${productSlug}`, {
            next: { revalidate: 60 },
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

    // Root layout already appends " | Lapshark" via its title template, so the
    // brand must NOT be repeated here. Product titles are long spec strings;
    // the first "|" segment is the model + condition, which keeps us near the
    // ~60 char limit Google renders.
    const title = product.title.split("|")[0].trim().slice(0, 60);

    // Descriptions are authored in Markdown; strip it so meta tags don't leak
    // raw ** and # into search results.
    const description =
        clamp(plainText(product.description), 155) ||
        "Refurbished laptop at best prices.";

    const imageUrl = product.image;
    // OG/Twitter titles don't go through the layout's title template, so they
    // carry the brand themselves.
    const socialTitle = `${title} | Lapshark`;

    return {
        title,
        description,
        alternates: {
            canonical: `https://lapshark.com/products/${product.slug}`,
        },
        openGraph: {
            title: socialTitle,
            type: "website", // Required by Next.js
            description,
            url: `https://lapshark.com/products/${product.slug}`,
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
            title: socialTitle,
            description,
            images: [imageUrl],
        },
    };
}

// ⭐ Page Render (Server → Client)
export default async function ProductPage({ params }) {
    const { id } = await params; // ⭐ FIX
    const product = await getProduct(id);

    if (!product) {
        notFound();
    }

    return (
        <>
            {/* Product schema. Server-rendered on purpose — see the note in
                ProductsDetailsClient: emitting this from the client component
                broke client-side navigation into product pages. */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org/",
                        "@type": "Product",
                        name: product.title,
                        image: [product.image, ...(product.images || [])].filter(Boolean),
                        description: product.description,
                        sku: product.productId,
                        brand: { "@type": "Brand", name: product.brand || "Lapshark" },
                        // Real aggregate from Review docs (reviewController's
                        // recalculateProductRating writes rating/reviews on the
                        // product itself) — omitted entirely when there are no
                        // reviews yet rather than asserting a rating of 0.
                        ...(product.reviews > 0 && {
                            aggregateRating: {
                                "@type": "AggregateRating",
                                ratingValue: product.rating,
                                reviewCount: product.reviews,
                            },
                        }),
                        offers: {
                            "@type": "Offer",
                            url: `https://lapshark.com/products/${product.slug}`,
                            priceCurrency: "INR",
                            // Reflects an active Extra Product Offer — Google's own
                            // guidance is that `price` should be the actual current
                            // price, not a pre-discount one.
                            price: calculateProductPrice(product.finalPrice, product.extraOffer).finalPrice,
                            // Date.UTC, not a local-time Date: toISOString() would
                            // shift an IST date back a day and emit Dec 30.
                            priceValidUntil: new Date(
                                Date.UTC(new Date().getUTCFullYear() + 1, 11, 31)
                            )
                                .toISOString()
                                .slice(0, 10),
                            availability:
                                product.stock > 0
                                    ? "https://schema.org/InStock"
                                    : "https://schema.org/OutOfStock",
                            // "New" listings (the rare brand-new accessory) get the
                            // real NewCondition value instead of an inaccurate
                            // "Refurbished" claim — everything else on the site is
                            // genuinely refurbished stock.
                            itemCondition:
                                product.condition === "New"
                                    ? "https://schema.org/NewCondition"
                                    : "https://schema.org/RefurbishedCondition",
                            // Mirrors the published /returns policy via STORE_POLICIES —
                            // was hardcoded to 14 here independent of the policy config.
                            hasMerchantReturnPolicy: {
                                "@type": "MerchantReturnPolicy",
                                applicableCountry: "IN",
                                returnPolicyCategory:
                                    "https://schema.org/MerchantReturnFiniteReturnWindow",
                                merchantReturnDays: STORE_POLICIES.returnDays,
                                returnMethod: "https://schema.org/ReturnByMail",
                                returnFees: "https://schema.org/FreeReturn",
                                merchantReturnLink: "https://lapshark.com/returns",
                            },
                            shippingDetails: {
                                "@type": "OfferShippingDetails",
                                shippingDestination: {
                                    "@type": "DefinedRegion",
                                    addressCountry: "IN",
                                },
                            },
                        },
                    }),
                }}
            ></script>

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
                                name: product.title,
                                item: `https://lapshark.com/products/${id}`,
                            },
                        ],
                    }),
                }}
            />

            <ProductDetailsClient productSlug={id} initialProduct={product} />
        </>
    );
}
