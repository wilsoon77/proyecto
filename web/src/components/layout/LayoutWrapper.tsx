"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { MobileBottomBar } from "@/components/layout/MobileBottomBar"

interface LayoutWrapperProps {
  children: React.ReactNode
}

/**
 * Wrapper que decide si mostrar Navbar, Footer y MobileBottomBar
 * basándose en la ruta actual.
 * Las rutas /admin tienen su propio layout.
 */
export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  
  // No mostrar navbar/footer/bottombar en rutas de admin
  const isAdminRoute = pathname?.startsWith("/admin")
  
  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100dvh-72px)] pb-24 md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomBar />
    </>
  )
}

