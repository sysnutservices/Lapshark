import type { Metadata } from "next";
import CheckoutContent from "./CheckoutContent";

export const metadata: Metadata = {
    title: "Checkout",
    description: "Complete your purchase securely on Lapshark.",
    robots: { index: false, follow: false },
};

export default function CheckoutPage() {
    return <CheckoutContent />;
}
