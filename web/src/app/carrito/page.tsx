"use client"

import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/utils"
import { SHIPPING, ROUTES } from "@/lib/constants"
import { Trash2, Plus, Minus } from "lucide-react"

export default function CarritoPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart()

  const shippingCost = subtotal >= SHIPPING.freeShippingThreshold || subtotal === 0
    ? 0
    : SHIPPING.baseFee

  const total = subtotal + shippingCost

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Tu Carrito</h1>

      {items.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">Tu carrito está vacío</h3>
          <p className="mb-6 text-gray-600">Agrega productos para continuar con tu compra.</p>
          <Link href={ROUTES.products}>
            <Button>Ver Productos</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-4 rounded-lg border bg-white p-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-md bg-gray-100">
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">🥖</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.category}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-md border">
                      <Button variant="ghost" size="icon" onClick={() => updateQuantity(product.id, quantity - 1)} aria-label="Disminuir">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => updateQuantity(product.id, Number(e.target.value))}
                        className="h-9 w-14 border-0 text-center"
                      />
                      <Button variant="ghost" size="icon" onClick={() => updateQuantity(product.id, quantity + 1)} aria-label="Aumentar">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(product.id)} aria-label="Eliminar">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatPrice(product.discount ? product.price * (1 - product.discount / 100) : product.price)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold">Resumen</h2>
              {/* Advertencia de mínimo para envío a domicilio */}
              {subtotal > 0 && subtotal < SHIPPING.minOrderAmount && (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Para envío a domicilio el pedido mínimo es de {formatPrice(SHIPPING.minOrderAmount)}. Si prefieres, puedes elegir "Recoger en tienda" en el checkout (no tiene mínimo).
                </div>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span className="font-medium">{shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2 text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">{formatPrice(total)}</span>
                </div>
              </div>
              {subtotal > 0 ? (
                <Link href={ROUTES.checkout}>
                  <Button className="mt-4 w-full">Continuar a Pagar</Button>
                </Link>
              ) : (
                <Button className="mt-4 w-full" disabled>Continuar a Pagar</Button>
              )}
              <Button variant="ghost" className="mt-2 w-full" onClick={clearCart}>Vaciar Carrito</Button>
            </div>
            <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
              <p>Envío base: {formatPrice(SHIPPING.baseFee)}. Envío gratis desde {formatPrice(SHIPPING.freeShippingThreshold)}.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
