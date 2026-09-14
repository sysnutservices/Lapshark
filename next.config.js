// GA/Meta-Pixel/Clarity (app/layout.tsx) are inline <Script> bodies, not
// just external src loads, so script-src needs 'unsafe-inline' unless a
// nonce is added (Next's nonce recipe needs a proxy.ts and forces dynamic
// rendering sitewide — a materially bigger change, not done here).
// https://*.razorpay.com covers checkout./api./lumberjack./cdn. in one
// entry (Razorpay's own published CSP guidance) — checkout.razorpay.com/v1/
// checkout.js is loaded dynamically at payment time (CheckoutContent.tsx)
// and the widget opens its own iframe + makes its own API calls; omitting
// this would silently break checkout, not just look wrong in devtools.
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://www.clarity.ms https://*.razorpay.com;
    connect-src 'self' https://www.google-analytics.com https://www.facebook.com https://*.razorpay.com;
    frame-src 'self' https://*.razorpay.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://ik.imagekit.io https://picsum.photos https://*.razorpay.com;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
`.replace(/\n/g, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Legacy singular /product/... URLs from the pre-migration site still get
    // traffic and currently 404, dropping any link equity they carry.
    async redirects() {
        return [
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
