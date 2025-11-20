"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Order } from "@/types"
import { Button } from "@/components/ui/button"
import { ROUTES, ORDER_STATUS_LABELS } from "@/lib/constants"
import { formatDate, formatPrice } from "@/lib/utils"

export default function PedidosPage() {
  const [order, setOrder] = useState<Order | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastOrder")
      if (raw) setOrder(JSON.parse(raw))
    } catch {}
    setHydrated(true)
  }, [])

  if (!hydrated) return null

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Tus pedidos</h1>

      {!order ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="mb-4 text-gray-700">Aún no tienes pedidos recientes.</p>
          <Link href={ROUTES.products}><Button>Ver productos</Button></Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-gray-500">Pedido</p>
                <p className="text-lg font-semibold">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="font-medium">{formatDate(new Date(order.createdAt))}</p>
              </div>
            </div>
            <div className="mt-4 inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {ORDER_STATUS_LABELS[order.status]}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Resumen</h2>
            {/* Métodos de entrega y pago */}
            <div className="mb-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
              <div>
                <span className="font-medium">Entrega: </span>
                <span>{order.shippingMethod === 'recoger' ? 'Recoger en tienda' : 'A domicilio'}</span>
              </div>
              <div>
                <span className="font-medium">Pago: </span>
                <span>
                  {order.paymentMethod === 'efectivo' && 'Efectivo'}
                  {order.paymentMethod === 'transferencia' && 'Transferencia'}
                  {order.paymentMethod === 'tarjeta' && 'Tarjeta'}
                  {order.paymentMethod === 'paypal' && 'PayPal'}
                  {!order.paymentMethod && '—'}
                </span>
              </div>
            </div>
            <div className="mb-4 max-h-56 space-y-2 overflow-auto pr-1 text-sm">
              {order.items.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="truncate pr-2">{product.name} × {quantity}</div>
                  <div className="font-medium">{formatPrice((product.discount ? product.price * (1 - product.discount/100) : product.price) * quantity)}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Envío</span>
                <span className="font-medium">{order.deliveryFee === 0 ? 'Gratis' : formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href={ROUTES.products}><Button variant="outline">Seguir comprando</Button></Link>
            <Link href={ROUTES.home}><Button>Ir al inicio</Button></Link>
          </div>
        </div>
      )}
    </div>
  )
}
