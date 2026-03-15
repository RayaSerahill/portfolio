import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "placehold.co",
            },
        ],
    },
    compiler: {
        removeConsole: false
    },
    async headers() {
        return [
            {
                source: '/scripts/:path*',
                headers: [
                    { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
                    { key: 'Content-Disposition', value: 'inline' },
                ],
            },
        ];
    },
    async redirects() {
        return [
            {
                source: '/admin/:path*',
                destination: 'https://stats.serahill.net/dashboard/',
                permanent: true,
            },
            {
                source: '/dashboard/:path*',
                destination: 'https://stats.serahill.net/dashboard/',
                permanent: true,
            },
            {
                source: '/stats/:path*',
                destination: 'https://stats.serahill.net/:path*',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;