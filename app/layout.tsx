import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { LayoutContent } from "./LayoutContent";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const SITE_URL = "https://lapshark.com";

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: "Lapshark | Refurbished & Second Hand Laptops in India",
        template: "%s | Lapshark",
    },
    description:
        "Buy verified refurbished and second hand laptops at unbeatable prices with doorstep delivery, COD, no-cost EMI, and 6-month warranty across India.",
    keywords: [
        "refurbished laptops",
        "second hand laptop",
        "second hand laptops India",
        "used laptop",
        "buy used laptops",
        "laptop service",
        "Lapshark",
    ],
    authors: [{ name: "Lapshark (Sysnut Technologies)" }],
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
        },
    },
    alternates: {
        canonical: SITE_URL,
    },
    icons: {
        icon: "/favicon.ico",
    },
    openGraph: {
        type: "website",
        siteName: "Lapshark",
        title: "Lapshark | Refurbished & Second Hand Laptops in India",
        description:
            "Buy verified refurbished and second hand laptops at unbeatable prices with doorstep delivery, COD, no-cost EMI, and 6-month warranty across India.",
        url: SITE_URL,
        locale: "en_IN",
    },
    twitter: {
        card: "summary_large_image",
        title: "Lapshark | Refurbished & Second Hand Laptops in India",
        description:
            "Buy verified refurbished and second hand laptops at unbeatable prices with doorstep delivery, COD, no-cost EMI, and 6-month warranty across India.",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#020617",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={cn("font-sans", geist.variable)}>
            <body className="antialiased" suppressHydrationWarning={true}>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            name: "Lapshark",
                            legalName: "Sysnut Technologies",
                            url: SITE_URL,
                            logo: `${SITE_URL}/favicon.ico`,
                            telephone: "+91-8971319555",
                            address: {
                                "@type": "PostalAddress",
                                streetAddress:
                                    "36, near Vidyapeeta Circle, Vidyapeeta Layout, Ashok Nagar, Banashankari 1st Stage",
                                addressLocality: "Bengaluru",
                                addressRegion: "Karnataka",
                                postalCode: "560050",
                                addressCountry: "IN",
                            },
                        }),
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            name: "Lapshark",
                            url: SITE_URL,
                            potentialAction: {
                                "@type": "SearchAction",
                                target: `${SITE_URL}/products?category={search_term_string}`,
                                "query-input": "required name=search_term_string",
                            },
                        }),
                    }}
                />
                <Providers>
                    <LayoutContent>{children}</LayoutContent>
                </Providers>
            </body>
        </html>
    );
}
