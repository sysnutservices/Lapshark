// app/page.tsx
import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import HeroSection from "./HeroSection";
import { api } from "@/api/api";

export const metadata: Metadata = {
    title: "Refurbished & Second Hand Laptops Online | Lapshark",
    description:
        "Buy refurbished and second hand laptops online in India. Quality-checked Dell, HP and Lenovo business models with a 6-month warranty, COD and doorstep delivery.",
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
