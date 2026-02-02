"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingDown,
  Store,
  MapPin,
  LineChart as LineChartIcon
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
  LineChart,
  Line,
} from "recharts"
import { api, branchesService } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

// Interfaces actualizadas según nuevo backend
interface DashboardResponse {
  kpis: {
    todaySales: number
    todayOrdersCount: number
    monthlyLossesQty: number
    monthlyLossesCount: number
    lowStockAlerts: number
  }
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
  salesByBranch: Array<{ branchId: number; branchName: string; totalSales: number; orderCount: number }>
  weeklySales: Array<{ date: string; totalSales: number; orderCount: number }>
}

interface Branch {
  id: number
  name: string
  slug: string
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PREPARING: "#8b5cf6",
  READY: "#10b981",
  DELIVERED: "#22c55e",
  PICKED_UP: "#14b8a6",
  CANCELLED: "#ef4444",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  PREPARING: "Preparando",
  READY: "Lista",
  DELIVERED: "Entregada",
  PICKED_UP: "Recogida",
  CANCELLED: "Cancelada",
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardResponse | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("global")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.role === "ADMIN"
  const isEmployee = user?.role === "EMPLOYEE"

  // Cargar sucursales y configurar branch inicial según rol
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await branchesService.list()
        setBranches(data)
        
