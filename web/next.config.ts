import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
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

export default withSentryConfig(nextConfig, {
  // Configuración de organización y proyecto
  org: process.env.SENTRY_ORG || "wilson-exe",
  project: process.env.SENTRY_PROJECT || "javascript-nextjs",
  
  // Solo subir source maps en CI
  silent: !process.env.CI,
  
  // Source maps - eliminar después de subir
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  
  // Tunneling para evitar bloqueadores de anuncios
  tunnelRoute: "/monitoring",
  
  // Optimizaciones de bundle
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
  },
});
