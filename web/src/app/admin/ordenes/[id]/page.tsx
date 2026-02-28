"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  ChefHat,
  Phone,
  FileText,
  Store,
  Calendar,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { ordersService, type OrderStatus } from "@/lib/api"

interface OrderDetail {
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
  branch?: { id: number; name: string; slug: string; address: string; phone?: string }
  address?: { street: string; city: string; state?: string; zone?: string; reference?: string }
  items: Array<{ id: number; productId: number; productName: string; quantity: number; unitPrice: number }>
  createdAt: string
  updatedAt: string
  user?: { id: string; firstName: string; lastName: string; email: string; phone?: string }
}

const STATUS_OPTIONS: { value: OrderStatus; label: string; icon: React.ElementType; color: string; bgColor: string }[] = [
  { value: "PENDING", label: "Pendiente", icon: Clock, color: "text-yellow-700", bgColor: "bg-yellow-100" },
  { value: "CONFIRMED", label: "Confirmada", icon: CheckCircle, color: "text-blue-700", bgColor: "bg-blue-100" },
  { value: "PREPARING", label: "Preparando", icon: ChefHat, color: "text-purple-700", bgColor: "bg-purple-100" },
  { value: "READY", label: "Lista para Recoger", icon: Package, color: "text-green-700", bgColor: "bg-green-100" },
  { value: "DELIVERED", label: "Entregada", icon: CheckCircle, color: "text-emerald-700", bgColor: "bg-emerald-100" },
  { value: "PICKED_UP", label: "Recogida", icon: CheckCircle, color: "text-teal-700", bgColor: "bg-teal-100" },
  { value: "CANCELLED", label: "Cancelada", icon: XCircle, color: "text-red-700", bgColor: "bg-red-100" },
]

const STATUS_MAP = STATUS_OPTIONS.reduce((acc, s) => {
  acc[s.value] = s
  return acc
}, {} as Record<OrderStatus, typeof STATUS_OPTIONS[0]>)

// Flujo de estados válidos
const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['PICKED_UP', 'CANCELLED'],
  IN_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  PICKED_UP: [],
  CANCELLED: [],
}

export default function DetalleOrdenPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = parseInt(params.id as string)
  const { showToast } = useToast()
  
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const loadOrder = async () => {
    setIsLoading(true)
    try {
      const data = await ordersService.getById(orderId)
      setOrder(data as OrderDetail)
    } catch (error) {
      console.error("Error loading order:", error)
      showToast("Error al cargar la orden", "error")
      router.push("/admin/ordenes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return
    
    setIsProcessing(true)
    try {
      await ordersService.updateStatus(orderId, newStatus)
      setOrder({ ...order, status: newStatus, updatedAt: new Date().toISOString() })
      showToast(`Estado actualizado a ${STATUS_MAP[newStatus].label}`, "success")
    } catch (error) {
      console.error("Error updating status:", error)
      const message = error instanceof Error ? error.message : "Error al actualizar estado"
      showToast(message, "error")
    } finally {
      setIsProcessing(false)
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-center text-gray-500">Orden no encontrada</p>
      </div>
    )
  }

  const statusConfig = STATUS_MAP[order.status]
  const StatusIcon = statusConfig.icon
  const availableTransitions = STATUS_FLOW[order.status]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/ordenes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orden {order.orderNumber}</h1>
            <p className="text-gray-500">Creada el {formatDate(order.createdAt)}</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${statusConfig.bgColor}`}>
          <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
          <span className={`font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Productos</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cant.</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Totals */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Envío</span>
                    <span className="text-gray-900">{formatCurrency(order.deliveryFee)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Descuento</span>
                    <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-amber-600">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          {order.customerNotes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <h3 className="font-medium text-gray-900">Notas del Cliente</h3>
              </div>
              <p className="text-gray-600">{order.customerNotes}</p>
            </div>
          )}

          {/* Status Actions */}
          {availableTransitions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Cambiar Estado</h3>
              <div className="flex flex-wrap gap-3">
                {availableTransitions.map((status) => {
                  const config = STATUS_MAP[status]
                  const Icon = config.icon
                  return (
                    <Button
                      key={status}
                      variant="outline"
                      onClick={() => handleStatusChange(status)}
                      disabled={isProcessing}
                      className={`${config.color} border-current hover:${config.bgColor}`}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4 mr-2" />
                      )}
                      {config.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          {order.user && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-gray-400" />
                <h3 className="font-medium text-gray-900">Cliente</h3>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-gray-900">{order.user.firstName} {order.user.lastName}</p>
                <p className="text-sm text-gray-600">{order.user.email}</p>
                {order.user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{order.user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Branch Info */}
          {order.branch && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Store className="h-5 w-5 text-gray-400" />
                <h3 className="font-medium text-gray-900">Sucursal</h3>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{order.branch.name}</p>
                <p className="text-sm text-gray-600">{order.branch.address}</p>
                {order.branch.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{order.branch.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-5 w-5 text-gray-400" />
              <h3 className="font-medium text-gray-900">Retiro</h3>
            </div>
            <p className="text-sm text-gray-600">Pago al recoger en sucursal</p>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-gray-400" />
              <h3 className="font-medium text-gray-900">Historial</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Creada</span>
                <span className="text-gray-600">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actualizada</span>
                <span className="text-gray-600">{formatDate(order.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
