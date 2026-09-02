import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
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

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

import { SITE_URL } from "@/lib/constants";

const siteUrl = SITE_URL;

export const viewport: Viewport = {
  themeColor: "#FAF5EE",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Bakery", "FoodEstablishment", "LocalBusiness"],
  "@id": `${siteUrl}/#organization`,
  name: "Panadería Svetlana",
  alternateName: "Svetlana Panadería Artesanal",
  url: siteUrl,
  logo: `${siteUrl}/images/logo-panaderia.png`,
  image: [
    `${siteUrl}/images/hero-concha-pedestal.jpg`,
    `${siteUrl}/images/logo-panaderia.png`
  ],
  description: "Pan fresco, pan dulce tradicional y productos horneados artesanales horneados a diario en Chimaltenango, Guatemala.",
  servesCuisine: ["Guatemalan", "Bakery", "Artisanal Bread"],
  priceRange: "Q",
  currenciesAccepted: "GTQ",
  paymentAccepted: "Cash",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Aldea Buena Vista, Zona 8, Sector Sur",
    addressLocality: "Chimaltenango",
    addressRegion: "Chimaltenango",
    addressCountry: "GT",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "14.664106",
    longitude: "-90.845432",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "05:00",
      closes: "20:30",
    },
  ],
  hasMap: "https://maps.google.com/?q=14.664106,-90.845432",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Panadería Svetlana | Pan fresco en Guatemala",
  description: "Pan fresco, pan dulce tradicional y productos horneados artesanales de Panadería Svetlana en Chimaltenango, Guatemala.",
  keywords: [
    "panadería",
    "Guatemala",
    "Chimaltenango",
    "pan fresco",
    "pan dulce",
    "pan artesanal",
    "conchas",
    "champurradas",
    "pan francés",
    "productos horneados",
  ],
  applicationName: "Panadería Svetlana",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "es_GT",
    alternateLocale: ["es_ES", "es_419"],
    url: siteUrl,
    siteName: "Panadería Svetlana",
    title: "Panadería Svetlana | Pan fresco en Guatemala",
    description: "Pan fresco, pan dulce tradicional y productos horneados artesanales en Chimaltenango, Guatemala.",
    images: [
      {
        url: `${siteUrl}/images/hero-concha-pedestal.jpg`,
        width: 1200,
        height: 630,
        alt: "Panadería Svetlana - Pan artesanal recién horneado en Guatemala",
        type: "image/jpeg",
      },
      {
        url: `${siteUrl}/images/logo-panaderia.png`,
        width: 600,
        height: 315,
        alt: "Logotipo oficial Panadería Svetlana",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@panaderiasvetlana",
    creator: "@panaderiasvetlana",
    title: "Panadería Svetlana | Pan fresco en Guatemala",
    description: "Pan fresco, pan dulce tradicional y productos horneados artesanales en Chimaltenango, Guatemala.",
    images: [`${siteUrl}/images/hero-concha-pedestal.jpg`],
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
    <html lang="es-GT" className={`${plusJakartaSans.variable} ${playfairDisplay.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body className="antialiased font-sans bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
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
