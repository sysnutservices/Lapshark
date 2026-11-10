import type { Metadata } from "next";
import QuoteContent from "./QuoteContent";

export const metadata: Metadata = {
    title: "Your Lapshark quotation",
    description: "A price-locked quotation from a Lapshark Sales Ambassador.",
    robots: { index: false, follow: false },
};

export default function QuotePage() {
    return <QuoteContent />;
}
