// app/page.tsx
import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import HeroSection from "./HeroSection";
import { api } from "@/api/api";
import { STORE_POLICIES } from "@/lib/policies";

export const metadata: Metadata = {
    // Verified (2026-09-11 build): Next's title.template from the root
    // layout does NOT apply to app/page.tsx itself (the "/" page is the
    // same route segment as the root layout, not a descendant of it) — so
    // unlike every other page in this app, this title must carry the brand
    // itself, or it renders with no brand at all. Confirmed by testing:
    // stripping "| Lapshark" here produced a bare title with no suffix.
    title: "Refurbished & Second Hand Laptops Online | Lapshark",
    description: `Buy refurbished and second hand laptops online in India. Quality-checked Dell, HP and Lenovo business models with a ${STORE_POLICIES.warrantyMonths}-month warranty, COD and doorstep delivery.`,
};

export default async function HomePage() {
    const [res, productsRes] = await Promise.all([
        api.get("/site-config").catch(() => ({ data: null })),
        api.get("/products").catch(() => ({ data: [] })),
    ]);
    const siteConfig = res.data;
    const hero = siteConfig?.hero;

    return (
        <main>
            <div className="space-y-8 bg-slate-50/50">
                <HeroSection hero={hero} />
                <HomeClient
                    initialProducts={productsRes.data ?? []}
                    initialSiteConfig={siteConfig}
                />
            </div>
        </main>
    );
}
