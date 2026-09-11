// app/contact/page.tsx
import type { Metadata } from "next";
import { ContactClient } from "./ContactClient";
import { getSiteConfigServer } from "@/lib/getSiteConfigServer";
export const metadata: Metadata = {
    title: "Contact Us | Lapshark",
    description: "Get in touch with support, inquiries, warranty claims, or general questions.",
    openGraph: {
        title: "Contact Us | Lapshark",
        description: "Reach out to us for any questions or support.",
        url: "https://lapshark.com/contact",
        type: "website",
    },
    alternates: {
        canonical: "https://lapshark.com/contact",
    },
};

export default async function ContactPage() {
    // Server-fetched fallback so the phone/email/address shown on first
    // paint aren't the hardcoded defaults — see the same pattern on
    // <LayoutContent> in app/layout.tsx.
    const siteConfig = await getSiteConfigServer();

    return (
        <main>
            <ContactClient initialSiteConfig={siteConfig ?? undefined} />
        </main>
    );
}