        // Si es empleado, usar su sucursal asignada
        if (isEmployee && user?.branchId) {
          setSelectedBranch(user.branchId.toString())
        } else if (isEmployee && data.length > 0) {
          // Fallback: primera sucursal si no tiene asignada
          setSelectedBranch(data[0].id.toString())
        }
      } catch (err) {
        console.error("Error loading branches:", err)
      }
    }
    loadBranches()
  }, [isEmployee, user?.branchId])

  // Cargar estadísticas cuando cambia la sucursal seleccionada
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const branchParam = selectedBranch !== "global" ? `?branchId=${selectedBranch}` : ""
        const response = await api.get<DashboardResponse>(`/dashboard/stats${branchParam}`)
        setStats(response)
        setError(null)
      } catch (err) {
        console.error("Error loading dashboard stats:", err)
        setError("Error al cargar las estadísticas")
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [selectedBranch])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric' })
  }

  if (isLoading && !stats) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
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

  // Preparar datos para gráficas
  const orderStatusData = stats?.ordersByStatus.map(item => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    color: STATUS_COLORS[item.status] || "#94a3b8"
  })) || []

  const topProductsData = stats?.topProducts?.slice(0, 5).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    totalSold: p.totalSold
  })) || []

  const weeklySalesData = stats?.weeklySales?.map(d => ({
    date: formatDate(d.date),
    ventas: d.totalSales,
    ordenes: d.orderCount
  })) || []

  const salesByBranchData = stats?.salesByBranch?.map(b => ({
    name: b.branchName,
    ventas: b.totalSales,
    ordenes: b.orderCount
  })) || []

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header con selector de sucursal */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Resumen de operaciones</p>
        </div>
        
        {/* Selector de Vista (Admin) o Badge fijo (Empleado) */}
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2">
              <Store className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Vista:</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="border-0 bg-transparent font-medium text-gray-900 focus:outline-none focus:ring-0 pr-8"
              >
                <option value="global">🌐 Global</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id.toString()}>
                    📍 {branch.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-100 text-amber-800 rounded-lg px-4 py-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">
                Sucursal: {user?.branch?.name || branches.find(b => b.id.toString() === selectedBranch)?.name || "Sin asignar"}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* KPIs Principales (3 tarjetas grandes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Ventas del Día */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">💰 Ventas del Día</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(stats?.kpis.todaySales || 0)}</p>
              <p className="text-green-100 text-sm mt-1">{stats?.kpis.todayOrdersCount || 0} órdenes completadas</p>
            </div>
            <div className="h-16 w-16 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Mermas del Mes */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">📉 Mermas del Mes</p>
              <p className="text-3xl font-bold mt-2">{stats?.kpis.monthlyLossesQty || 0} uds</p>
              <p className="text-red-100 text-sm mt-1">{stats?.kpis.monthlyLossesCount || 0} movimientos registrados</p>
            </div>
            <div className="h-16 w-16 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingDown className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Alertas de Stock */}
        <div className={`rounded-xl shadow-lg p-6 text-white ${
          (stats?.kpis.lowStockAlerts || 0) > 0 
            ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
            : 'bg-gradient-to-br from-blue-500 to-blue-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">⚠️ Alertas de Stock</p>
              <p className="text-3xl font-bold mt-2">{stats?.kpis.lowStockAlerts || 0}</p>
              <p className="text-white/80 text-sm mt-1">productos con stock bajo</p>
            </div>
            <div className="h-16 w-16 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-8 w-8" />
            </div>
          </div>
          {(stats?.kpis.lowStockAlerts || 0) > 0 && (
            <Link href="/admin/inventario?lowStock=true" className="mt-4 flex items-center text-sm text-white/90 hover:text-white font-medium">
              Ver productos <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          )}
        </div>
      </div>

      {/* Stats secundarias */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.summary.totalOrders || 0}</p>
              <p className="text-xs text-gray-500">Órdenes totales</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.summary.pendingOrders || 0}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.summary.activeProducts || 0}</p>
              <p className="text-xs text-gray-500">Productos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.summary.totalUsers || 0}</p>
              <p className="text-xs text-gray-500">Usuarios</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfica principal - depende del rol y selección */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            {selectedBranch === "global" ? (
              <>
                <BarChart3 className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Ventas por Sucursal</h3>
              </>
            ) : (
              <>
                <LineChartIcon className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Ventas de la Semana</h3>
              </>
            )}
          </div>
          
          {selectedBranch === "global" && salesByBranchData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesByBranchData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(v) => `Q${v}`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Ventas']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="ventas" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : weeklySalesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklySalesData} margin={{ left: 20, right: 20, top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `Q${v}`} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'ventas' ? formatCurrency(Number(value)) : value,
                    name === 'ventas' ? 'Ventas' : 'Órdenes'
                  ]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>No hay datos de ventas disponibles</p>
            </div>
          )}
        </div>

        {/* Gráfico circular - órdenes por estado */}
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

      {/* Segunda fila de gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top productos */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Productos Más Vendidos</h3>
          </div>
          {topProductsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProductsData} layout="vertical" margin={{ left: 20, right: 20 }}>
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

        {/* Alerta de Stock Bajo */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-gray-900">Stock Bajo</h3>
            </div>
            <Link href="/admin/inventario" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              Ver inventario
            </Link>
          </div>
          {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
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
                  {stats.lowStockProducts.slice(0, 5).map((item, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-900">{item.productName}</td>
                      <td className="py-3 text-gray-600">{item.branchName}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.available === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.available} uds
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto mb-2 text-green-300" />
                <p>Todos los productos tienen stock suficiente</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link
            href="/admin/inventario"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all group"
          >
            <Package className="h-8 w-8 text-gray-400 group-hover:text-green-600" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-green-700">Inventario</span>
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all group"
          >
            <Package className="h-8 w-8 text-gray-400 group-hover:text-amber-600" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-amber-700">Nuevo Producto</span>
          </Link>
          <Link
            href="/admin/ordenes?status=PENDING"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <Clock className="h-8 w-8 text-gray-400 group-hover:text-blue-600" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-blue-700">Pendientes</span>
          </Link>
          <Link
            href="/admin/ordenes"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
          >
            <ShoppingCart className="h-8 w-8 text-gray-400 group-hover:text-purple-600" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-purple-700">Órdenes</span>
          </Link>
          <Link
            href="/admin/usuarios"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
          >
            <Users className="h-8 w-8 text-gray-400 group-hover:text-indigo-600" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-700">Usuarios</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
