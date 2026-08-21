import type { Metadata } from "next";
import CartContent from "./CartContent";

export const metadata: Metadata = {
    title: "Shopping Cart",
    description: "Review the laptops in your Lapshark shopping cart.",
    robots: { index: false, follow: false },
};

export default function CartPage() {
    return <CartContent />;
}
