import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { LayoutContent } from "./LayoutContent";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import Script from "next/script";
import { API_URL } from "@/api/api";
import { STORE_POLICIES } from "@/lib/policies";
import { SUPPORT_PHONE } from "@/lib/whatsapp";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const SITE_URL = "https://lapshark.com";
// "no-cost EMI" was asserted here 3x while HomeClient's own Bajaj Finserv
// banner says "attractive interest rates" — a real self-contradiction, not
// a confirmed 0%-interest offer, so softened to "EMI" everywhere.
const SITE_DESCRIPTION = `Buy verified refurbished and second hand laptops at unbeatable prices with doorstep delivery, COD, EMI, and a ${STORE_POLICIES.warrantyMonths}-month warranty across India.`;

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: "Lapshark | Refurbished & Second Hand Laptops in India",
        template: "%s | Lapshark",
    },
    description: SITE_DESCRIPTION,
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
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        locale: "en_IN",
    },
    twitter: {
        card: "summary_large_image",
        title: "Lapshark | Refurbished & Second Hand Laptops in India",
        description: SITE_DESCRIPTION,
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#020617",
};

// Third-party analytics — each script is entirely absent from the page
// unless an id is actually configured, so the site behaves identically
// with none of these set (no accounts yet) as it will once they're filled
// in. window.gtag/fbq/clarity are what lib/analytics.ts's trackEvent()
// checks for before dispatching to each provider.
//
// IDs come from the admin Settings page (SiteConfig.analytics, edited via
// PUT /admin/site-config) so pasting one in takes effect without a
// redeploy — `revalidate: 60` matches the backend's own publicCache
// max-age on /site-config, so a change shows up within about a minute.
// The NEXT_PUBLIC_* env vars still work as a fallback for anyone who'd
// rather set them at deploy time instead.
async function getAnalyticsConfig() {
    try {
        const res = await fetch(`${API_URL}/site-config`, { next: { revalidate: 60 } });
        if (!res.ok) return {};
        const data = await res.json();
        return data?.analytics || {};
    } catch {
        return {};
    }
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const analyticsConfig = await getAnalyticsConfig();
    const GA_MEASUREMENT_ID = analyticsConfig.gaMeasurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const META_PIXEL_ID = analyticsConfig.metaPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const CLARITY_PROJECT_ID = analyticsConfig.clarityProjectId || process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

    return (
        <html lang="en" className={cn("font-sans", geist.variable)}>
            <body className="antialiased" suppressHydrationWarning={true}>
                {GA_MEASUREMENT_ID && (
                    <>
                        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
                        <Script id="ga4-init" strategy="afterInteractive">
                            {`
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                window.gtag = gtag;
                                gtag('js', new Date());
                                // send_page_view off: LayoutContent.tsx already fires a page_view
                                // through trackEvent() on every route change, which forwards to
                                // gtag — letting gtag.js's own automatic pageview run too would
                                // double-count every navigation.
                                gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
                            `}
                        </Script>
                    </>
                )}
                {META_PIXEL_ID && (
                    <Script id="meta-pixel-init" strategy="afterInteractive">
                        {`
                            !function(f,b,e,v,n,t,s)
                            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                            n.queue=[];t=b.createElement(e);t.async=!0;
                            t.src=v;s=b.getElementsByTagName(e)[0];
                            s.parentNode.insertBefore(t,s)}(window, document,'script',
                            'https://connect.facebook.net/en_US/fbevents.js');
                            fbq('init', '${META_PIXEL_ID}');
                            fbq('track', 'PageView');
                        `}
                    </Script>
                )}
                {CLARITY_PROJECT_ID && (
                    <Script id="clarity-init" strategy="afterInteractive">
                        {`
                            (function(c,l,a,r,i,t,y){
                                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                            })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
                        `}
                    </Script>
                )}
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
                            telephone: SUPPORT_PHONE,
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
                                // Was "?category=" — that's an exact-match category filter, not a
                                // text search, so Google's sitelinks searchbox would have silently
                                // returned nothing for any real search term. "?q=" is what the
                                // actual search box (ProductsClient) reads.
                                target: `${SITE_URL}/products?q={search_term_string}`,
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
