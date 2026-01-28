import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nyc.cloud.appwrite.io',
        pathname: '/v1/storage/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloud.appwrite.io',
        pathname: '/v1/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
};

export default nextConfig;
