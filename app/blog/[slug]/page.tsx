import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { clampMeta } from "@/lib/utils";
import { api } from "@/api/api";
import type { BlogPost } from "@/types";
import BlogDetailsClient from "./BlogDetailsClient";

// Single-post endpoint instead of fetching the whole collection and filtering
// in JS, which got slower with every post published.
async function getBlogBySlug(slug: string) {
    try {
        const res = await api.get(`/blogs/slug/${slug}`);
        return (res.data as BlogPost) ?? null;
    } catch {
        return null;
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const blog = await getBlogBySlug(slug);

    if (!blog) {
        return {
            title: "Blog Post Not Found",
            description: "This blog post could not be found.",
        };
    }

    const title = blog.title;
    // Excerpts are written for the listing card and can run long; Google
    // truncates past ~155 chars.
    const description =
        clampMeta(blog.excerpt) || "Read the latest from the Lapshark blog.";
    const url = `https://lapshark.com/blog/${blog.slug}`;

    return {
        title,
        description,
        alternates: {
            canonical: url,
        },
        openGraph: {
            title,
            description,
            url,
            type: "article",
            images: blog.image ? [{ url: blog.image, width: 1200, height: 630, alt: title }] : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: blog.image ? [blog.image] : undefined,
        },
    };
}

export default async function BlogDetails({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const blog = await getBlogBySlug(slug);

    // Real 404 instead of a 200 page saying "not found", which search engines
    // treat as a soft 404 and may index.
    if (!blog) notFound();

    const url = `https://lapshark.com/blog/${blog.slug}`;
    const published = blog.date || (blog as any).createdAt;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        headline: blog.title,
                        description: blog.excerpt,
                        image: blog.image ? [blog.image] : undefined,
                        datePublished: published,
                        dateModified: (blog as any).updatedAt || published,
                        author: {
                            "@type": "Organization",
                            name: (blog as any).author || "Lapshark Team",
                            url: "https://lapshark.com",
                        },
                        publisher: {
                            "@type": "Organization",
                            name: "Lapshark",
                            logo: {
                                "@type": "ImageObject",
                                url: "https://lapshark.com/favicon.ico",
                            },
                        },
                        mainEntityOfPage: { "@type": "WebPage", "@id": url },
                    }),
                }}
            ></script>
            <BlogDetailsClient slug={slug} initialBlog={blog} />
        </>
    );
}
