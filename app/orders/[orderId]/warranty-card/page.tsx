import type { Metadata } from "next";
import WarrantyCardContent from "./WarrantyCardContent";

export const metadata: Metadata = {
    title: "Warranty Card",
    description: "Your Lapshark product warranty card.",
    robots: { index: false, follow: false },
};

export default function WarrantyCardPage() {
    return <WarrantyCardContent />;
}
