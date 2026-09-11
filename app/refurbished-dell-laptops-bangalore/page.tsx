import type { Metadata } from "next";
import { STORE_POLICIES } from "@/lib/policies";
import { getProductsServer } from "@/lib/getProductsServer";
import { CampaignLandingPage } from "@/components/ecommerce/CampaignLandingPage";

export const metadata: Metadata = {
    title: "Refurbished Dell Laptops in Bangalore",
    description: `Quality-checked refurbished Dell laptops — Latitude, Inspiron, and Vostro — in Bangalore with a ${STORE_POLICIES.warrantyMonths}-month warranty and ${STORE_POLICIES.returnDays}-day returns. Store pickup available in Banashankari.`,
    alternates: { canonical: "https://lapshark.com/refurbished-dell-laptops-bangalore" },
};

export default async function RefurbishedDellLaptopsBangalorePage() {
    const products = await getProductsServer();
    const matched = products.filter((p) => p.brand?.toLowerCase() === "dell");

    return (
        <CampaignLandingPage
            title="Refurbished Dell Laptops in Bangalore"
            subtitle="Quality-checked Dell Latitude, Inspiron, and Vostro laptops — available for store pickup in Banashankari or doorstep delivery across Bangalore."
            whyPoints={[
                `Every unit passes our ${STORE_POLICIES.qualityCheckPoints}-point quality check`,
                `Backed by our ${STORE_POLICIES.warrantyLabel}`,
                "Pick up in-store in Banashankari or get it delivered",
                `${STORE_POLICIES.returnLabel} if it's not the right fit`,
            ]}
            products={matched}
            whatsappMessage="Hi Lapshark, I'm looking for a refurbished Dell laptop in Bangalore. Can you help me choose?"
        />
    );
}
