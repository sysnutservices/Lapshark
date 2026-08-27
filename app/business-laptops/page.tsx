import type { Metadata } from "next";
import { STORE_POLICIES } from "@/lib/policies";
import { getProductsServer } from "@/lib/getProductsServer";
import { CampaignLandingPage } from "@/components/ecommerce/CampaignLandingPage";
import { Category } from "@/types";

export const metadata: Metadata = {
    title: "Business Laptops — Dell Latitude, Lenovo ThinkPad, HP ProBook",
    description: `Ex-corporate business laptops (Dell Latitude, Lenovo ThinkPad, HP ProBook), quality-checked, ${STORE_POLICIES.warrantyMonths}-month warranty, ${STORE_POLICIES.returnDays}-day returns.`,
    alternates: { canonical: "https://lapshark.com/business-laptops" },
};

export default async function BusinessLaptopsPage() {
    const products = await getProductsServer();
    const matched = products.filter((p) => p.category === Category.BUSINESS);

    return (
        <CampaignLandingPage
            title="Business Laptops"
            subtitle="Ex-corporate Dell Latitude, Lenovo ThinkPad, and HP ProBook stock — built for daily office use."
            whyPoints={[
                "Business-grade build quality, not consumer-grade plastic",
                "Reliable for daily office work and multitasking",
                `Backed by our ${STORE_POLICIES.warrantyLabel}`,
                "A fraction of the price of an equivalent new business laptop",
            ]}
            products={matched}
            whatsappMessage="Hi Lapshark, I'm looking for a business laptop. Can you help me choose?"
        />
    );
}
