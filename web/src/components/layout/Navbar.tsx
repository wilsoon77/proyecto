"use client"

import Link from "next/link"
import { Search, ShoppingCart, User, Menu, MapPin, Apple, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"
import { useState } from "react"
import { useCart } from "@/context/CartContext"

export function Navbar() {
  const { itemCount } = useCart()
  const [selectedSucursal, setSelectedSucursal] = useState("Sucursal Central")

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      {/* Top Bar - Información adicional */}
      <div className="border-b bg-gray-50">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 text-sm sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">{selectedSucursal}</span>
            <button className="text-primary hover:underline">Cambiar</button>
          </div>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="hidden md:inline">📞 +502 1234-5678</span>
            <span className="hidden lg:inline">Envío gratis desde Q100</span>
            <a href="#" aria-label="App Store (próximamente)" className="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-full border bg-white hover:border-primary hover:text-primary">
              <Apple className="h-3.5 w-3.5" />
            </a>
            <a href="#" aria-label="Google Play (próximamente)" className="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-full border bg-white hover:border-primary hover:text-primary">
              <Play className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <span className="text-3xl">🥖</span>
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-none text-gray-900">
                PanaderIA
              </span>
              <span className="text-xs text-gray-500">Smart System</span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden flex-1 md:block md:max-w-md lg:max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar productos..."
                className="h-10 w-full rounded-md border border-gray-300 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden items-center gap-6 lg:flex">
            <Link
              href={ROUTES.products}
              className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
            >
              Productos
            </Link>
            <Link
              href="/promociones"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
            >
              Promociones
            </Link>
            <Link
              href="/sobre-nosotros"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
            >
              Nosotros
            </Link>
            <Link
              href={ROUTES.contact}
              className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
            >
              Contacto
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Link href={ROUTES.cart}>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            <Link href="/login">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>

            {/* Auth Buttons - Desktop */}
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login">
                <Button variant="outline">Ingresar</Button>
              </Link>
              <Link href="/registro">
                <Button>Crear cuenta</Button>
              </Link>
            </div>

            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        <div className="pb-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar productos..."
              className="h-10 w-full rounded-md border border-gray-300 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
