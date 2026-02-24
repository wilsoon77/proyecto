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
  Search,
  Bell,
  User,
  Warehouse,
  Tag,
  Building2,
  X
} from "lucide-react"

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, roles: ["ADMIN", "EMPLOYEE"] },
  { href: "/admin/productos", label: "Productos", icon: Package, roles: ["ADMIN"] },
  { href: "/admin/categorias", label: "Categorías", icon: Tag, roles: ["ADMIN"] },
  { href: "/admin/ordenes", label: "Pedidos", icon: ShoppingCart, roles: ["ADMIN", "EMPLOYEE"] },
  { href: "/admin/inventario", label: "Inventario", icon: Warehouse, roles: ["ADMIN", "EMPLOYEE"] },
  { href: "/admin/sucursales", label: "Sucursales", icon: Building2, roles: ["ADMIN"] },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users, roles: ["ADMIN"] },
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

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login?returnUrl=/admin")
      } else if (user?.role !== "ADMIN" && user?.role !== "EMPLOYEE") {
        router.push("/")
      }
    }
  }, [isAuthenticated, isLoading, user, router])

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false)
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
  if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "EMPLOYEE")) {
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
        {/* Logo Header */}
        <div className={`h-16 flex items-center border-b border-gray-200 ${sidebarCollapsed ? 'justify-center px-2' : 'px-4'}`}>
          {sidebarCollapsed ? (
            <Image 
              src="/images/logo-pan.jpeg" 
              alt="Panaderia" 
              width={40} 
              height={40}
              className="rounded-md"
            />
          ) : (
            <Link href="/admin" className="flex items-center">
              <Image 
                src="/images/logo-pan.jpeg" 
                alt="Panaderia" 
                width={48} 
                height={48}
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
              const isActive = isActiveRoute(item.href, item.exact)
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

        {/* Collapse Toggle */}
        <div className="hidden lg:block border-t border-gray-200 p-3">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`
              flex items-center gap-2 w-full px-3 py-2 rounded-lg
              text-gray-500 hover:bg-gray-100 hover:text-gray-700
              transition-colors
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Colapsar</span>
              </>
            )}
          </button>
        </div>

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
            
            {/* Search Bar */}
            <div className="hidden sm:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-64 pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Right: Notifications + User */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

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
