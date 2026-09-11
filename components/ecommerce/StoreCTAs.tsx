"use client";

import { Phone, Navigation } from "lucide-react";
import { resolveSupportPhone, resolveSupportPhoneDisplay } from "@/lib/whatsapp";
import { STORE_DIRECTIONS_URL } from "@/lib/store";
import { trackEvent } from "@/lib/analytics";
import { useStore } from "@/context/StoreContext";
import { WhatsAppCTA } from "@/components/ecommerce/WhatsAppCTA";

interface StoreCTAsProps {
    location: string;
    // Server-fetched fallback (the Bangalore/store pages already call
    // getSiteConfigServer() for their own NAP display) so this doesn't
    // flash the SUPPORT_PHONE default before useStore()'s client fetch
    // resolves — see the <LayoutContent> comment in app/layout.tsx.
    initialSiteConfig?: { contact?: { phone?: string } };
}

// The "Call | WhatsApp | Directions" CTA row for GBP-driven traffic — one
// shared component so the Bangalore landing page and the store page (the two
// places this row appears) can't drift in copy, links, or which analytics
// location tag they fire.
export function StoreCTAs({ location, initialSiteConfig }: StoreCTAsProps) {
    const { siteConfig: storeSiteConfig } = useStore();
    const siteConfig = storeSiteConfig ?? initialSiteConfig;
    // Admin-saved phone (siteConfig.contact.phone) — see lib/whatsapp.ts.
    const supportPhone = resolveSupportPhone(siteConfig);
    const supportPhoneDisplay = resolveSupportPhoneDisplay(siteConfig);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
                href={`tel:${supportPhone}`}
                onClick={() => trackEvent("phone_click", { location })}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 hover:bg-teal-50 transition-colors"
            >
                <Phone className="w-4 h-4" /> Call {supportPhoneDisplay}
            </a>
            <WhatsAppCTA location={location} label="WhatsApp Lapshark" className="w-full sm:w-auto justify-center" />
            <a
                href={STORE_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("directions_click", { location })}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl border border-white/20 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
                <Navigation className="w-4 h-4" /> Get Directions
            </a>
        </div>
    );
}
