"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  History, 
  Search, 
  Loader2,
  Filter,
  Calendar,
  User,
  Package,
  ShoppingCart,
  Building2,
  Tag,
  AlertCircle,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { auditService, type AuditLog, type AuditListFilters, type AuditStats, type AuditFilterOptions } from "@/lib/api"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

// Helper functions for date formatting
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 1) return "hace un momento"
  if (diffMins < 60) return `hace ${diffMins} min`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays < 7) return `hace ${diffDays}d`
  return date.toLocaleDateString("es-GT", { day: "2-digit", month: "short" })
}

// Iconos por entidad
const ENTITY_ICONS: Record<string, React.ElementType> = {
  Product: Package,
  Order: ShoppingCart,
  User: User,
  Branch: Building2,
  Category: Tag,
  Inventory: Package,
  StockMovement: RefreshCcw,
}

// Colores por acción
const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  CREATE: { bg: "bg-green-100", text: "text-green-700" },
  UPDATE: { bg: "bg-blue-100", text: "text-blue-700" },
  DELETE: { bg: "bg-red-100", text: "text-red-700" },
  LOGIN: { bg: "bg-purple-100", text: "text-purple-700" },
  LOGOUT: { bg: "bg-gray-100", text: "text-gray-700" },
  STATUS_CHANGE: { bg: "bg-amber-100", text: "text-amber-700" },
}

// Traducciones de acciones
const ACTION_LABELS: Record<string, string> = {
  CREATE: "Crear",
  UPDATE: "Actualizar",
  DELETE: "Eliminar",
  LOGIN: "Inicio de sesión",
  LOGOUT: "Cierre de sesión",
  STATUS_CHANGE: "Cambio de estado",
}

// Traducciones de entidades
const ENTITY_LABELS: Record<string, string> = {
  Product: "Producto",
  Order: "Pedido",
  User: "Usuario",
  Branch: "Sucursal",
  Category: "Categoría",
  Inventory: "Inventario",
  StockMovement: "Movimiento de Stock",
}

export default function HistorialPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  
  // Estado de datos
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [filterOptions, setFilterOptions] = useState<AuditFilterOptions>({ entities: [], actions: [] })
  
  // Estado de UI
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  
  // Filtros
  const [filters, setFilters] = useState<AuditListFilters>({
    page: 1,
    pageSize: 20,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  
  // Paginación
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  })

  // Protección de rol - solo ADMIN puede acceder
  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      router.push("/admin")
    }
  }, [currentUser, router])

  // Cargar datos iniciales
  useEffect(() => {
    loadFilterOptions()
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cargar logs cuando cambian los filtros
  useEffect(() => {
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadLogs = async () => {
    try {
      setIsLoading(true)
      const response = await auditService.list(filters)
      setLogs(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Error loading audit logs:", error)
      showToast("Error al cargar el historial", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      setIsLoadingStats(true)
      const data = await auditService.getStats()
      setStats(data)
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const loadFilterOptions = async () => {
    try {
      const options = await auditService.getFilterOptions()
      setFilterOptions(options)
    } catch (error) {
      console.error("Error loading filter options:", error)
    }
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleFilterChange = (key: keyof AuditListFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({ page: 1, pageSize: 20 })
    setSearchTerm("")
  }

  const hasActiveFilters = useMemo(() => {
    return !!(filters.entity || filters.action || filters.userId || filters.startDate || filters.endDate || filters.search)
  }, [filters])

  // Si no es admin, no mostrar nada
  if (currentUser && currentUser.role !== "ADMIN") {
    return null
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="h-7 w-7 text-amber-600" />
            Historial de Cambios
          </h1>
          <p className="text-gray-500 mt-1">
            Registro completo de todas las acciones realizadas en el sistema
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            loadLogs()
            loadStats()
          }}
          className="gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {!isLoadingStats && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Hoy"
            value={stats.totalToday ?? 0}
            icon={Clock}
            color="amber"
          />
          <StatsCard
            title="Esta semana"
            value={stats.totalWeek ?? 0}
            icon={Calendar}
            color="blue"
          />
          <StatsCard
            title="Este mes"
            value={stats.totalMonth ?? 0}
            icon={Activity}
            color="green"
          />
          <StatsCard
            title="Usuarios activos"
            value={stats.recentActiveUsers?.length ?? 0}
            subtitle="Últimos 7 días"
            icon={User}
            color="purple"
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, entidad o detalles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          
          {/* Toggle Filters */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-2 ${hasActiveFilters ? 'border-amber-500 text-amber-700' : ''}`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                Activos
              </span>
            )}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Entity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entidad
              </label>
              <select
                value={filters.entity || ""}
                onChange={(e) => handleFilterChange("entity", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Todas</option>
                {filterOptions.entities.map((entity) => (
                  <option key={entity} value={entity}>
                    {ENTITY_LABELS[entity] || entity}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acción
              </label>
              <select
                value={filters.action || ""}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Todas</option>
                {filterOptions.actions.map((action) => (
                  <option key={action} value={action}>
                    {ACTION_LABELS[action] || action}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="sm:col-span-2 lg:col-span-4">
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-sm text-gray-600"
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No hay registros</p>
            <p className="text-sm">
              {hasActiveFilters 
                ? "No se encontraron registros con los filtros aplicados"
                : "No hay actividad registrada aún"
              }
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Entidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Detalles
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {logs.map((log) => (
                <LogCard key={log.id} log={log} />
              ))}
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Stats Card Component
function StatsCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  color 
}: { 
  title: string
  value: number
  subtitle?: string
  icon: React.ElementType
  color: "amber" | "blue" | "green" | "purple"
}) {
  const colorClasses = {
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{title}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

// Log Row for Desktop
function LogRow({ log }: { log: AuditLog }) {
  const EntityIcon = ENTITY_ICONS[log.entity] || Package
  const actionColor = ACTION_COLORS[log.action] || ACTION_COLORS.UPDATE

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {formatDate(log.createdAt)}
        </div>
        <div className="text-xs text-gray-500">
          {formatRelativeTime(log.createdAt)}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{log.userName}</div>
        {log.user?.email && (
          <div className="text-xs text-gray-500">{log.user.email}</div>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${actionColor.bg} ${actionColor.text}`}>
          {ACTION_LABELS[log.action] || log.action}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <EntityIcon className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-900">
              {ENTITY_LABELS[log.entity] || log.entity}
            </div>
            {log.entityName && (
              <div className="text-xs text-gray-500 truncate max-w-[150px]">
                {log.entityName}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {log.details && (
          <div className="text-sm text-gray-600 truncate max-w-[200px]" title={log.details}>
            {log.details}
          </div>
        )}
      </td>
    </tr>
  )
}

// Log Card for Mobile
function LogCard({ log }: { log: AuditLog }) {
  const EntityIcon = ENTITY_ICONS[log.entity] || Package
  const actionColor = ACTION_COLORS[log.action] || ACTION_COLORS.UPDATE

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${actionColor.bg} ${actionColor.text}`}>
          {ACTION_LABELS[log.action] || log.action}
        </span>
        <span className="text-xs text-gray-500">
          {formatRelativeTime(log.createdAt)}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <EntityIcon className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-900">
          {ENTITY_LABELS[log.entity] || log.entity}
        </span>
        {log.entityName && (
          <span className="text-sm text-gray-500">• {log.entityName}</span>
        )}
      </div>
      
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <User className="h-3 w-3" />
        {log.userName}
      </div>
      
      {log.details && (
        <p className="text-sm text-gray-500 line-clamp-2">{log.details}</p>
      )}
    </div>
  )
}
