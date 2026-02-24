import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

export default withSentryConfig(nextConfig, {
  // Configuración de organización y proyecto
  org: "wilson-exe",
  project: "javascript-nextjs",
  
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
