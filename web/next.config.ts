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
  // Subida de source maps para mejor debugging
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Solo subir source maps en producción
  silent: !process.env.CI,
  
  // Ocultar source maps del cliente en producción
  hideSourceMaps: true,
  
  // Deshabilitar telemetría de Sentry
  disableLogger: true,
  
  // Configuración de Webpack
  widenClientFileUpload: true,
  
  // Transpilación automática de SDK
  transpileClientSDK: true,
  
  // Tunneling para evitar bloqueadores de anuncios
  tunnelRoute: "/monitoring",
  
  // Tree shaking para reducir bundle
  disableServerWebpackPlugin: false,
  disableClientWebpackPlugin: false,
});
