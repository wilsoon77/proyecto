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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Panaderia Svetlana - Sistema Inteligente de Gestión",
  description: "Sistema de gestión para panaderías en Guatemala. Pan fresco, calidad garantizada.",
  keywords: ["panadería", "Guatemala", "pan", "pasteles", "delivery"],
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-GT">
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
