import type { Metadata } from "next";
import { STORE_POLICIES } from "@/lib/policies";
import { getProductsServer } from "@/lib/getProductsServer";
import { productsForUseCase } from "@/lib/product-recommendation";
import { CampaignLandingPage } from "@/components/ecommerce/CampaignLandingPage";

export const metadata: Metadata = {
    title: "Best Laptops for Programming & Development",
    description: `Refurbished business-grade laptops for coding, IDEs, and local dev environments — quality-checked, ${STORE_POLICIES.warrantyMonths}-month warranty, ${STORE_POLICIES.returnDays}-day returns.`,
    alternates: { canonical: "https://lapshark.com/laptops-for-programming" },
};

export default async function LaptopsForProgrammingPage() {
    const products = await getProductsServer();
    const matched = productsForUseCase(products, "programming");

    return (
        <CampaignLandingPage
            title="Best Laptops for Programming"
            subtitle="Business-grade builds with enough RAM and CPU headroom for IDEs, builds, and multitasking."
            whyPoints={[
                "Business-class processors built for sustained workloads",
                "Upgradeable RAM/storage on most models",
                `Backed by our ${STORE_POLICIES.warrantyLabel}`,
                "A fraction of the price of an equivalent new laptop",
            ]}
            products={matched}
            whatsappMessage="Hi Lapshark, I'm looking for a laptop for programming/development. Can you help me choose?"
        />
    );
}
