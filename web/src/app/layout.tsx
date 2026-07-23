import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { SystemConfigProvider } from "@/context/SystemConfigContext";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { QueryProvider } from "@/components/providers/query-provider";

import { NotificationProvider } from "@/context/NotificationContext";
import CookieConsent from "@/components/ui/CookieConsent";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: "Panadería Svetlana",
  url: siteUrl,
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  },
  twitter: {
    card: "summary",
    title: "Panadería Svetlana | Pan fresco en Guatemala",
    description: "Pan fresco, pasteles y productos artesanales en Guatemala.",
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
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-GT">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
      </body>
    </html>
  );
}
