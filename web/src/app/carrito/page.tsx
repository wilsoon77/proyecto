"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { formatPrice } from "@/lib/utils"
import { ORDER_CONFIG, ROUTES } from "@/lib/constants"
import { useSystemConfig } from "@/context/SystemConfigContext"
import { Trash2, Plus, Minus, ShoppingCart, Cookie, MapPin, ArrowRight } from "lucide-react"
import { presentationUnitPrice } from "@/lib/presentation-quantities"

export default function CarritoPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const { config, canPurchase, isLoading: isConfigLoading } = useSystemConfig()
  const minOrderAmount = config['orders.min_amount'] ?? ORDER_CONFIG.minOrderAmount

  if (isConfigLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        <p className="mt-4 text-muted-foreground">Cargando catálogo...</p>
      </div>
    )
  }

  if (!canPurchase) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-300/70 bg-amber-50 p-8 shadow-card">
          <ShoppingCart className="mx-auto h-10 w-10 text-amber-700" aria-hidden="true" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-amber-950">Catálogo informativo</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-amber-900">
            Las compras y reservas están deshabilitadas temporalmente. Puedes seguir consultando nuestros productos y precios.
          </p>
          <Link href={ROUTES.products} className="mt-6 inline-block">
            <Button className="shadow-warm">Volver al catálogo</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="border-b border-border/70 pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-foreground">Tu Carrito</h1>
        <p className="mt-1 text-sm text-muted-foreground">Revisa tus productos antes de confirmar la reserva.</p>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/40 p-8 sm:p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <ShoppingCart className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h3 className="mb-1 font-serif text-xl font-bold text-foreground">Tu carrito está vacío</h3>
          <p className="mb-6 text-sm text-muted-foreground max-w-sm">Agrega panes recién horneados o galletas artesanales para continuar.</p>
          <Link href={ROUTES.products}>
            <Button size="lg" className="shadow-warm font-semibold">
              Explorar Catálogo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity, presentation }) => (
              <div key={`${product.id}:${presentation?.id ?? 'base'}`} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-card transition-all hover:border-primary/40 hover:shadow-card-hover">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted/30">
                    {product.imageUrl ? (
                      <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-primary">
                        <Cookie className="h-8 w-8 stroke-[1.5]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-foreground truncate text-base">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{presentation?.name ?? product.category}</p>
                    <p className="font-serif text-sm font-extrabold text-primary mt-1">
                      {formatPrice(presentationUnitPrice(product, presentation))} c/u
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  <div className="flex items-center rounded-xl border border-input bg-card shadow-sm">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => updateQuantity(product.id, quantity - 1, presentation?.id)} aria-label="Disminuir">
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-10 text-center text-xs font-bold">{quantity}</span>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => updateQuantity(product.id, quantity + 1, presentation?.id)} aria-label="Aumentar">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <span className="font-serif text-sm font-extrabold text-foreground">
                      {formatPrice(presentationUnitPrice(product, presentation) * quantity)}
                    </span>
                  </div>

                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => removeItem(product.id, presentation?.id)} aria-label="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-card space-y-4">
              <h2 className="font-serif text-xl font-bold text-foreground">Resumen de Compra</h2>
              
              {/* Advertencia de mínimo */}
              {subtotal > 0 && subtotal < minOrderAmount && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-xs text-warning leading-relaxed font-medium">
                  El pedido mínimo es de {formatPrice(minOrderAmount)}. Te faltan {formatPrice(minOrderAmount - subtotal)} para continuar.
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})</span>
                  <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-base">
                  <span className="font-bold text-foreground">Total Estimado</span>
                  <span className="font-serif text-2xl font-extrabold text-primary">{formatPrice(subtotal)}</span>
                </div>
              </div>

              {subtotal >= minOrderAmount ? (
                <Link href={ROUTES.checkout} className="block">
                  <Button className="w-full h-12 text-sm font-semibold shadow-warm touch-tactile">
                    Continuar al Checkout <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button className="w-full h-12 text-sm font-semibold" disabled>
                  Continuar al Checkout
                </Button>
              )}

              <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-destructive" onClick={() => setShowClearConfirm(true)}>
                Vaciar Carrito
              </Button>

              <ConfirmDialog
                isOpen={showClearConfirm}
                title="¿Vaciar carrito?"
                message="Se eliminarán todos los productos de tu carrito. Esta acción no se puede deshacer."
                confirmText="Sí, vaciar"
                onConfirm={() => { clearCart(); setShowClearConfirm(false) }}
                onCancel={() => setShowClearConfirm(false)}
                variant="danger"
              />
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-4 text-xs text-muted-foreground flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <p>Retiro exclusivo en sucursal. Pedido mínimo: {formatPrice(minOrderAmount)}. Pago al recoger.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
