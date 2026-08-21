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
