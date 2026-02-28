"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, User, Menu, MapPin, Apple, Play, LogOut, Settings, X, Phone, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useCart } from "@/context/CartContext"
import { useAuth } from "@/context/AuthContext"
import { branchesService } from "@/lib/api"
import type { ApiBranch } from "@/lib/api/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { itemCount } = useCart()
  const { user, isLoggedIn, logout, isLoading } = useAuth()
  const [branches, setBranches] = useState<ApiBranch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<ApiBranch | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Cargar sucursales desde la API
  useEffect(() => {
    branchesService.list()
      .then(data => {
        setBranches(data)
        // Restaurar la sucursal guardada en localStorage
        const savedSlug = typeof window !== 'undefined' ? localStorage.getItem('selectedBranch') : null
        const saved = savedSlug ? data.find(b => b.slug === savedSlug) : null
        setSelectedBranch(saved || data[0] || null)
      })
      .catch(err => console.error('Error cargando sucursales:', err))
  }, [])

  const handleBranchSelect = (branch: ApiBranch) => {
    setSelectedBranch(branch)
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBranch', branch.slug)
    }
  }

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Bloquear scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      {/* Top Bar - Información adicional */}
      <div className="border-b bg-gray-50">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 text-sm sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            {branches.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="hidden sm:inline-flex items-center gap-1 hover:text-primary transition-colors">
                  {selectedBranch?.name || 'Seleccionar sucursal'}
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {branches.map(branch => (
                    <DropdownMenuItem
                      key={branch.id}
                      onClick={() => handleBranchSelect(branch)}
                      className={selectedBranch?.id === branch.id ? 'bg-amber-50 text-amber-700' : ''}
                    >
                      <MapPin className="h-3 w-3 mr-2" />
                      {branch.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="hidden sm:inline">{selectedBranch?.name || 'Cargando...'}</span>
            )}
            <Link href="/sucursales" className="text-primary hover:underline">Ver sucursales</Link>
          </div>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="hidden md:inline">📞 {selectedBranch?.phone || '+502 0000-0000'}</span>
            <span className="hidden lg:inline">Reserva y recoge en sucursal</span>
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
        <div className="flex h-18 items-center justify-between gap-4">
          {/* Logo */}
          <Link href={ROUTES.home} className="flex items-center">
            <Image 
              src="/images/logo-pan.jpeg" 
              alt="Panaderia Logo" 
              width={147} 
              height={84}
              className="rounded-lg"
            />
          </Link>

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
            {/* Cart */}
            <Link href={ROUTES.cart}>
              <Button variant="ghost" size="icon" className="relative h-11 w-11">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-11 w-11">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.profile}>Mi perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.orders}>Mis pedidos</Link>
                  </DropdownMenuItem>
                  {(user?.role === 'ADMIN' || user?.role === 'EMPLOYEE') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="text-amber-600 font-medium">
                          <Settings className="mr-2 h-4 w-4" />
                          {user?.role === 'ADMIN' ? 'Panel Admin' : 'Panel de Trabajo'}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="icon" className="h-11 w-11">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Auth Buttons - Desktop */}
            {!isLoggedIn && (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/login">
                  <Button variant="outline">Ingresar</Button>
                </Link>
                <Link href="/registro">
                  <Button>Crear cuenta</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-11 w-11"
              aria-label="Menú"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div 
        className={`
          fixed top-0 right-0 z-[70] h-full w-[85%] max-w-sm bg-white shadow-xl
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between border-b px-4 py-4">
          <span className="text-lg font-semibold text-gray-900">Menú</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar menú"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Menu Content */}
        <div className="flex flex-col h-[calc(100%-65px)] overflow-y-auto">
          {/* User Info (if logged in) */}
          {isLoggedIn && user && (
            <div className="border-b px-4 py-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 px-2 py-3">
            <ul className="space-y-1">
              <li>
                <Link
                  href={ROUTES.products}
                  className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                >
                  Productos
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/promociones"
                  className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                >
                  Promociones
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/sobre-nosotros"
                  className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                >
                  Nosotros
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.contact}
                  className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                >
                  Contacto
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/sucursales"
                  className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                >
                  Sucursales
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </li>
            </ul>

            {/* User-specific links */}
            {isLoggedIn && (
              <>
                <div className="my-3 border-t border-gray-200" />
                <ul className="space-y-1">
                  <li>
                    <Link
                      href={ROUTES.profile}
                      className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                    >
                      Mi perfil
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={ROUTES.orders}
                      className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                    >
                      Mis pedidos
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                  </li>
                  {(user?.role === 'ADMIN' || user?.role === 'EMPLOYEE') && (
                    <li>
                      <Link
                        href="/admin"
                        className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          {user?.role === 'ADMIN' ? 'Panel Admin' : 'Panel de Trabajo'}
                        </span>
                        <ChevronRight className="h-4 w-4 text-amber-400" />
                      </Link>
                    </li>
                  )}
                </ul>
              </>
            )}
          </nav>

          {/* Bottom Section */}
          <div className="border-t px-4 py-4 space-y-3">
            {/* Phone */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{selectedBranch?.phone || '+502 0000-0000'}</span>
            </div>

            {/* Auth Buttons or Logout */}
            {isLoggedIn ? (
              <button
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full h-11">Ingresar</Button>
                </Link>
                <Link href="/registro" className="w-full">
                  <Button className="w-full h-11">Crear cuenta</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
