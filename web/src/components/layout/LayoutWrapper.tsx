"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

interface LayoutWrapperProps {
  children: React.ReactNode
}

/**
 * Wrapper que decide si mostrar Navbar y Footer
 * basándose en la ruta actual.
 * Las rutas /admin tienen su propio layout sin navbar/footer.
 */
export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  
  // No mostrar navbar/footer en rutas de admin
  const isAdminRoute = pathname?.startsWith("/admin")
  
  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  )
}
