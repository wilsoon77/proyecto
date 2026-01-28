"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  LogOut,
  ChevronLeft
} from "lucide-react"

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/ordenes", label: "Órdenes", icon: ShoppingCart },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login?returnUrl=/admin")
      } else if (user?.role !== "ADMIN") {
        router.push("/")
      }
    }
  }, [isAuthenticated, isLoading, user, router])

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  // Si no es admin, no mostrar nada (se redirige)
  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Verificando permisos...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-amber-400">🥖 PanaderIA</h1>
          <p className="text-xs text-gray-400 mt-1">Panel de Administración</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Volver a la tienda</span>
          </Link>
          <button
            onClick={() => {
              logout()
              router.push("/")
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
          <div className="px-3 py-2 text-xs text-gray-500">
            {user?.email}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
