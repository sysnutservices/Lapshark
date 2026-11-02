import { getProductsServer } from "@/lib/getProductsServer";
import { calculateProductPrice } from "@/lib/pricing";
import { plainText } from "@/lib/plainText";
import { Category, type Product } from "@/types";

// Google Merchant Center product feed (RSS 2.0 + g: namespace), fetched on a
// schedule by Merchant Center account 5388958547. Built from the same live
// product API as the site, so stock and prices can't drift from what the
// product pages (and their Product JSON-LD) show — Merchant Center
// disapproves items whose feed price doesn't match the landing page.
//
// Only in-stock laptops are listed: a scheduled feed replaces the previous
// fetch, so a unit that sells out simply drops out of Google on the next run.
const SITE_URL = "https://lapshark.com";

// Rendered per request (Merchant Center fetches about once a day, so there's
// no load to speak of). Not ISR: if the product API is down we must answer
// with an error — see GET — and never have an empty feed prerendered or
// cached, because Merchant Center treats an empty scheduled feed as "delete
// every product".
export const dynamic = "force-dynamic";

// Google product taxonomy 328 = Electronics > Computers > Laptops.
const GOOGLE_PRODUCT_CATEGORY = "328";

// The admin stores brands inconsistently ("DELL", "HP", "Lenovo"); Google
// matches brand names, so send the manufacturer's own spelling.
const BRAND_NAMES: Record<string, string> = {
    dell: "Dell",
    hp: "HP",
    lenovo: "Lenovo",
    apple: "Apple",
    acer: "Acer",
    asus: "ASUS",
    microsoft: "Microsoft",
};
const brandName = (brand?: string) => {
    const b = (brand || "").trim();
    return BRAND_NAMES[b.toLowerCase()] ?? b;
};

const xmlEscape = (s: string) =>
    s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

const tag = (name: string, value: string | number | undefined | null) =>
    value === undefined || value === null || value === "" ? "" : `<${name}>${xmlEscape(String(value))}</${name}>`;

function productDetails(p: Product) {
    const specs: [string, string | undefined][] = [
        ["Processor", p.specs?.processor],
        ["RAM", p.specs?.ram],
        ["Storage", p.specs?.storage],
        ["Display", p.specs?.display],
        ["Graphics", p.specs?.graphics],
        ["Operating system", p.specs?.os],
    ];
    return specs
        .filter(([, v]) => v && v.trim())
        .map(
            ([name, v]) =>
                `<g:product_detail>${tag("g:section_name", "Specifications")}${tag("g:attribute_name", name)}${tag("g:attribute_value", v!.trim())}</g:product_detail>`,
        )
        .join("");
}

function item(p: Product) {
    // Same price the product page and its JSON-LD show: finalPrice with any
    // active Extra Product Offer applied. `price` (the new-unit MRP) is
    // deliberately NOT sent as a strikethrough "was" price.
    const price = calculateProductPrice(p.finalPrice, p.extraOffer).finalPrice;
    const additionalImages = (p.images || []).filter((src) => src && src !== p.image).slice(0, 10);

    return [
        "<item>",
        tag("g:id", p.productId),
        tag("g:title", p.title.slice(0, 150)),
        tag("g:description", plainText(p.description).slice(0, 5000) || p.title),
        tag("g:link", `${SITE_URL}/products/${p.slug}`),
        tag("g:image_link", p.image),
        ...additionalImages.map((src) => tag("g:additional_image_link", src)),
        tag("g:availability", "in_stock"),
        tag("g:price", `${price.toFixed(2)} INR`),
        // Everything on the site is refurbished stock except the occasional
        // listing explicitly marked "New" (same rule as the Product JSON-LD).
        tag("g:condition", p.condition === "New" ? "new" : "refurbished"),
        tag("g:brand", brandName(p.brand)),
        // Refurbished units are sold without a GTIN/MPN of our own.
        tag("g:identifier_exists", "no"),
        tag("g:google_product_category", GOOGLE_PRODUCT_CATEGORY),
        tag("g:product_type", `Refurbished Laptops > ${p.category}`),
        p.weightKg ? tag("g:shipping_weight", `${p.weightKg} kg`) : "",
        productDetails(p),
        "</item>",
    ].join("");
}

export async function GET() {
    // getProductsServer() returns [] on any API failure. The catalogue is
    // never legitimately empty, so treat that as an outage: a failed fetch
    // makes Merchant Center keep the previous products, an empty 200 would
    // remove them all.
    const products = await getProductsServer();
    if (products.length === 0) {
        return new Response("Product catalogue unavailable", {
            status: 503,
            headers: { "Retry-After": "3600" },
        });
    }

    const items = products
        .filter((p) => p.stock > 0 && p.slug && p.image && p.finalPrice > 0 && p.category !== Category.ACCESSORIES)
        .map(item)
        .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Lapshark refurbished laptops</title>
<link>${SITE_URL}</link>
<description>In-stock refurbished laptops from Lapshark, Bengaluru</description>
${items}
</channel>
</rss>
`;

    return new Response(xml, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
}
