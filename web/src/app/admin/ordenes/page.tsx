"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { 
  ShoppingCart, 
  Search, 
  Loader2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  ChefHat,
  Filter,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { ordersService, branchesService, type OrderStatus } from "@/lib/api"

interface Order {
  id: number
  orderNumber: string
  status: OrderStatus
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  paymentMethod?: string
  shippingMethod?: string
  customerNotes?: string
  branch?: { id: number; name: string; slug: string }
  createdAt: string
  updatedAt: string
  items: Array<{ productName: string; quantity: number; unitPrice: number }>
}

interface Branch {
  id: number
  name: string
  slug: string
}

const STATUS_OPTIONS: { value: OrderStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: "PENDING", label: "Pendiente", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  { value: "CONFIRMED", label: "Confirmada", icon: CheckCircle, color: "bg-blue-100 text-blue-700" },
  { value: "PREPARING", label: "Preparando", icon: ChefHat, color: "bg-purple-100 text-purple-700" },
  { value: "READY", label: "Lista", icon: Package, color: "bg-green-100 text-green-700" },
  { value: "DELIVERED", label: "Entregada", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
  { value: "PICKED_UP", label: "Recogida", icon: CheckCircle, color: "bg-teal-100 text-teal-700" },
  { value: "CANCELLED", label: "Cancelada", icon: XCircle, color: "bg-red-100 text-red-700" },
]

const STATUS_MAP = STATUS_OPTIONS.reduce((acc, s) => {
  acc[s.value] = s
  return acc
}, {} as Record<OrderStatus, typeof STATUS_OPTIONS[0]>)

export default function OrdenesPage() {
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">(
    (searchParams.get("status") as OrderStatus) || "ALL"
  )
  const [branchFilter, setBranchFilter] = useState<string>("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, branchFilter, page])

  const loadBranches = async () => {
    try {
      const data = await branchesService.list()
      setBranches(data)
    } catch (error) {
      console.error("Error loading branches:", error)
    }
  }

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const filters: { page: number; pageSize: number; status?: OrderStatus; branchSlug?: string } = { page, pageSize: 20 }
      if (statusFilter !== "ALL") filters.status = statusFilter
      if (branchFilter !== "ALL") filters.branchSlug = branchFilter
      
      const response = await ordersService.list(filters)
      setOrders(response.data)
      setTotal(response.meta.total)
      setTotalPages(response.meta.pageCount)
    } catch (error) {
      console.error("Error loading orders:", error)
      showToast("Error al cargar órdenes", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    setProcessingId(orderId)
    try {
      await ordersService.updateStatus(orderId, newStatus)
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ))
      showToast(`Estado actualizado a ${STATUS_MAP[newStatus].label}`, "success")
    } catch (error) {
      console.error("Error updating order status:", error)
      const message = error instanceof Error ? error.message : "Error al actualizar estado"
      showToast(message, "error")
    } finally {
      setProcessingId(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filtro de búsqueda local
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      order.orderNumber.toLowerCase().includes(term) ||
      order.items.some(item => item.productName.toLowerCase().includes(term))
    )
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600" />
            Gestión de Órdenes
          </h1>
          <p className="text-gray-500 mt-1">Administra los pedidos del sistema</p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadOrders}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por # orden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | "ALL")
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
          >
            <option value="ALL">Todos los estados</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          
          {/* Branch filter */}
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
          >
            <option value="ALL">Todas las sucursales</option>
            {branches.map(b => (
              <option key={b.id} value={b.slug}>{b.name}</option>
            ))}
          </select>

          {/* Stats summary */}
          <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            <span>{total} órdenes encontradas</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].map(status => {
          const config = STATUS_MAP[status as OrderStatus]
          const StatusIcon = config.icon
          return (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status as OrderStatus)
                setPage(1)
              }}
              className={`bg-white rounded-lg p-4 border border-gray-100 text-left hover:shadow-md transition-shadow ${
                statusFilter === status ? 'ring-2 ring-amber-500' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${config.color.split(' ')[0]}`}>
                  <StatusIcon className={`h-4 w-4 ${config.color.split(' ')[1]}`} />
                </div>
                <span className="text-sm text-gray-500">{config.label}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron órdenes</p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                const statusConfig = STATUS_MAP[order.status]
                const StatusIcon = statusConfig.icon
                const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0)
                
                return (
                  <div key={order.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                      </div>
                      <Link href={`/admin/ordenes/${order.id}`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-600 hover:text-amber-600">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-gray-600">{totalItems} producto{totalItems !== 1 ? 's' : ''}</p>
                      <span className="text-gray-300">·</span>
                      <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-gray-500">{order.branch?.name || "Sin asignar"}</span>
                      {processingId === order.id ? (
                        <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-full border-0 focus:ring-2 focus:ring-amber-500 ${statusConfig.color}`}
                          disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED' || order.status === 'PICKED_UP'}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sucursal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const statusConfig = STATUS_MAP[order.status]
                  const StatusIcon = statusConfig.icon
                  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0)
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-400">ID: {order.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{totalItems} producto{totalItems !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">
                          {order.items.slice(0, 2).map(i => i.productName).join(', ')}
                          {order.items.length > 2 && '...'}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                        {order.discount > 0 && (
                          <p className="text-xs text-green-600">-{formatCurrency(order.discount)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.branch?.name || "Sin asignar"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {processingId === order.id ? (
                          <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-amber-500 ${statusConfig.color}`}
                            disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED' || order.status === 'PICKED_UP'}
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link href={`/admin/ordenes/${order.id}`}>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-amber-600">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
