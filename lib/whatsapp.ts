// Centralizes the support phone number and wa.me link building — previously
// "+918971319555" was hardcoded in 6+ files (Navbar, ContactClient,
// HomeClient, LayoutContent, OrderDetailsContent) with no shared source, and
// the one wired click-to-chat button (Navbar mobile menu) opened wa.me with
// no message at all.
export const SUPPORT_PHONE = "+918971319555";
export const SUPPORT_PHONE_DISPLAY = "+91 897 131 9555";
// wa.me wants digits only, no leading +.
const WA_NUMBER = SUPPORT_PHONE.replace(/\D/g, "");

// The admin editor's Contact tab (siteConfig.contact.phone) writes to the
// database fine, but nothing ever read it back — every tel: link and the
// footer/contact-page display used this file's hardcoded constant
// regardless. Callers that have a siteConfig (from useStore() client-side,
// or a server-side site-config fetch) should resolve through this instead
// of using SUPPORT_PHONE directly, so an admin-saved number actually shows
// up. Falls back to the verified default when siteConfig hasn't loaded yet
// or the field is blank — same defensive pattern as every other
// site-config consumer in this codebase.
// tel: href value — dialable, no display formatting needed.
export function resolveSupportPhone(siteConfig?: { contact?: { phone?: string } } | null): string {
  return siteConfig?.contact?.phone?.trim() || SUPPORT_PHONE;
}

// Display text — SUPPORT_PHONE_DISPLAY is hand-formatted ("+91 897 131
// 9555"), so the default case keeps that instead of falling back to the
// unformatted tel: value. An admin override is shown exactly as typed
// (same reasoning as the address field: free text, not reformatted).
export function resolveSupportPhoneDisplay(siteConfig?: { contact?: { phone?: string } } | null): string {
  return siteConfig?.contact?.phone?.trim() || SUPPORT_PHONE_DISPLAY;
}

export function buildWhatsAppLink(message?: string): string {
  const base = `https://wa.me/${WA_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function openWhatsApp(message?: string) {
  window.open(buildWhatsAppLink(message), "_blank");
}

// Product-context message for PDP/comparison/recommendation WhatsApp CTAs —
// one place so every entry point sends the same shape of context instead of
// each component composing its own text.
export function buildProductWhatsAppMessage(product: {
  title: string;
  finalPrice?: number;
  slug?: string;
}, extra?: string): string {
  const url = product.slug ? `https://lapshark.com/products/${product.slug}` : "";
  const lines = [
    "Hi Lapshark, I'm interested in:",
    "",
    product.title,
    product.finalPrice ? `Price: ₹${product.finalPrice.toLocaleString("en-IN")}` : "",
    url ? `URL: ${url}` : "",
    extra ? "" : "I need help choosing a laptop.",
    extra || "",
  ].filter(Boolean);
  return lines.join("\n");
}
