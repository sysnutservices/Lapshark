// app/contact/page.tsx
import type { Metadata } from "next";
import { ContactClient } from "./ContactClient";
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

export default function ContactPage() {
    return (
        <main>
            <ContactClient />
        </main>
    );
}
