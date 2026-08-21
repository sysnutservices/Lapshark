import type { MetadataRoute } from "next";
import { api } from "@/api/api";
import type { Product, BlogPost } from "@/types";

const SITE_URL = "https://lapshark.com";

// Regenerate periodically: otherwise the sitemap is frozen at build time and
// new products and posts never get submitted to search engines.
export const revalidate = 300;

async function getProducts(): Promise<Product[]> {
    try {
        const res = await api.get("/products");
        return res.data ?? [];
    } catch {
        return [];
    }
}

async function getBlogs(): Promise<BlogPost[]> {
    try {
        const res = await api.get("/blogs");
        return res.data ?? [];
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [products, blogs] = await Promise.all([getProducts(), getBlogs()]);

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
        { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
        { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.6 },
        { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${SITE_URL}/warranty`, changeFrequency: "monthly", priority: 0.4 },
        { url: `${SITE_URL}/returns`, changeFrequency: "monthly", priority: 0.4 },
        { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
        { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    ];

    const productRoutes: MetadataRoute.Sitemap = products
        .filter((p) => p.slug)
        .map((p) => ({
            url: `${SITE_URL}/products/${p.slug}`,
            // Tells crawlers when stock or pricing actually changed, so they
            // re-fetch changed pages instead of the whole catalogue.
            lastModified: (p as any).updatedAt ?? (p as any).createdAt,
            changeFrequency: "weekly",
            priority: 0.8,
        }));

    const blogRoutes: MetadataRoute.Sitemap = blogs
        .filter((b) => b.slug)
        .map((b) => ({
            url: `${SITE_URL}/blog/${b.slug}`,
            lastModified: b.updatedAt ?? b.date,
            changeFrequency: "monthly",
            priority: 0.5,
        }));

    return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
