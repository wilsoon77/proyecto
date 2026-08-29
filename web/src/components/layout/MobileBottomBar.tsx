"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, ShoppingBag, ShoppingCart, UserRound } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useAuth } from "@/context/AuthContext"
import { useSystemConfig } from "@/context/SystemConfigContext"
import { ROUTES } from "@/lib/constants"

export function MobileBottomBar() {
  const pathname = usePathname()
  const { itemCount } = useCart()
  const { isLoggedIn } = useAuth()
  const { canPurchase } = useSystemConfig()

  const shouldHide = [ROUTES.login, ROUTES.register, "/forgot-password", "/reset-password"].some((route) => pathname?.startsWith(route))
  if (pathname?.startsWith("/admin") || pathname === ROUTES.checkout || shouldHide) return null

  const accountRoute = isLoggedIn ? ROUTES.profile : ROUTES.login
  const navItems = [
    { label: "Inicio", href: ROUTES.home, icon: House, active: pathname === ROUTES.home },
    { label: "Productos", href: ROUTES.products, icon: ShoppingBag, active: pathname?.startsWith(ROUTES.products) },
    ...(canPurchase ? [{ label: "Carrito", href: ROUTES.cart, icon: ShoppingCart, active: pathname === ROUTES.cart, badge: itemCount }] : []),
    { label: isLoggedIn ? "Cuenta" : "Ingresar", href: accountRoute, icon: UserRound, active: pathname === ROUTES.profile || pathname === ROUTES.login || pathname === ROUTES.register },
  ]

  return (
    <nav aria-label="Navegación móvil inferior" className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/95 backdrop-blur-md pb-safe md:hidden shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.04)]">
      <div className="mx-auto grid h-[72px] max-w-md grid-cols-4 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`public-focus relative flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition-colors ${
                item.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`relative flex h-7 w-10 items-center justify-center rounded-full transition-colors ${item.active ? "bg-primary/10" : ""}`}>
                <Icon className="h-[19px] w-[19px]" strokeWidth={item.active ? 2.3 : 1.8} aria-hidden="true" />
                {item.badge ? (
                  <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
