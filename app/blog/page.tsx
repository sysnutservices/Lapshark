import type { Metadata } from "next";
import { api } from "@/api/api";
import Blogs from "./BlogCient";

// Without this the listing is prerendered at build time and new posts never
// appear until the next deploy.
export const revalidate = 300;

// Server-fetched so posts appear in the initial HTML for crawlers that don't
// execute JS.
async function getBlogs() {
    try {
        const res = await api.get("/blogs");
        return res.data ?? [];
    } catch {
        return [];
    }
}

export const metadata: Metadata = {
    title: "Blog",
    description:
        "Tips, guides, and news on refurbished laptops, buying advice, and tech maintenance from Lapshark.",
    alternates: {
        canonical: "https://lapshark.com/blog",
    },
};

export default async function BlogDetails() {
    const blogs = await getBlogs();
    return <Blogs initialBlogs={blogs} />;
}