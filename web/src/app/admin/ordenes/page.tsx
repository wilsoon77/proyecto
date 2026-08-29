"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ShoppingCart, Search, Loader as Loader2, Eye, Clock, CircleCheck as CheckCircle, Circle as XCircle, Package, ChefHat, ListFilter as Filter, RefreshCw, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { ordersService, branchesService, type OrderStatus } from "@/lib/api"
import { formatCurrency, formatDateString } from "@/lib/utils"

interface Order {
  id: number
  orderNumber: string
  status: OrderStatus
  subtotal: number
  discount: number
  total: number
  paymentMethod?: 'EFECTIVO'
  customerNotes?: string
  branch?: { id: number; name: string; slug: string }
  createdAt: string
  updatedAt: string
  items: Array<{
    productName: string
    quantity: number
    unitPrice: number
    presentationName?: string | null
    presentationQuantity?: number | null
  }>
}

interface Branch {
  id: number
  name: string
  slug: string
}

const STATUS_OPTIONS: { value: OrderStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: "PENDING", label: "Pendiente", icon: Clock, color: "bg-warning/10 text-warning" },
  { value: "CONFIRMED", label: "Confirmada", icon: CheckCircle, color: "bg-chart-3/10 text-chart-3" },
  { value: "PREPARING", label: "Preparando", icon: ChefHat, color: "bg-chart-5/10 text-chart-5" },
  { value: "READY", label: "Lista para recoger", icon: Package, color: "bg-success/10 text-success" },
  { value: "PICKED_UP", label: "Recogida", icon: CheckCircle, color: "bg-teal-100 text-teal-700" },
  { value: "CANCELLED", label: "Cancelada", icon: XCircle, color: "bg-destructive/10 text-destructive" },
]

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: [],
  CANCELLED: [],
}

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
      const updated = newStatus === 'CANCELLED'
        ? await ordersService.cancel(orderId)
        : newStatus === 'PICKED_UP'
          ? await ordersService.pickup(orderId)
          : await ordersService.updateStatus(orderId, newStatus)
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: updated.status } : o
      ))
      showToast(`Estado actualizado a ${STATUS_MAP[updated.status].label}`, "success")
    } catch (error) {
      console.error("Error updating order status:", error)
      const message = error instanceof Error ? error.message : "Error al actualizar estado"
      showToast(message, "error")
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string) => formatDateString(dateString, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const getStatusOptions = (status: OrderStatus) => [status, ...STATUS_FLOW[status]]

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2B170F] flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 text-[#D97706]" />
            Gestión de Órdenes
          </h1>
          <p className="text-xs sm:text-sm text-[#6E5545] mt-1">Administra los pedidos y estados de entrega</p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadOrders}
          disabled={isLoading}
          className="border-[#DECDBB] bg-white text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl text-xs font-bold shadow-xs w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 text-[#D97706] ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C522B]" />
            <input
              type="text"
              placeholder="Buscar por # orden o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/60 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
          </div>
          
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | "ALL")
              setPage(1)
            }}
            className="px-3.5 py-2 text-xs sm:text-sm bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706] cursor-pointer"
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
            className="px-3.5 py-2 text-xs sm:text-sm bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706] cursor-pointer"
          >
            <option value="ALL">Todas las sucursales</option>
            {branches.map(b => (
              <option key={b.id} value={b.slug}>{b.name}</option>
            ))}
          </select>

          {/* Stats summary */}
          <div className="flex items-center justify-end gap-2 text-xs font-semibold text-[#8C522B] px-2">
            <Filter className="h-4 w-4 text-[#D97706]" />
            <span>{total} órdenes registradas</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
              className={`bg-white rounded-2xl p-4 border text-left transition-all duration-200 shadow-xs ${
                statusFilter === status 
                  ? 'border-[#D97706] ring-2 ring-[#D97706]/30 bg-[#FAF0E6]/40' 
                  : 'border-[#E8DCCB] hover:border-[#DECDBB] hover:bg-[#FAF5EE]/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${config.color.split(' ')[0]}`}>
                  <StatusIcon className={`h-4.5 w-4.5 ${config.color.split(' ')[1]}`} />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#2B170F] block">{config.label}</span>
                  <span className="text-[10px] text-[#8C522B] font-medium">Filtrar estado</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D97706] border-t-transparent mx-auto"></div>
              <p className="mt-3 text-xs font-semibold text-[#8C522B]">Cargando órdenes...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706] mx-auto mb-4">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-[#6E5545]">No se encontraron órdenes para este filtro</p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-[#E8DCCB]">
              {filteredOrders.map((order) => {
                const statusConfig = STATUS_MAP[order.status] || {
                  value: order.status,
                  label: order.status,
                  icon: Clock,
                  color: "bg-muted text-foreground"
                }
                const totalItems = order.items.reduce((sum, i) => sum + (i.presentationQuantity ?? i.quantity), 0)
                
                return (
                  <div key={order.id} className="p-4 hover:bg-[#FAF5EE]/40 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-[#2B170F]">{order.orderNumber}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            <Globe className="h-3 w-3" /> Web
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8C522B] mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>
                      <Link href={`/admin/ordenes/${order.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6E5545] hover:text-[#2B170F] hover:bg-[#FAF5EE]">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-[#6E5545]">{totalItems} producto{totalItems !== 1 ? 's' : ''}</p>
                      <span className="text-[#DECDBB]">·</span>
                      <p className="font-bold text-xs text-[#2B170F]">{formatCurrency(order.total)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[#8C522B] font-medium">{order.branch?.name || "Sin asignar"}</span>
                      {processingId === order.id ? (
                        <Loader2 className="h-4 w-4 text-[#D97706] animate-spin" />
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border border-current focus:ring-2 focus:ring-[#D97706]/30 cursor-pointer ${statusConfig.color}`}
                          disabled={getStatusOptions(order.status).length === 1}
                        >
                          {getStatusOptions(order.status).map(status => (
                            <option key={status} value={status}>{STATUS_MAP[status].label}</option>
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
              <table className="w-full text-left">
                <thead className="bg-[#FAF5EE] border-b border-[#E8DCCB]">
                  <tr>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Orden</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Productos</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Sucursal</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3.5 text-[11px] font-bold text-[#8C522B] uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DCCB]">
                  {filteredOrders.map((order) => {
                    const statusConfig = STATUS_MAP[order.status] || {
                      value: order.status,
                      label: order.status,
                      icon: Clock,
                      color: "bg-muted text-foreground"
                    }
                    const totalItems = order.items.reduce((sum, i) => sum + (i.presentationQuantity ?? i.quantity), 0)
                    
                    return (
                      <tr key={order.id} className="hover:bg-[#FAF5EE]/40 transition-colors">
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs text-[#2B170F]">{order.orderNumber}</p>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              <Globe className="h-3 w-3" /> Web
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8C522B] font-mono">ID: {order.id}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="text-xs font-semibold text-[#2B170F]">{totalItems} producto{totalItems !== 1 ? 's' : ''}</p>
                          <p className="text-[11px] text-[#6E5545] truncate max-w-[200px]">
                            {order.items.slice(0, 2).map(i => `${i.productName}${i.presentationName ? ` (${i.presentationName})` : ''}`).join(', ')}
                            {order.items.length > 2 && '...'}
                          </p>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <p className="font-bold text-xs text-[#2B170F]">{formatCurrency(order.total)}</p>
                          {order.discount > 0 && (
                            <p className="text-[11px] text-emerald-700 font-semibold">-{formatCurrency(order.discount)}</p>
                          )}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs font-medium text-[#6E5545]">
                          {order.branch?.name || "Sin asignar"}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          {processingId === order.id ? (
                            <Loader2 className="h-4 w-4 text-[#D97706] animate-spin" />
                          ) : (
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                              className={`text-xs font-bold px-2.5 py-1 rounded-full border border-current focus:ring-2 focus:ring-[#D97706]/30 cursor-pointer ${statusConfig.color}`}
                              disabled={getStatusOptions(order.status).length === 1}
                            >
                              {getStatusOptions(order.status).map(status => (
                                <option key={status} value={status}>{STATUS_MAP[status].label}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs text-[#8C522B]">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-right">
                          <Link href={`/admin/ordenes/${order.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#6E5545] hover:text-[#2B170F] hover:bg-[#FAF5EE]" title="Ver detalle">
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
              <div className="px-6 py-3.5 border-t border-[#E8DCCB] bg-[#FAF5EE]/30 flex items-center justify-between">
                <p className="text-xs font-semibold text-[#8C522B]">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="border-[#DECDBB] text-[#2B170F] hover:bg-white rounded-lg h-8 px-2.5 text-xs font-bold"
                  >
                    Anterior
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="border-[#DECDBB] text-[#2B170F] hover:bg-white rounded-lg h-8 px-2.5 text-xs font-bold"
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
