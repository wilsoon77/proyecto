import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { SystemConfigProvider } from "@/context/SystemConfigContext";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { QueryProvider } from "@/components/providers/query-provider";

import { NotificationProvider } from "@/context/NotificationContext";
import CookieConsent from "@/components/ui/CookieConsent";
import { Analytics } from "@vercel/analytics/react";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: "Panadería Svetlana",
  url: siteUrl,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Panadería Svetlana | Pan fresco en Guatemala",
  description: "Pan fresco, pasteles y productos artesanales de Panadería Svetlana en Guatemala.",
  keywords: ["panadería", "Guatemala", "pan", "pasteles", "productos artesanales"],
  applicationName: "Panadería Svetlana",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_GT",
    url: "/",
    siteName: "Panadería Svetlana",
    title: "Panadería Svetlana | Pan fresco en Guatemala",
    description: "Pan fresco, pasteles y productos artesanales en Guatemala.",
    images: [{ url: "/images/Panaderia_Svetlana_logo.jpeg", alt: "Panadería Svetlana" }],
  },
  twitter: {
    card: "summary",
    title: "Panadería Svetlana | Pan fresco en Guatemala",
    description: "Pan fresco, pasteles y productos artesanales en Guatemala.",
    images: ["/images/Panaderia_Svetlana_logo.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/images/icon-panaderia.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/images/icon-panaderia.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-GT" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body className="antialiased font-sans">
        <QueryProvider>
          <ToastProvider>
            <SystemConfigProvider>
              <AuthProvider>
                <NotificationProvider>
                  <CartProvider>
                    <LayoutWrapper>
                      {children}
                    </LayoutWrapper>
                    <CookieConsent />
                  </CartProvider>
                </NotificationProvider>
              </AuthProvider>
            </SystemConfigProvider>
          </ToastProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
