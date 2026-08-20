"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { ordersService } from "@/lib/api"
import type { ApiOrder } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ROUTES } from "@/lib/constants"
import { getOrderStatusLabel } from "@/lib/constants"
import { formatDate, formatPrice } from "@/lib/utils"

import { Clock, Check, Wrench, Package, CircleCheck as CheckCircle2, Circle as XCircle, Hop as Home, Lightbulb } from "lucide-react"

// Iconos de estado para accesibilidad (#69)
const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'PENDING': Clock,
  'CONFIRMED': Check,
  'PREPARING': Wrench,
  'READY': Package,
  'CANCELLED': XCircle,
  'PICKED_UP': Home,
}

export default function PedidosPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [localOrder, setLocalOrder] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<number | null>(null)
  const { show } = useToast()

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        if (isAuthenticated) {
          // Usuario autenticado: cargar desde API
          const response = await ordersService.myOrders({ pageSize: 20 })
          setOrders(response.data)
        } else {
          // Usuario no autenticado: mostrar último pedido de localStorage
          const raw = localStorage.getItem("lastOrder")
          if (raw) setLocalOrder(JSON.parse(raw))
        }
      } catch (err) {
        console.error('Error cargando pedidos:', err)
        setError('Error al cargar tus pedidos')
        // Fallback a localStorage
        try {
          const raw = localStorage.getItem("lastOrder")
          if (raw) setLocalOrder(JSON.parse(raw))
        } catch {}
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      loadOrders()
    }
  }, [isAuthenticated, authLoading])

  // Estado de carga
  if (authLoading || isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-foreground">Tus pedidos</h1>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse rounded-lg border bg-card p-6">
              <div className="h-6 w-48 rounded bg-border" />
              <div className="mt-2 h-4 w-32 rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasOrders = orders.length > 0 || localOrder

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Tus pedidos</h1>

      {/* Mensaje para usuarios no autenticados */}
      {!isAuthenticated && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-accent p-4 text-sm text-primary">
          <p className="font-medium flex items-center gap-1.5 mb-1">
            <Lightbulb className="h-4 w-4 text-primary" />
            ¿Ya tienes cuenta?
          </p>
          <p>
            <Link href={ROUTES.login} className="underline hover:no-underline">Inicia sesión</Link> para ver todo tu historial de pedidos.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p>{error}</p>
        </div>
      )}

      {!hasOrders ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="mb-4 text-foreground">Aún no tienes pedidos.</p>
          <Link href={ROUTES.products}><Button>Ver productos</Button></Link>
        </div>
      ) : isAuthenticated && orders.length > 0 ? (
        // Pedidos desde API
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="rounded-lg border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Pedido</p>
                  <p className="text-lg font-semibold">{order.orderNumber}</p>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                    order.status === 'PICKED_UP'
                      ? 'bg-success/10 text-success' 
                      : order.status === 'CANCELLED' 
                        ? 'bg-destructive/10 text-destructive' 
                        : 'bg-primary/10 text-primary'
                  }`}>
                    {(() => {
                      const Icon = STATUS_ICONS[order.status] || Clock
                      return <Icon className="h-3.5 w-3.5" />
                    })()}
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Sucursal:</span> {order.branch?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Retiro en sucursal</span>
                </div>
              </div>

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <div className="mt-4 max-h-32 space-y-1 overflow-auto border-t pt-3 text-sm">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.productName || `Producto #${item.productId}`}
                        {item.presentationName ? ` (${item.presentationName})` : ''}
                        {' × '}{item.presentationQuantity ?? item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatPrice(Number(item.lineTotal ?? Number(item.unitPrice) * (item.presentationQuantity ?? item.quantity)))}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-primary">{formatPrice(Number(order.total))}</span>
              </div>

              {order.status === 'PENDING' && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCancelingId(order.id)}
                  >
                    Cancelar pedido
                  </Button>
                  <ConfirmDialog
                    isOpen={cancelingId === order.id}
                    title="¿Cancelar pedido?"
                    message={`¿Estás seguro de cancelar el pedido ${order.orderNumber}? Esta acción no se puede deshacer.`}
                    confirmText="Sí, cancelar"
                    onConfirm={async () => {
                      try {
                        await ordersService.cancel(order.id)
                        setOrders(prev => prev.map(o => 
                          o.id === order.id ? { ...o, status: 'CANCELLED' } : o
                        ))
                        show('Pedido cancelado correctamente', { variant: 'success' })
                      } catch (err) {
                        console.error('Error cancelando orden:', err)
                        show('Error al cancelar el pedido', { variant: 'error' })
                      } finally {
                        setCancelingId(null)
                      }
                    }}
                    onCancel={() => setCancelingId(null)}
                    variant="danger"
                  />
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-3">
            <Link href={ROUTES.products}><Button variant="outline">Seguir comprando</Button></Link>
            <Link href={ROUTES.home}><Button>Ir al inicio</Button></Link>
          </div>
        </div>
      ) : localOrder ? (
        // Pedido local (usuario no autenticado)
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Pedido</p>
                <p className="text-lg font-semibold">{(localOrder as { orderNumber?: string }).orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-medium">{formatDate(new Date((localOrder as { createdAt?: string }).createdAt || ''))}</p>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">
              {(() => {
                const Icon = STATUS_ICONS[(localOrder as { status?: string }).status || 'PENDING'] || Clock
                return <Icon className="h-3.5 w-3.5" />
              })()}
              {getOrderStatusLabel((localOrder as { status?: string }).status || 'PENDING')}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-semibold">Resumen</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice((localOrder as { subtotal?: number }).subtotal || 0)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">{formatPrice((localOrder as { total?: number }).total || 0)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href={ROUTES.products}><Button variant="outline">Seguir comprando</Button></Link>
            <Link href={ROUTES.home}><Button>Ir al inicio</Button></Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
