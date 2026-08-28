"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { ToastProvider } from "@/components/ui/toast"
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, ChevronLeft, ChevronRight, Menu, Bell, User, Warehouse, Tag, Building2, X, Factory as History, Flame, BookOpen, ChartBar as BarChart3, ArrowRightLeft, ChevronDown, ClipboardCheck, CalendarClock } from "lucide-react"
import { GlobalSearch } from "@/components/ui/global-search"
import NotificationBell from "@/components/layout/NotificationBell"

const OPERATIONAL_ROLES = ['ADMIN', 'MANAGER', 'BAKER']

interface NavItem {
  href: string
  label: string
  icon: any
  exact?: boolean
  roles: string[]
  children?: {
    href: string
    label: string
    icon: any
    exact?: boolean
    roles: string[]
  }[]
}

const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Operación", icon: LayoutDashboard, exact: true, roles: ["ADMIN", "MANAGER", "BAKER"] },
  { href: "/admin/productos", label: "Productos", icon: Package, roles: ["ADMIN", "MANAGER"] },
  { href: "/admin/categorias", label: "Categorías", icon: Tag, roles: ["ADMIN"] },
  { href: "/admin/ordenes", label: "Pedidos", icon: ShoppingCart, roles: ["ADMIN", "MANAGER"] },
  { href: "/admin/cierre-dia", label: "Cierre del Día", icon: ClipboardCheck, roles: ["ADMIN", "MANAGER"] },
  { href: "/admin/produccion", label: "Producción", icon: Flame, roles: ["ADMIN", "MANAGER", "BAKER"] },
  { href: "/admin/recetas", label: "Recetas", icon: BookOpen, roles: ["ADMIN", "MANAGER"] },
  { 
    href: "/admin/inventario", 
    label: "Inventario", 
    icon: Warehouse, 
    roles: ["ADMIN", "MANAGER"],
    children: [
      { href: "/admin/inventario", label: "Resumen", icon: BarChart3, exact: true, roles: ["ADMIN", "MANAGER"] },
      { href: "/admin/inventario/productos", label: "Productos", icon: Package, roles: ["ADMIN", "MANAGER"] },
      { href: "/admin/inventario/materias-primas", label: "Materias Primas", icon: Warehouse, roles: ["ADMIN", "MANAGER"] },
      { href: "/admin/inventario/caducidades", label: "Caducidades", icon: CalendarClock, roles: ["ADMIN", "MANAGER"] },
      { href: "/admin/inventario/movimiento", label: "Movimientos", icon: ArrowRightLeft, roles: ["ADMIN", "MANAGER"] },
      { href: "/admin/inventario/conteo", label: "Conteo Físico", icon: ClipboardCheck, roles: ["ADMIN", "MANAGER"] },
    ]
  },
  { href: "/admin/sucursales", label: "Sucursales", icon: Building2, roles: ["ADMIN"] },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/historial", label: "Historial", icon: History, roles: ["ADMIN"] },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings, roles: ["ADMIN"] },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login?returnUrl=/admin")
      } else if (!OPERATIONAL_ROLES.includes(user?.role || '')) {
        router.push("/")
      }
    }
  }, [isAuthenticated, isLoading, user, router])

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Auto-expandir grupos basados en la ruta activa
  useEffect(() => {
    if (pathname) {
      adminNavItems.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some((child) => 
            child.exact ? pathname === child.href : pathname.startsWith(child.href)
          )
          if (hasActiveChild) {
            setExpandedGroups((prev) => ({ ...prev, [item.label]: true }))
          }
        }
      })
    }
  }, [pathname])

  const isActiveRoute = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname?.startsWith(href)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF5EE]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#D97706] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-xs font-semibold text-[#8C522B]">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  // Unauthorized
  if (!isAuthenticated || !OPERATIONAL_ROLES.includes(user?.role || '')) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF5EE]">
        <p className="text-sm font-semibold text-[#8C522B]">Verificando permisos de acceso...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#FAF5EE] text-[#2B170F]">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarCollapsed ? 'w-20' : 'w-68'} 
          ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          bg-white border-r border-[#E8DCCB] flex flex-col
          transition-all duration-300 ease-in-out
        `}
      >
        {/* Logo Header with Collapse Button */}
        <div className={`h-22 flex items-center border-b border-[#E8DCCB] ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!sidebarCollapsed ? (
            <Link href="/admin" className="flex items-center gap-2 group">
              <div className="relative h-14 w-48 sm:h-16 sm:w-52 transition-transform group-hover:scale-[1.02]">
                <Image 
                  src="/images/logo-panaderia.svg" 
                  alt="Panadería Svetlana" 
                  fill
                  priority
                  sizes="208px"
                  className="object-contain object-left"
                />
              </div>
            </Link>
          ) : (
            <Link href="/admin" className="flex items-center justify-center" title="Panadería Svetlana">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706] shadow-xs">
                <Flame className="h-6 w-6" />
              </div>
            </Link>
          )}

          {/* Collapse Toggle Button - Desktop only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center h-8 w-8 rounded-full border border-[#DECDBB] bg-[#FAF5EE] text-[#2B170F] hover:border-[#D97706] hover:bg-white transition-colors shadow-xs"
            title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
          
          {/* Close button for mobile */}
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-xl text-[#6E5545] hover:bg-[#FAF5EE] hover:text-[#2B170F]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {adminNavItems
              .filter((item) => item.roles.includes(user?.role || ""))
              .map((item) => {
                const hasChildren = !!item.children
                const isGroupExpanded = expandedGroups[item.label]
                const activeChild = hasChildren && item.children?.some(c => isActiveRoute(c.href, c.exact))
                const isActive = hasChildren ? activeChild : isActiveRoute(item.href, item.exact)

                if (hasChildren) {
                  const filteredChildren = item.children!.filter(c => c.roles.includes(user?.role || ""))
                  if (filteredChildren.length === 0) return null

                  return (
                    <li key={item.label} className="relative group/menu-item">
                      {/* Parent Item */}
                      <button
                        onClick={() => {
                          if (!sidebarCollapsed) {
                            setExpandedGroups(prev => ({ ...prev, [item.label]: !prev[item.label] }))
                          }
                        }}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-xl
                          transition-all duration-200 text-xs font-semibold
                          ${isActive && !isGroupExpanded 
                            ? 'bg-[#FAF0E6] text-[#D97706] font-bold' 
                            : 'text-[#6E5545] hover:bg-[#F3E9DC]/60 hover:text-[#2B170F]'
                          }
                          ${sidebarCollapsed ? 'justify-center' : ''}
                        `}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive && !isGroupExpanded ? 'text-[#D97706]' : 'text-[#8C522B]'}`} />
                          {!sidebarCollapsed && (
                            <span className="text-xs font-bold">{item.label}</span>
                          )}
                        </div>
                        {!sidebarCollapsed && (
                          <ChevronDown 
                            className={`h-3.5 w-3.5 transition-transform duration-200 text-[#8C522B] ${
                              isGroupExpanded ? 'transform rotate-180' : ''
                            }`} 
                          />
                        )}
                      </button>

                      {/* Children Items (Expanded Mode) */}
                      {!sidebarCollapsed && isGroupExpanded && (
                        <ul className="mt-1 ml-4 space-y-1 border-l-2 border-[#E8DCCB] pl-2">
                          {filteredChildren.map((child) => {
                            const isChildActive = isActiveRoute(child.href, child.exact)
                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className={`
                                    flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs
                                    transition-all duration-200
                                    ${isChildActive 
                                      ? 'bg-[#FAF0E6] text-[#D97706] font-bold' 
                                      : 'text-[#6E5545] hover:bg-[#F3E9DC]/60 hover:text-[#2B170F]'
                                    }
                                  `}
                                >
                                  <child.icon className={`h-4 w-4 flex-shrink-0 ${isChildActive ? 'text-[#D97706]' : 'text-[#8C522B]'}`} />
                                  <span>{child.label}</span>
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}

                      {/* Children Items (Collapsed Popover Mode) */}
                      {sidebarCollapsed && (
                        <div className="invisible opacity-0 group-hover/menu-item:visible group-hover/menu-item:opacity-100 absolute left-full top-0 ml-2 w-48 bg-white border border-[#E8DCCB] rounded-2xl shadow-xl py-2 z-50 transition-all duration-200">
                          <div className="px-3 py-1.5 border-b border-[#E8DCCB] font-bold text-[10px] text-[#8C522B] uppercase tracking-wider">
                            {item.label}
                          </div>
                          <ul className="mt-1 space-y-1 px-2">
                            {filteredChildren.map((child) => {
                              const isChildActive = isActiveRoute(child.href, child.exact)
                              return (
                                <li key={child.href}>
                                  <Link
                                    href={child.href}
                                    className={`
                                      flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs
                                      transition-all duration-200
                                      ${isChildActive 
                                        ? 'bg-[#FAF0E6] text-[#D97706] font-bold' 
                                        : 'text-[#6E5545] hover:bg-[#F3E9DC]/60 hover:text-[#2B170F]'
                                      }
                                    `}
                                  >
                                    <child.icon className={`h-4 w-4 flex-shrink-0 ${isChildActive ? 'text-[#D97706]' : 'text-[#8C522B]'}`} />
                                    <span>{child.label}</span>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}
                    </li>
                  )
                }

                // Normal Item
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-[#FAF0E6] text-[#D97706] font-bold shadow-2xs' 
                          : 'text-[#6E5545] hover:bg-[#F3E9DC]/60 hover:text-[#2B170F]'
                        }
                        ${sidebarCollapsed ? 'justify-center' : ''}
                      `}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-[#D97706]' : 'text-[#8C522B]'}`} />
                      {!sidebarCollapsed && (
                        <span>{item.label}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
          </ul>
        </nav>

        {/* User & Store Section */}
        <div className={`border-t border-[#E8DCCB] p-3 space-y-1 ${sidebarCollapsed ? 'px-2' : ''}`}>
          <Link
            href="/"
            className={`
              flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold
              text-[#6E5545] hover:bg-[#F3E9DC]/60 hover:text-[#2B170F]
              transition-colors
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
            title={sidebarCollapsed ? "Volver a la tienda" : undefined}
          >
            <ChevronLeft className="h-4 w-4 text-[#8C522B]" />
            {!sidebarCollapsed && <span>Volver a la tienda</span>}
          </Link>
          <button
            onClick={() => {
              logout()
              router.push("/")
            }}
            className={`
              flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold
              text-destructive hover:bg-destructive/10 hover:text-destructive
              transition-colors
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
            title={sidebarCollapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#E8DCCB] flex items-center justify-between px-4 lg:px-6 shrink-0">
          {/* Left: Mobile menu button + Logo (mobile) + Search (desktop) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#6E5545] hover:text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl transition-colors"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/admin" className="lg:hidden flex items-center">
              <div className="relative h-10 w-36">
                <Image 
                  src="/images/logo-panaderia.svg" 
                  alt="Panadería Svetlana" 
                  fill
                  priority
                  sizes="144px"
                  className="object-contain object-left"
                />
              </div>
            </Link>
            
            {/* Global Search - Ctrl+K */}
            <div className="hidden sm:flex items-center">
              <GlobalSearch />
            </div>
          </div>

          {/* Right: Notifications + User Badge */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NotificationBell />

            {/* User Profile Pill */}
            <div className="flex items-center gap-3 pl-3 border-l border-[#E8DCCB]">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-[#2B170F] truncate max-w-[130px]">
                  {user?.firstName} {user?.lastName}
                </p>
                <span className="inline-block rounded bg-amber-100/80 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-[#9E4D1A]">
                  {user?.role}
                </span>
              </div>
              <div className="h-9 w-9 bg-[#FAF0E6] text-[#D97706] rounded-full flex items-center justify-center font-bold text-xs border border-[#DECDBB]">
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with Warm Background and Smooth Scrolling */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#FAF5EE] p-4 sm:p-6 lg:p-8">
          <ToastProvider>
            {children}
          </ToastProvider>
        </main>
      </div>
    </div>
  )
}
