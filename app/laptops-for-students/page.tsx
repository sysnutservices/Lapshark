import type { Metadata } from "next";
import { STORE_POLICIES } from "@/lib/policies";
import { getProductsServer } from "@/lib/getProductsServer";
import { productsForUseCase } from "@/lib/product-recommendation";
import { CampaignLandingPage } from "@/components/ecommerce/CampaignLandingPage";

export const metadata: Metadata = {
    title: "Best Laptops for Students in India",
    description: `Lightweight, reliable refurbished laptops for college and school — quality-checked, ${STORE_POLICIES.warrantyMonths}-month warranty, ${STORE_POLICIES.returnDays}-day returns.`,
    alternates: { canonical: "https://lapshark.com/laptops-for-students" },
};

export default async function LaptopsForStudentsPage() {
    const products = await getProductsServer();
    const matched = productsForUseCase(products, "student");

    return (
        <CampaignLandingPage
            title="Best Laptops for Students"
            subtitle="Light, reliable, and easy on the budget — picked for classes, assignments, and everyday use."
            whyPoints={[
                "Long battery life for a full day on campus",
                "Light enough to carry between classes",
                `Backed by our ${STORE_POLICIES.warrantyLabel}`,
                "Priced for a student budget, not a corporate one",
            ]}
            products={matched}
            whatsappMessage="Hi Lapshark, I'm a student looking for a laptop. Can you help me choose?"
        />
    );
}
