"use client"

import { useEffect, useState } from "react"
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  TrendingUp,
  Clock
} from "lucide-react"
import { api } from "@/lib/api/client"

// Respuesta real del endpoint /dashboard/stats
interface DashboardResponse {
  summary: {
    totalOrders: number
    totalRevenue: number
    avgOrderValue: number
    pendingOrders: number
    activeProducts: number
    totalCategories: number
    totalBranches: number
    totalUsers: number
  }
  last30Days: {
    ordersCount: number
    revenue: number
    avgOrderValue: number
  }
  ordersByStatus: Array<{ status: string; count: number }>
  topProducts: Array<{ productId: number; name: string; totalSold: number }>
  lowStockProducts: Array<{ productId: number; productName: string; branchName: string; available: number }>
}

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  pendingOrders: number
  lowStockProducts: number
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
}

function StatCard({ title, value, icon: Icon, description, trend, trendValue }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {description && (
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === "up" ? "text-green-600" : 
              trend === "down" ? "text-red-600" : "text-gray-500"
            }`}>
              <TrendingUp className={`h-4 w-4 ${trend === "down" ? "rotate-180" : ""}`} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-amber-600" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Cargar stats del dashboard
        const response = await api.get<DashboardResponse>("/dashboard/stats")
        setStats({
          totalProducts: response.summary.activeProducts,
          totalOrders: response.summary.totalOrders,
          totalUsers: response.summary.totalUsers || 0,
          totalRevenue: response.summary.totalRevenue,
          pendingOrders: response.summary.pendingOrders,
          lowStockProducts: response.lowStockProducts?.length || 0,
        })
      } catch (err) {
        // Si falla (ej: no es admin), cargar datos básicos de productos
        try {
          const products = await api.get<{ meta: { total: number } }>("/products?pageSize=1")
          setStats({
            totalProducts: products.meta?.total || 0,
            totalOrders: 0,
            totalUsers: 0,
            totalRevenue: 0,
            pendingOrders: 0,
            lowStockProducts: 0,
          })
        } catch {
          setError("Error al cargar estadísticas")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 h-32">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Bienvenido al panel de administración</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Productos"
          value={stats?.totalProducts || 0}
          icon={Package}
          description="Productos activos"
        />
        <StatCard
          title="Órdenes Totales"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          description="Todas las órdenes"
        />
        <StatCard
          title="Usuarios"
          value={stats?.totalUsers || 0}
          icon={Users}
          description="Usuarios registrados"
        />
        <StatCard
          title="Ingresos"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          description="Ingresos totales"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Órdenes Pendientes</h3>
              <p className="text-sm text-gray-500">Requieren atención</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats?.pendingOrders || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Stock Bajo</h3>
              <p className="text-sm text-gray-500">Productos por reabastecer</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900">{stats?.lowStockProducts || 0}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/productos/nuevo"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors"
          >
            <Package className="h-8 w-8 text-amber-600" />
            <span className="text-sm font-medium text-gray-700">Nuevo Producto</span>
          </a>
          <a
            href="/admin/ordenes"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors"
          >
            <ShoppingCart className="h-8 w-8 text-amber-600" />
            <span className="text-sm font-medium text-gray-700">Ver Órdenes</span>
          </a>
          <a
            href="/admin/productos"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors"
          >
            <Package className="h-8 w-8 text-amber-600" />
            <span className="text-sm font-medium text-gray-700">Gestionar Productos</span>
          </a>
          <a
            href="/admin/usuarios"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors"
          >
            <Users className="h-8 w-8 text-amber-600" />
            <span className="text-sm font-medium text-gray-700">Usuarios</span>
          </a>
        </div>
      </div>
    </div>
  )
}
