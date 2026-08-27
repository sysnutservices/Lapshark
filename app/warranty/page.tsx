import type { Metadata } from "next";
import WarrantyContent from "./WarrantyContent";
import { STORE_POLICIES } from "@/lib/policies";

export const metadata: Metadata = {
    title: "Warranty Policy",
    description: `Comprehensive ${STORE_POLICIES.warrantyMonths}-month warranty coverage for your refurbished device from Lapshark.`,
    alternates: {
        canonical: "https://lapshark.com/warranty",
    },
};

// Answers below are taken from copy visible on this page — Google requires FAQ
// markup to match on-page content, and LLMs quote the answer text directly.
const faqs = [
    {
        q: "What is not covered by the Lapshark warranty?",
        a: "The warranty does not cover third-party accessories not from Lapshark, software (OS, applications, drivers), consumable parts such as batteries unless completely dead, superficial damage like scratches and dents, damage from external causes (liquid, fire, drops), unauthorised repairs or modifications, removed or defaced serial numbers, and stolen products or those locked by passcodes.",
    },
    {
        q: "Is the laptop battery covered under warranty?",
        a: "Battery warranty will be claimed only if the battery is completely dead or non-functional. Batteries are treated as consumable parts and are not covered for reduced capacity or normal wear.",
    },
    {
        q: "How do I obtain warranty service from Lapshark?",
        a: "First, contact support via the Contact Us page with proof of purchase. We then attempt remote diagnosis and resolve issues within 24-48 hours through troubleshooting. If that fails, an onsite engineer visits within 5-6 working days for serviceable locations. Finally we repair the device at our facility, or replace it with an equivalent value unit if it cannot be repaired.",
    },
    {
        q: "Who pays for shipping during warranty service?",
        a: "If warranty service is required for a covered defect, Lapshark covers shipping costs. If the claim is ineligible, you may be responsible for shipping. Please ensure proper packaging when returning a device, as we are not liable for damage caused by improper packaging in transit.",
    },
    // Payment/COD/refund FAQs moved to app/returns/page.tsx — this page's
    // schema must match what's actually visible on this page (Google
    // requires that), and that content no longer lives here.
];

export default function WarrantyPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: faqs.map((f) => ({
                            "@type": "Question",
                            name: f.q,
                            acceptedAnswer: { "@type": "Answer", text: f.a },
                        })),
                    }),
                }}
            ></script>
            <WarrantyContent />
        </>
    );
}
