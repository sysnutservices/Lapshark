import Link from "next/link";
import ShopClient from "../../ProductsClient";
import { notFound } from "next/navigation";

// lib/shopEndpointMap.ts
export const SHOP_ENDPOINT_MAP = {
    bengaluru: {
        category: "Bengaluru",
        city: "Bengaluru",
        keywords: [
            "refurbished laptops in bengaluru",
            "used laptops bengaluru",
            "second hand laptops bengaluru",
            "dell hp refurbished laptops",
            "lapshark refurbished laptops",
        ],
        h1: "Refurbished Laptops in Bengaluru",
        description:
            "Buy certified refurbished laptops in Bengaluru from LapShark. Dell, HP, Lenovo laptops under ₹25,000 with warranty & COD.",
    },

    "under-25000": {
        category: "Under 25000",
        keywords: [
            "refurbished laptops under 25000",
            "used laptops under 25000",
            "cheap refurbished laptops",
            "budget laptops india",
            "lapshark laptops under 25000",
        ],
        h1: "Refurbished Laptops Under ₹25,000",
        description:
            "Shop refurbished laptops under ₹25,000. Best budget Dell & HP laptops with warranty and free delivery across India.",
    },

    dell: {
        category: "Dell",
        keywords: [
            "refurbished dell laptops",
            "used dell laptops",
            "dell latitude refurbished",
            "business laptops dell",
            "lapshark dell laptops",
        ],
        h1: "Refurbished Dell Laptops",
        description:
            "Buy refurbished Dell Latitude laptops with warranty. Perfect for office, students & professionals.",
    },
} as const;


export type ShopEndpointKey = keyof typeof SHOP_ENDPOINT_MAP;

export function generateMetadata({
    params,
}: {
    params: { endpoint: string };
}) {
    const config =
        SHOP_ENDPOINT_MAP[params.endpoint as ShopEndpointKey];

    if (!config) return {};

    return {
        title: `${config.category} Refurbished Laptops | LapShark`,
        description: `Buy ${config.category.toLowerCase()} refurbished laptops with warranty & COD.`,
    };
}

export default function Shop({ params }) {
    const config =
        SHOP_ENDPOINT_MAP[params.endpoint as ShopEndpointKey];

    if (!config) notFound();

    return (
        <>
            <h1 className="text-3xl font-bold">{config.h1}</h1>

            <p className="mt-4 text-slate-600">
                {config.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-teal-600">
                <Link href="/shop/under-25000">
                    Refurbished laptops under ₹25,000
                </Link>

                <Link href="/shop/dell">
                    Refurbished Dell laptops
                </Link>

                <Link href="/shop/hp">
                    Refurbished HP laptops
                </Link>
            </div>

            {/* SEO keyword block (hidden from users, visible to Google) */}
            <div className="sr-only">
                {config.keywords.map((k) => (
                    <span key={k}>{k}. </span>
                ))}
            </div>

            <ShopClient initialCategory={config.category} initialPriceRange={30000} />
        </>
    );
}
