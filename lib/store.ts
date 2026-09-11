// Single source of truth for the physical store's NAP (Name/Address/Phone)
// and location data — the address string was previously duplicated,
// independently, in app/layout.tsx (Organization schema), LayoutContent.tsx
// (footer) and ContactClient.tsx, with no shared source. Anything that needs
// LocalBusiness schema, a "Visit Store" block, or a directions link should
// import from here so the NAP can't drift between pages (drift is exactly
// what hurts local SEO).
//
// Coordinates/place id are the actual "Lapshark" Google Maps listing
// (https://www.google.com/maps/place/Lapshark/@12.9352243,77.5609329,17z/
// data=!3m1!4b1!4m6!3m5!1s0x3bae3f347dc55575:0x77cbeaf73b51c0dc), given
// directly by the business owner — supersedes an earlier, less precise
// pair pulled from a "Sysnut Technologies" map embed.
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
  latitude: 12.9352243,
  longitude: 77.5609329,
} as const;

// Real store hours — the only hours claim anywhere in the codebase
// (STORE_POLICIES.supportHoursLabel, "Mon-Sun, 10am - 8:30pm" — open all 7
// days). Structured here once for schema use; the free-text label stays the
// source of truth for display copy.
export const STORE_HOURS = [
  { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "10:00", closes: "20:30" },
] as const;

// No Google Maps API key in this project (see the "Map Placeholder" comment
// in ContactClient.tsx), so this uses the no-key `output=embed` form rather
// than a hand-built `/maps/embed?pb=...` string (that param is opaque,
// normally copy-pasted from Maps' own "Share > Embed a map" UI — hand
// assembling one risks a subtly wrong embed).
export const STORE_MAPS_EMBED_URL = `https://www.google.com/maps?q=Lapshark,${STORE_GEO.latitude},${STORE_GEO.longitude}&z=17&output=embed`;

// A real "get directions" link (Google Maps directions, not just a passive
// embed) — dir/?api=1 opens turn-by-turn directions to these coordinates in
// Google Maps, same as tapping a pin on a GBP listing.
export const STORE_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${STORE_GEO.latitude},${STORE_GEO.longitude}`;
