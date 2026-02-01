"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
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
  avgOrderValue: number
  last30DaysOrders: number
  last30DaysRevenue: number
  ordersByStatus: Array<{ status: string; count: number }>
  topProducts: Array<{ name: string; totalSold: number }>
  lowStockList: Array<{ productName: string; branchName: string; available: number }>
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  color?: "amber" | "green" | "blue" | "red" | "purple"
}

const colorClasses = {
  amber: { bg: "bg-amber-100", icon: "text-amber-600" },
  green: { bg: "bg-green-100", icon: "text-green-600" },
  blue: { bg: "bg-blue-100", icon: "text-blue-600" },
  red: { bg: "bg-red-100", icon: "text-red-600" },
  purple: { bg: "bg-purple-100", icon: "text-purple-600" },
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PREPARING: "#8b5cf6",
  READY: "#10b981",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  PREPARING: "Preparando",
  READY: "Lista",
  DELIVERED: "Entregada",
  CANCELLED: "Cancelada",
}

function StatCard({ title, value, icon: Icon, description, trend, trendValue, color = "amber" }: StatCardProps) {
  const colors = colorClasses[color]
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === "up" ? "text-green-600" : 
              trend === "down" ? "text-red-600" : "text-gray-500"
            }`}>
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4" />
              ) : trend === "down" ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`h-12 w-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
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
        const response = await api.get<DashboardResponse>("/dashboard/stats")
        setStats({
          totalProducts: response.summary.activeProducts,
          totalOrders: response.summary.totalOrders,
          totalUsers: response.summary.totalUsers || 0,
          totalRevenue: response.summary.totalRevenue,
          pendingOrders: response.summary.pendingOrders,
          lowStockProducts: response.lowStockProducts?.length || 0,
          avgOrderValue: response.summary.avgOrderValue || 0,
          last30DaysOrders: response.last30Days?.ordersCount || 0,
          last30DaysRevenue: response.last30Days?.revenue || 0,
          ordersByStatus: response.ordersByStatus || [],
          topProducts: response.topProducts?.slice(0, 5).map(p => ({ 
            name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name, 
            totalSold: p.totalSold 
          })) || [],
          lowStockList: response.lowStockProducts?.slice(0, 5) || [],
        })
      } catch (err) {
        console.error("Error loading dashboard stats:", err)
        setError("Error al cargar las estadísticas")
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 h-80">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-64 bg-gray-100 rounded"></div>
            </div>
            <div className="bg-white rounded-xl p-6 h-80">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-64 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Preparar datos para gráfico de estado de órdenes
  const orderStatusData = stats?.ordersByStatus.map(item => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    color: STATUS_COLORS[item.status] || "#94a3b8"
  })) || []

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen general de tu negocio</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          description="Desde el inicio"
          color="green"
        />
        <StatCard
          title="Órdenes Totales"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          trend="up"
          trendValue={`${stats?.last30DaysOrders || 0} últimos 30 días`}
          color="blue"
        />
        <StatCard
          title="Productos Activos"
          value={stats?.totalProducts || 0}
          icon={Package}
          description="En catálogo"
          color="amber"
        />
        <StatCard
          title="Usuarios"
          value={stats?.totalUsers || 0}
          icon={Users}
          description="Registrados"
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Órdenes Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats?.pendingOrders || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Requieren atención</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <Link href="/admin/ordenes?status=PENDING" className="mt-4 flex items-center text-sm text-amber-600 hover:text-amber-700 font-medium">
            Ver pendientes <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Valor Promedio</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{formatCurrency(stats?.avgOrderValue || 0)}</p>
              <p className="text-xs text-gray-400 mt-1">Por orden</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
              <p className={`text-3xl font-bold mt-1 ${(stats?.lowStockProducts || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats?.lowStockProducts || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Productos por reabastecer</p>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${(stats?.lowStockProducts || 0) > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <AlertTriangle className={`h-6 w-6 ${(stats?.lowStockProducts || 0) > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
          {(stats?.lowStockProducts || 0) > 0 && (
            <Link href="/admin/productos?lowStock=true" className="mt-4 flex items-center text-sm text-red-600 hover:text-red-700 font-medium">
              Ver productos <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Productos Más Vendidos</h3>
          </div>
          {stats?.topProducts && stats.topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`${value} unidades`, 'Vendidos']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="totalSold" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>No hay datos de ventas disponibles</p>
            </div>
          )}
        </div>

        {/* Orders by Status Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Órdenes por Estado</h3>
          </div>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} órdenes`, '']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>No hay órdenes registradas</p>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats?.lowStockList && stats.lowStockList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-gray-900">Alerta de Stock Bajo</h3>
            </div>
            <Link href="/admin/productos" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              Ver todos
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium">Sucursal</th>
                  <th className="pb-3 font-medium text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockList.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3 font-medium text-gray-900">{item.productName}</td>
                    <td className="py-3 text-gray-600">{item.branchName}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.available === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.available} unidades
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/productos/nuevo"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all group"
          >
            <Package className="h-8 w-8 text-gray-400 group-hover:text-amber-600" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-amber-700">Nuevo Producto</span>
          </Link>
          <Link
            href="/admin/ordenes"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all group"
          >
            <ShoppingCart className="h-8 w-8 text-gray-400 group-hover:text-amber-600" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-amber-700">Ver Órdenes</span>
          </Link>
          <Link
            href="/admin/productos"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all group"
          >
            <Package className="h-8 w-8 text-gray-400 group-hover:text-amber-600" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-amber-700">Gestionar Productos</span>
          </Link>
          <Link
            href="/admin/usuarios"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all group"
          >
            <Users className="h-8 w-8 text-gray-400 group-hover:text-amber-600" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-amber-700">Usuarios</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
