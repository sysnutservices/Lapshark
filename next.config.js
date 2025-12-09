/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "192.168.29.38",
                port: "5000",
                pathname: "/uploads/**",
            },
        ],
    },
};

export default nextConfig;
