import type { Metadata } from "next";
import { STORE_POLICIES } from "@/lib/policies";
import { getProductsServer } from "@/lib/getProductsServer";
import { CampaignLandingPage } from "@/components/ecommerce/CampaignLandingPage";

export const metadata: Metadata = {
    title: "Best Laptops Under ₹30,000",
    description: `Refurbished laptops under ₹30,000 for college, everyday office work, and entry-level coding — quality-checked, ${STORE_POLICIES.warrantyMonths}-month warranty, ${STORE_POLICIES.returnDays}-day returns.`,
    alternates: { canonical: "https://lapshark.com/laptops-under-30000" },
};

export default async function LaptopsUnder30000Page() {
    const products = await getProductsServer();
    const matched = products.filter((p) => p.finalPrice < 30000).sort((a, b) => b.finalPrice - a.finalPrice);

    return (
        <CampaignLandingPage
            title="Best Laptops Under ₹30,000"
            subtitle="College and everyday office work, multiple browser tabs, video calls, and entry-level coding."
            whyPoints={[
                "Handles multitasking across office apps and browser tabs comfortably",
                "Good fit for video calls and entry-level coding",
                `Backed by our ${STORE_POLICIES.warrantyLabel}`,
                "Business-grade builds most new laptops at this price can't match",
            ]}
            products={matched}
            whatsappMessage="Hi Lapshark, I'm looking for a laptop under ₹30,000. Can you help me choose?"
        />
    );
}
