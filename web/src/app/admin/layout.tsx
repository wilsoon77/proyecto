"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { ToastProvider } from "@/components/ui/toast"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  User,
  Warehouse,
  Tag,
  Building2,
  X,
  History,
  Flame,
  Store,
  BookOpen,
  BarChart3,
  ArrowRightLeft,
  ChevronDown,
  ClipboardCheck
} from "lucide-react"
import { GlobalSearch } from "@/components/ui/global-search"
import NotificationBell from "@/components/layout/NotificationBell"

const OPERATIONAL_ROLES = ['ADMIN', 'MANAGER', 'BAKER', 'CASHIER']

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
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, roles: ["ADMIN", "MANAGER", "BAKER", "CASHIER"] },
  { href: "/admin/pos", label: "Caja (POS)", icon: Store, roles: ["ADMIN", "MANAGER", "CASHIER"] },
  { href: "/admin/productos", label: "Productos", icon: Package, roles: ["ADMIN", "MANAGER"] },
  { href: "/admin/categorias", label: "Categorías", icon: Tag, roles: ["ADMIN"] },
  { href: "/admin/ordenes", label: "Pedidos", icon: ShoppingCart, roles: ["ADMIN", "MANAGER", "CASHIER"] },
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  // Unauthorized
  if (!isAuthenticated || !OPERATIONAL_ROLES.includes(user?.role || '')) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Verificando permisos...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarCollapsed ? 'w-20' : 'w-64'} 
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-white border-r border-gray-200 flex flex-col
          transition-all duration-300 ease-in-out
        `}
      >
        {/* Logo Header with Collapse Button */}
        <div className={`h-16 flex items-center border-b border-gray-200 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {/* Collapse Toggle Button - Desktop only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center h-8 w-8 rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
            title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {!sidebarCollapsed && (
            <Link href="/admin" className="flex items-center">
              <Image 
                src="/images/logo-pan.jpeg" 
                alt="Panaderia Svetlana" 
                width={40} 
                height={40}
                className="rounded-md"
              />
            </Link>
          )}
          
          {/* Close button for mobile */}
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden absolute right-2 top-4 p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
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
                          w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                          transition-all duration-200
                          ${isActive && !isGroupExpanded 
                            ? 'bg-amber-500 text-white shadow-md' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }
                          ${sidebarCollapsed ? 'justify-center' : ''}
                        `}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive && !isGroupExpanded ? 'text-white' : ''}`} />
                          {!sidebarCollapsed && (
                            <span className="font-medium">{item.label}</span>
                          )}
                        </div>
                        {!sidebarCollapsed && (
                          <ChevronDown 
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isGroupExpanded ? 'transform rotate-180' : ''
                            }`} 
                          />
                        )}
                      </button>

                      {/* Children Items (Expanded Mode) */}
                      {!sidebarCollapsed && isGroupExpanded && (
                        <ul className="mt-1 ml-6 space-y-1 border-l border-gray-100 pl-2">
                          {filteredChildren.map((child) => {
                            const isChildActive = isActiveRoute(child.href, child.exact)
                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className={`
                                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                                    transition-all duration-200
                                    ${isChildActive 
                                      ? 'bg-amber-50 text-amber-700 font-medium' 
                                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }
                                  `}
                                >
                                  <child.icon className={`h-4 w-4 flex-shrink-0 ${isChildActive ? 'text-amber-600' : ''}`} />
                                  <span>{child.label}</span>
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}

                      {/* Children Items (Collapsed Popover Mode) */}
                      {sidebarCollapsed && (
                        <div className="invisible opacity-0 group-hover/menu-item:visible group-hover/menu-item:opacity-100 absolute left-full top-0 ml-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 transition-all duration-200">
                          <div className="px-3 py-1.5 border-b border-gray-100 font-semibold text-xs text-gray-400 uppercase tracking-wider">
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
                                      flex items-center gap-2 px-2 py-1.5 rounded-md text-sm
                                      transition-all duration-200
                                      ${isChildActive 
                                        ? 'bg-amber-50 text-amber-700 font-medium' 
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                      }
                                    `}
                                  >
                                    <child.icon className={`h-4 w-4 flex-shrink-0 ${isChildActive ? 'text-amber-600' : ''}`} />
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
                        flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-amber-500 text-white shadow-md' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                        ${sidebarCollapsed ? 'justify-center' : ''}
                      `}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                      {!sidebarCollapsed && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
          </ul>
        </nav>

        {/* User Section */}
        <div className={`border-t border-gray-200 p-3 ${sidebarCollapsed ? 'px-2' : ''}`}>
          <Link
            href="/"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg
              text-gray-500 hover:bg-gray-100 hover:text-gray-700
              transition-colors mb-1
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
            title={sidebarCollapsed ? "Volver a la tienda" : undefined}
          >
            <ChevronLeft className="h-5 w-5" />
            {!sidebarCollapsed && <span className="text-sm">Volver a la tienda</span>}
          </Link>
          <button
            onClick={() => {
              logout()
              router.push("/")
            }}
            className={`
              flex items-center gap-2 w-full px-3 py-2 rounded-lg
              text-red-500 hover:bg-red-50 hover:text-red-600
              transition-colors
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
            title={sidebarCollapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span className="text-sm">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          {/* Left: Mobile menu button + Search */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Global Search - Ctrl+K */}
            <div className="hidden sm:flex items-center">
              <GlobalSearch />
            </div>
          </div>

          {/* Right: Notifications + User */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <div className="h-9 w-9 bg-amber-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <ToastProvider>
            {children}
          </ToastProvider>
        </main>
      </div>
    </div>
  )
}
