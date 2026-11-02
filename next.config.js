// GA/Meta-Pixel/Clarity (app/layout.tsx) are inline <Script> bodies, not
// just external src loads, so script-src needs 'unsafe-inline' unless a
// nonce is added (Next's nonce recipe needs a proxy.ts and forces dynamic
// rendering sitewide — a materially bigger change, not done here).
// https://*.razorpay.com covers checkout./api./lumberjack./cdn. in one
// entry (Razorpay's own published CSP guidance) — checkout.razorpay.com/v1/
// checkout.js is loaded dynamically at payment time (CheckoutContent.tsx)
// and the widget opens its own iframe + makes its own API calls; omitting
// this would silently break checkout, not just look wrong in devtools.
// Analytics hosts follow each vendor's published CSP list: Clarity's tag
// loads its real script from scripts.clarity.ms and beacons to *.clarity.ms
// (only www.clarity.ms was allowed, so Clarity never recorded anything) and
// syncs via c.bing.com;
// GA4 collects via *.google-analytics.com / *.analytics.google.com; the Meta
// Pixel sends image beacons to www.facebook.com and connect.facebook.net.
// images.unsplash.com: the homepage promo banners (site-config) use it, and
// all three rendered as broken images without it.
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://*.googletagmanager.com https://connect.facebook.net https://*.clarity.ms https://*.razorpay.com;
    connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.facebook.com https://*.clarity.ms https://*.razorpay.com;
    frame-src 'self' https://*.razorpay.com https://www.openstreetmap.org;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://ik.imagekit.io https://picsum.photos https://images.unsplash.com https://*.razorpay.com https://*.google-analytics.com https://*.googletagmanager.com https://www.facebook.com https://connect.facebook.net https://*.clarity.ms https://c.bing.com;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
`.replace(/\n/g, "");

// Old-format product slugs ("...-hd-windows-10-refurbished" style) that
// still appear in Google (Semrush India, 2 Nov 2026), past crawl logs or
// blog-post links,
// and now 404. Rule: same model still listed -> that product page (out-of-
// stock product pages still resolve); model no longer sold -> the brand's
// listing page, so a visitor lands on in-stock alternatives.
const LEGACY_PRODUCT_REDIRECTS = {
    "dell-latitude-7490-intel-core-i7-8-gen-14-hd-windows-10-refurbished":
        "/products/dell-latitude-7490-refurbished-laptop-intel-core-i7-8th-gen-14-display-windows-11",
    "hp-probook-640-g4-intel-i5-8-gen-14-hd-windows-10-refurbished": "/refurbished-hp-laptops-bangalore",
    "lenovo-thinkpad-t490-intel-core-i7-8-gen-14-hd-windows-10-refurbished":
        "/products/lenovo-thinkpad-t490-refurbished-laptop-intel-core-i5-8th-gen-14-display-windows-10",
    "lenovo-thinkpad-t480-intel-i7-8-gen-14-hd-windows-10-refurbished": "/refurbished-lenovo-laptops-bangalore",
    "dell-latitude-7389-intel-i7-7-gen-13.3-hd-windows-10-refurbished": "/refurbished-dell-laptops-bangalore",
    "dell-latitude-5400-intel-core-i7-8th-gen-14-hd-windows-10-refurbished": "/refurbished-dell-laptops-bangalore",
    "dell-5420-i5-11th-gen-refurbished-intel-core-i5-11-gen-ram-windows-11-pro":
        "/products/dell-latitude-5420-refurbished-laptop-intel-core-i5-11th-gen-14-display-windows-11",
    // Linked from blog posts (stored in the backend DB), found 2026-11-02.
    "dell-latitude-7450-intel-core-i5-5th-gen-14-hd-windows-10-refurbished":
        "/products/dell-latitude-e7450-refurbished-laptop-intel-core-i5-5th-gen-14-display-windows-10",
    "dell-latitude-5400-intel-i5-8-gen-14-hd-windows-10-refurbished": "/refurbished-dell-laptops-bangalore",
    "dell-latitude-5470-intel-core-i5-6-gen-14-hd-windows-10-refurbished": "/refurbished-dell-laptops-bangalore",
    "dell-latitude-7480-intel-i7-7-gen-14-hd-windows-10-refurbished": "/refurbished-dell-laptops-bangalore",
    "lenovo-thinkpad-t470-intel-core-i5-6th-gen-14-hd-windows-10-refurbished": "/refurbished-lenovo-laptops-bangalore",
    "lenovo-thinkpad-t470-intel-i7-6-gen-14-hd-windows-10-refurbished": "/refurbished-lenovo-laptops-bangalore",
};

// path-to-regexp treats "." specially; escape so "13.3" matches literally.
const escapeSource = (slug) => slug.replace(/\./g, "\\.");

/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            // www -> apex, every path (query strings carry over). Must be
            // first so a www request never matches a later rule and lands on
            // a www URL. Relies on the reverse proxy forwarding the original
            // Host header; if www still returns 200 after deploy, add the
            // equivalent redirect in nginx instead.
            {
                source: "/:path*",
                has: [{ type: "host", value: "www.lapshark.com" }],
                destination: "https://lapshark.com/:path*",
                statusCode: 301,
            },
            // Listed before the generic /product/:slug rule so the singular
            // form goes straight to the final page instead of two hops.
            ...Object.entries(LEGACY_PRODUCT_REDIRECTS).flatMap(([slug, destination]) => [
                { source: `/products/${escapeSource(slug)}`, destination, statusCode: 301 },
                { source: `/product/${escapeSource(slug)}`, destination, statusCode: 301 },
            ]),
            // Legacy singular /product/... URLs from the pre-migration site still get
            // traffic and currently 404, dropping any link equity they carry.
            { source: "/product/:slug", destination: "/products/:slug", permanent: true },
            { source: "/product", destination: "/products", permanent: true },
        ];
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    // frame-ancestors 'none' in the CSP is what actually stops the
                    // admin panel being iframed in modern browsers; X-Frame-Options
                    // is kept alongside for older ones — costs nothing to duplicate.
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Content-Security-Policy", value: cspHeader },
                ],
            },
        ];
    },
    images: {
        // AVIF first, WebP fallback. Measured best of the three configurations
        // tried: AVIF+q75 gave LCP 3.3s / perf 90, against 3.6s with q60 and
        // 3.5s (perf 86, TBT 220ms) on WebP-only. Smaller files did not win —
        // encode cost and decode time offset the byte savings on this host.
        formats: ["image/avif", "image/webp"],
        // AVIF encoding is CPU-expensive and this VPS runs eleven other apps.
        // A long TTL means each variant is encoded once, not on cache expiry.
        // Source URLs carry ?updatedAt=... so replacing an image still busts it.
        minimumCacheTTL: 2592000,
        remotePatterns: [
            {
                protocol: "http",
                hostname: "192.168.29.38",
                port: "5000",
                pathname: "/uploads/**",
            },
            {
                protocol: "https",
                hostname: "**.ngrok-free.app",
                pathname: "/uploads/**",
            },
            {
                protocol: "https",
                hostname: "ik.imagekit.io",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "picsum.photos",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
