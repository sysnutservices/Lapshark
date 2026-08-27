import type { Metadata } from "next";
import { STORE_POLICIES } from "@/lib/policies";
import { getProductsServer } from "@/lib/getProductsServer";
import { CampaignLandingPage } from "@/components/ecommerce/CampaignLandingPage";

export const metadata: Metadata = {
    title: "Best Laptops Under ₹20,000",
    description: `Refurbished laptops under ₹20,000 for browsing, MS Office, and online classes — quality-checked, ${STORE_POLICIES.warrantyMonths}-month warranty, ${STORE_POLICIES.returnDays}-day returns.`,
    alternates: { canonical: "https://lapshark.com/laptops-under-20000" },
};

export default async function LaptopsUnder20000Page() {
    const products = await getProductsServer();
    const matched = products.filter((p) => p.finalPrice < 20000).sort((a, b) => b.finalPrice - a.finalPrice);

    return (
        <CampaignLandingPage
            title="Best Laptops Under ₹20,000"
            subtitle="What's realistic at this price: solid basics for browsing, MS Office, and online classes."
            whyPoints={[
                "Great for browsing, MS Office, and online classes",
                "Suited to light, everyday multitasking",
                `Still backed by our ${STORE_POLICIES.warrantyLabel}`,
                "Real refurbished stock, not stripped-down new hardware",
            ]}
            products={matched}
            whatsappMessage="Hi Lapshark, I'm looking for a laptop under ₹20,000. Can you help me choose?"
        />
    );
}
