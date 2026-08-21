import type { MetadataRoute } from "next";

const SITE_URL = "https://lapshark.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/admin",
                "/cart",
                "/checkout",
                "/account",
                "/addresses",
                "/wishlist",
                "/compare",
                "/orders",
                "/order-success",
            ],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
