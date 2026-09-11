// Single source of truth for the physical store's NAP (Name/Address/Phone)
// and location data — the address string was previously duplicated,
// independently, in app/layout.tsx (Organization schema), LayoutContent.tsx
// (footer) and ContactClient.tsx, with no shared source. Anything that needs
// LocalBusiness schema, a "Visit Store" block, or a directions link should
// import from here so the NAP can't drift between pages (drift is exactly
// what hurts local SEO).
//
// Coordinates are not invented: they're the same lat/lng already embedded in
// the existing Google Maps iframe on /contact (place id
// 0x3bae3e2a7706d87b:0x6b45566792372579, "Sysnut Technologies"). Confirm
// against the actual Google Business Profile before relying on precision
// beyond "right building."
export const STORE_ADDRESS = {
  streetAddress: "36, near Vidyapeeta Circle, Vidyapeeta Layout, Ashok Nagar, Banashankari 1st Stage",
  addressLocality: "Bengaluru",
  addressRegion: "Karnataka",
  postalCode: "560050",
  addressCountry: "IN",
} as const;

export const STORE_ADDRESS_DISPLAY = `Sysnut Technologies, ${STORE_ADDRESS.streetAddress}, ${STORE_ADDRESS.addressLocality}, ${STORE_ADDRESS.addressRegion} ${STORE_ADDRESS.postalCode}`;

// Same gap as resolveSupportPhone() in lib/whatsapp.ts: the admin editor's
// Contact tab (siteConfig.contact.address) saves fine but was never read
// back anywhere. This resolves the free-text override for DISPLAY only —
// it deliberately does NOT feed the structured PostalAddress/geo JSON-LD
// above, since a single free-text field can't be safely split back into
// street/city/region/postal parts (and the map embed/directions link are
// tied to real, verified coordinates that a text edit can't update anyway).
export function resolveStoreAddressDisplay(siteConfig?: { contact?: { address?: string } } | null): string {
  return siteConfig?.contact?.address?.trim() || STORE_ADDRESS_DISPLAY;
}

export const STORE_GEO = {
  latitude: 12.934458315693766,
  longitude: 77.55394537599723,
} as const;

// Real store hours — the only hours claim anywhere in the codebase
// (STORE_POLICIES.supportHoursLabel). Structured here once for schema use;
// the free-text label stays the source of truth for display copy.
export const STORE_HOURS = [
  { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "10:00", closes: "20:30" },
] as const;

export const STORE_MAPS_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.583907765104!2d77.55394537599723!3d12.934458315693766!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae3e2a7706d87b%3A0x6b45566792372579!2sSysnut%20Technologies!5e0!3m2!1sen!2sin!4v1709462854035!5m2!1sen!2sin";

// A real "get directions" link (Google Maps directions, not just a passive
// embed) — dir/?api=1 opens turn-by-turn directions to these coordinates in
// Google Maps, same as tapping a pin on a GBP listing.
export const STORE_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${STORE_GEO.latitude},${STORE_GEO.longitude}`;
