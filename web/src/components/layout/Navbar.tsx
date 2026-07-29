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

let branchesCache: ApiBranch[] | null = null

export function Navbar() {
  const { itemCount } = useCart()
  const { user, isLoggedIn, logout, isLoading } = useAuth()
  const [branches, setBranches] = useState<ApiBranch[]>(branchesCache || [])
  const [selectedBranch, setSelectedBranch] = useState<ApiBranch | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartBounce, setCartBounce] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (branchesCache) {
      const savedSlug = typeof window !== 'undefined' ? localStorage.getItem('selectedBranch') : null
      const saved = savedSlug ? branchesCache.find(b => b.slug === savedSlug) : null
      setSelectedBranch(saved || branchesCache[0] || null)
      return
    }
    branchesService.list()
      .then(data => {
        branchesCache = data
        setBranches(data)
        const savedSlug = typeof window !== 'undefined' ? localStorage.getItem('selectedBranch') : null
        const saved = savedSlug ? data.find(b => b.slug === savedSlug) : null
        setSelectedBranch(saved || data[0] || null)
      })
      .catch(err => console.error('Error cargando sucursales:', err))
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (itemCount > 0) {
      setCartBounce(true)
      const t = setTimeout(() => setCartBounce(false), 400)
      return () => clearTimeout(t)
    }
  }, [itemCount])

  const handleBranchSelect = (branch: ApiBranch) => {
    setSelectedBranch(branch)
    if (typeof window !== 'undefined') {
      const currentBranch = localStorage.getItem('selectedBranch')
      if (currentBranch !== branch.slug) {
        localStorage.removeItem('cart')
        localStorage.setItem('selectedBranch', branch.slug)
        window.location.reload()
      }
    }
  }

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const navLinks = [
    { href: ROUTES.products, label: "Productos" },
    { href: "/promociones", label: "Promociones" },
    { href: "/sobre-nosotros", label: "Nosotros" },
    { href: ROUTES.contact, label: "Contacto" },
  ]

  return (
    <header className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${scrolled ? 'bg-card/80 backdrop-blur-md shadow-sm' : 'bg-card'}`}>
      {/* Top Bar */}
      <div className="border-b border-border bg-cream">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 text-sm sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
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
                      className={selectedBranch?.id === branch.id ? 'bg-accent text-accent-foreground' : ''}
                    >
                      <MapPin className="h-3 w-3 mr-2 text-primary" />
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
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="hidden md:inline flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" />
              {selectedBranch?.phone || '+502 0000-0000'}
            </span>
            <span className="hidden lg:inline">Reserva y recoge en sucursal</span>
            <a href="#" aria-label="App Store (próximamente)" className="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-colors">
              <Apple className="h-3.5 w-3.5" />
            </a>
            <a href="#" aria-label="Google Play (próximamente)" className="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-colors">
              <Play className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between gap-4">
          {/* Logo */}
          <Link href={ROUTES.home} className="flex items-center transition-transform hover:scale-105">
            <Image
              src="/images/logo-panaderia.png"
              alt="Panadería Svetlana Logo"
              width={160}
              height={70}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map(link => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? 'text-primary' : 'text-foreground/70'
                  }`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-1/2 h-0.5 rounded-full bg-primary transition-all duration-300 -translate-x-1/2 ${isActive ? 'w-8' : 'w-0'}`} />
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link href={ROUTES.cart}>
              <Button variant="ghost" size="icon" className={`relative h-11 w-11 transition-transform ${cartBounce ? 'animate-cart-bounce' : ''}`}>
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
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
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.profile}>Mi perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.orders}>Mis pedidos</Link>
                  </DropdownMenuItem>
                  {(['ADMIN', 'MANAGER', 'BAKER', 'CASHIER'].includes(user?.role || '')) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="text-primary font-medium">
                          <Settings className="mr-2 h-4 w-4" />
                          {user?.role === 'ADMIN' ? 'Panel Admin' : 'Panel de Trabajo'}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive">
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
                  <Button className="shadow-warm">Crear cuenta</Button>
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 z-[70] h-full w-[85%] max-w-sm bg-card shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="font-display text-lg font-semibold text-foreground">Menú</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-65px)] overflow-y-auto">
          {/* User Info */}
          {isLoggedIn && user && (
            <div className="border-b border-border px-4 py-4 bg-cream">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nav Links */}
          <nav className="flex-1 px-2 py-3">
            <ul className="space-y-1">
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-foreground/70 hover:bg-accent hover:text-primary transition-colors"
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/sucursales"
                  className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-foreground/70 hover:bg-accent hover:text-primary transition-colors"
                >
                  Sucursales
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </Link>
              </li>
            </ul>

            {isLoggedIn && (
              <>
                <div className="my-3 border-t border-border" />
                <ul className="space-y-1">
                  <li>
                    <Link
                      href={ROUTES.profile}
                      className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-foreground/70 hover:bg-accent hover:text-primary transition-colors"
                    >
                      Mi perfil
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={ROUTES.orders}
                      className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-foreground/70 hover:bg-accent hover:text-primary transition-colors"
                    >
                      Mis pedidos
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </Link>
                  </li>
                  {(['ADMIN', 'MANAGER', 'BAKER', 'CASHIER'].includes(user?.role || '')) && (
                    <li>
                      <Link
                        href="/admin"
                        className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-primary hover:bg-accent transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          {user?.role === 'ADMIN' ? 'Panel Admin' : 'Panel de Trabajo'}
                        </span>
                        <ChevronRight className="h-4 w-4 text-primary/50" />
                      </Link>
                    </li>
                  )}
                </ul>
              </>
            )}
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-border px-4 py-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 text-primary" />
              <span>{selectedBranch?.phone || '+502 0000-0000'}</span>
            </div>

            {isLoggedIn ? (
              <button
                onClick={() => { logout(); setMobileMenuOpen(false) }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
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
                  <Button className="w-full h-11 shadow-warm">Crear cuenta</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
