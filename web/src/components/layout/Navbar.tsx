"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  MapPin,
  Menu,
  Phone,
  Settings,
  ShoppingBag,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react"
import { ROUTES } from "@/lib/constants"
import { useCart } from "@/context/CartContext"
import { useAuth } from "@/context/AuthContext"
import { useSystemConfig } from "@/context/SystemConfigContext"
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

const navLinks = [
  { label: "Inicio", href: ROUTES.home },
  { label: "Productos", href: ROUTES.products },
  { label: "Nosotros", href: ROUTES.about },
  { label: "Contacto", href: ROUTES.contact },
]

function isCurrentPath(pathname: string | null, href: string) {
  if (href === ROUTES.home) return pathname === href
  return pathname?.startsWith(href) ?? false
}

export function Navbar() {
  const { itemCount } = useCart()
  const { user, isLoggedIn, logout } = useAuth()
  const { canPurchase } = useSystemConfig()
  const pathname = usePathname()
  const [branches, setBranches] = useState<ApiBranch[]>(branchesCache || [])
  const [selectedBranch, setSelectedBranch] = useState<ApiBranch | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const applyBranch = (data: ApiBranch[]) => {
      const savedSlug = typeof window !== "undefined" ? localStorage.getItem("selectedBranch") : null
      const saved = savedSlug ? data.find((branch) => branch.slug === savedSlug) : null
      setSelectedBranch(saved || data[0] || null)
    }

    if (branchesCache) {
      applyBranch(branchesCache)
      return
    }

    branchesService
      .list()
      .then((data) => {
        branchesCache = data
        setBranches(data)
        applyBranch(data)
      })
      .catch((error) => console.error("Error cargando sucursales:", error))
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  const handleBranchSelect = (branch: ApiBranch) => {
    setSelectedBranch(branch)
    if (typeof window === "undefined") return

    const currentBranch = localStorage.getItem("selectedBranch")
    if (currentBranch === branch.slug) return

    localStorage.removeItem("cart")
    localStorage.setItem("selectedBranch", branch.slug)
    window.location.reload()
  }

  const hasStaffAccess = ["ADMIN", "MANAGER", "BAKER"].includes(user?.role || "")

  return (
    <>
      <header
        style={{ backgroundColor: '#ffffff' }}
        className="sticky top-0 z-40 w-full border-b border-[#E8DCCB] bg-white shadow-[0_2px_12px_-4px_rgba(40,20,10,0.06)]"
      >
        <div className="public-container">
          <div className="flex h-[64px] sm:h-[72px] items-center justify-between gap-1.5 sm:gap-3">
            <Link
              href={ROUTES.home}
              aria-label="Panadería Svetlana, inicio"
              className="public-focus relative block h-9 w-[108px] min-[360px]:h-10 min-[360px]:w-[120px] min-[400px]:h-11 min-[400px]:w-[140px] sm:h-14 sm:w-[184px] shrink-0"
            >
              <Image
                src="/images/logo-panaderia.svg"
                alt="Panadería Svetlana"
                fill
                priority
                sizes="(max-width: 640px) 120px, 184px"
                className="object-contain object-left"
              />
            </Link>

            <nav aria-label="Navegación principal" className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => {
                const active = isCurrentPath(pathname, link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`public-focus rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className="flex items-center">
                {branches.length > 1 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="public-focus inline-flex h-9 sm:h-10 items-center gap-1 sm:gap-1.5 rounded-full border border-border bg-card px-2 sm:px-3 text-[11px] sm:text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
                        aria-label="Elegir sucursal de retiro"
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                        <span className="max-w-[62px] min-[360px]:max-w-[76px] min-[400px]:max-w-[110px] sm:max-w-[160px] md:max-w-[200px] truncate">
                          {selectedBranch?.name || "Sucursal"}
                        </span>
                        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-1.5 shadow-lg">
                      <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Elige tu sucursal de retiro
                      </div>
                      {branches.map((branch) => {
                        const isSelected = selectedBranch?.id === branch.id
                        return (
                          <DropdownMenuItem
                            key={branch.id}
                            onClick={() => handleBranchSelect(branch)}
                            className={`flex items-start justify-between gap-2 rounded-lg p-2 text-xs cursor-pointer ${
                              isSelected ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-secondary"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                              <div>
                                <p className="font-semibold">{branch.name}</p>
                                {branch.address && (
                                  <p className="text-[10px] font-normal text-muted-foreground line-clamp-1">{branch.address}</p>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                                Activa
                              </span>
                            )}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full border border-border bg-card px-2 sm:px-3 text-[11px] sm:text-xs font-semibold text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span className="max-w-[70px] sm:max-w-[120px] truncate">{selectedBranch?.name || "Sucursal"}</span>
                  </div>
                )}
              </div>

              {canPurchase && (
                <Link
                  href={ROUTES.cart}
                  aria-label={`Carrito${itemCount ? `, ${itemCount} productos` : ""}`}
                  className="public-focus relative inline-flex h-9 w-9 sm:h-10 sm:w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-transparent text-foreground transition-colors hover:border-border hover:bg-secondary"
                >
                  <ShoppingCart className="h-[18px] w-[18px] sm:h-[19px] sm:w-[19px]" aria-hidden="true" />
                  {itemCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 sm:right-0.5 sm:top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Link>
              )}

              {isLoggedIn ? (
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="public-focus inline-flex h-10 sm:h-11 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                        aria-label="Menú de usuario"
                      >
                        <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span className="max-w-[110px] truncate">{user?.firstName || "Mi cuenta"}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-xs font-medium text-muted-foreground">Sesión iniciada como</p>
                        <p className="text-sm font-semibold truncate text-foreground">{user?.firstName} {user?.lastName}</p>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href={ROUTES.profile} className="flex items-center">
                          <UserRound className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />
                          Mi perfil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={ROUTES.orders} className="flex items-center">
                          <ShoppingBag className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />
                          Mis pedidos
                        </Link>
                      </DropdownMenuItem>
                      {hasStaffAccess && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="flex items-center font-medium text-primary">
                              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                              Panel de trabajo
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                        Cerrar sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    href={ROUTES.login}
                    className="public-focus rounded-full px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    Ingresar
                  </Link>
                  <Link
                    href={ROUTES.register}
                    className="touch-tactile public-focus rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  >
                    Crear cuenta
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="public-focus inline-flex h-9 w-9 sm:h-10 sm:w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary lg:hidden"
                aria-label="Abrir menú"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <aside
        aria-label="Menú móvil"
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(88vw,390px)] flex-col border-l border-border bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-border px-4 bg-white">
          <Link href={ROUTES.home} onClick={() => setMobileMenuOpen(false)} className="relative h-11 w-36 overflow-hidden rounded-lg">
            <Image src="/images/logo-panaderia.svg" alt="Panadería Svetlana" fill sizes="144px" className="object-contain" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="public-focus inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground hover:bg-secondary"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {isLoggedIn && user && (
          <div className="border-b border-border bg-secondary/45 px-5 py-4">
            <p className="text-sm font-semibold text-foreground">Hola, {user.firstName}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-5 bg-white">
          <nav aria-label="Navegación móvil">
            <p className="section-kicker mb-3 px-3">Descubre la panadería</p>
            <div className="space-y-1">
              {navLinks.map((link) => {
                const active = isCurrentPath(pathname, link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`public-focus flex items-center justify-between rounded-xl px-3 py-3.5 text-base font-semibold transition-colors ${
                      active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                    }`}
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )
              })}
              <Link href={ROUTES.branches} onClick={() => setMobileMenuOpen(false)} className="public-focus flex items-center justify-between rounded-xl px-3 py-3.5 text-base font-semibold text-muted-foreground hover:bg-secondary/70 hover:text-foreground">
                Sucursales
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </nav>

          <div className="my-5 border-t border-border" />

          <div className="rounded-2xl border border-[#E8DCCB] bg-[#FAF5EE] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#D97706]" aria-hidden="true" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#8C522B]">Sucursal de retiro</p>
              </div>
              <span className="text-[10px] font-medium text-[#8C522B]">Cambiar</span>
            </div>

            <div className="space-y-2">
              {branches.map((branch) => {
                const isSelected = selectedBranch?.id === branch.id
                return (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => {
                      handleBranchSelect(branch)
                      setMobileMenuOpen(false)
                    }}
                    className={`public-focus flex w-full items-start justify-between rounded-xl p-3 text-left transition-all ${
                      isSelected
                        ? "border-2 border-[#D97706] bg-white shadow-xs"
                        : "border border-[#DECDBB] bg-white/70 hover:bg-white text-[#2B170F]"
                    }`}
                  >
                    <div className="pr-2">
                      <p className={`text-xs font-bold ${isSelected ? "text-[#D97706]" : "text-[#2B170F]"}`}>
                        {branch.name}
                      </p>
                      {branch.address && (
                        <p className="mt-0.5 text-[11px] text-[#6E5545] line-clamp-1">{branch.address}</p>
                      )}
                    </div>
                    {isSelected ? (
                      <span className="shrink-0 rounded-full bg-[#D97706] px-2 py-0.5 text-[10px] font-bold text-white">
                        Activa
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] font-semibold text-[#8C522B]">
                        Elegir
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {isLoggedIn && (
            <div className="mt-6 space-y-1">
              <Link href={ROUTES.profile} onClick={() => setMobileMenuOpen(false)} className="public-focus flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground">
                Mi perfil
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={ROUTES.orders} onClick={() => setMobileMenuOpen(false)} className="public-focus flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground">
                Mis pedidos
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              {hasStaffAccess && (
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="public-focus flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-primary hover:bg-secondary">
                  <span className="inline-flex items-center gap-2"><Settings className="h-4 w-4" aria-hidden="true" />Panel de trabajo</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border p-4 pb-5 bg-white">
          {isLoggedIn ? (
            <button type="button" onClick={() => { logout(); setMobileMenuOpen(false) }} className="public-focus flex h-12 w-full items-center justify-center gap-2 rounded-full border border-destructive/30 text-sm font-semibold text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link href={ROUTES.login} onClick={() => setMobileMenuOpen(false)} className="public-focus inline-flex h-12 items-center justify-center rounded-full border border-border text-sm font-semibold text-foreground hover:bg-secondary">
                Ingresar
              </Link>
              <Link href={ROUTES.register} onClick={() => setMobileMenuOpen(false)} className="public-focus inline-flex h-12 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
