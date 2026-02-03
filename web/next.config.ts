import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Appwrite Cloud - varios datacenters
      {
        protocol: 'https',
        hostname: 'nyc.cloud.appwrite.io',
        pathname: '/v1/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'fra.cloud.appwrite.io',
        pathname: '/v1/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'sgp.cloud.appwrite.io',
        pathname: '/v1/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
        pathname: '/v1/storage/**',
      },
      // Wildcard para cualquier subdominio de appwrite.io
      {
        protocol: 'https',
        hostname: '*.cloud.appwrite.io',
        pathname: '/v1/storage/**',
      },
      // Unsplash para imágenes de prueba
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
