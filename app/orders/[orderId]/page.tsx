import type { Metadata } from "next";
import OrderDetailsContent from "./OrderDetailsContent";

export const metadata: Metadata = {
    title: "Order Details",
    description: "View the details of your Lapshark order.",
    robots: { index: false, follow: false },
};

export default function OrderDetailsPage() {
    return <OrderDetailsContent />;
}
