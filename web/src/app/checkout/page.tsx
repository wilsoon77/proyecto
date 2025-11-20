"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useCart } from "@/context/CartContext"
import { SHIPPING, ROUTES } from "@/lib/constants"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Order } from "@/types"

type ShippingMethod = "domicilio" | "recoger"
type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'paypal'

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const [method, setMethod] = useState<ShippingMethod>("domicilio")
  const [payment, setPayment] = useState<PaymentMethod>('efectivo')
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [department, setDepartment] = useState("")
  const [municipality, setMunicipality] = useState("")
  const [zone, setZone] = useState("")
  const [address, setAddress] = useState("")
  const [reference, setReference] = useState("")
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const shippingCost = useMemo(() => {
    if (method === "recoger") return 0
    if (subtotal === 0) return 0
    return subtotal >= SHIPPING.freeShippingThreshold ? 0 : SHIPPING.baseFee
  }, [method, subtotal])

  const total = subtotal + shippingCost
  const belowMin = subtotal > 0 && subtotal < SHIPPING.minOrderAmount && method === "domicilio"

  const canPlace = useMemo(() => {
    if (items.length === 0) return false
    if (method === "domicilio") {
      return Boolean(fullName && phone && department && municipality && address) && !belowMin
    }
    return Boolean(fullName && phone)
  }, [items.length, method, fullName, phone, department, municipality, address, belowMin])

  // Load saved customer data on mount
  useEffect(() => {
    try {
      // Prefill from profile if available
      const profileRaw = localStorage.getItem('profile')
      if (profileRaw) {
        const p = JSON.parse(profileRaw) as Record<string, string>
        const full = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()
        if (full) setFullName(full)
        if (p.phone) setPhone(p.phone)
        if (p.department) setDepartment(p.department)
        if (p.municipality) setMunicipality(p.municipality)
        if (p.zone) setZone(p.zone)
        if (p.address) setAddress(p.address)
      }

      // Then override with last checkout data if exists
      const raw = localStorage.getItem('checkoutCustomer')
      if (raw) {
        const data = JSON.parse(raw) as Record<string, string>
        if (data.fullName) setFullName(data.fullName)
        if (data.phone) setPhone(data.phone)
        if (data.department) setDepartment(data.department)
        if (data.municipality) setMunicipality(data.municipality)
        if (data.zone) setZone(data.zone)
        if (data.address) setAddress(data.address)
        if (data.reference) setReference(data.reference)
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Persist customer data on change
  useEffect(() => {
    if (!hydrated) return
    const data = { fullName, phone, department, municipality, zone, address, reference }
    try { localStorage.setItem('checkoutCustomer', JSON.stringify(data)) } catch {}
  }, [fullName, phone, department, municipality, zone, address, reference, hydrated])

  const placeOrder = async () => {
    if (!canPlace) return
    setPlacing(true)
    // Simulación de orden creada
    await new Promise(r => setTimeout(r, 800))

    const now = new Date()
    const seq = Math.floor(1000 + Math.random() * 9000)
    const ordNumber = `PED-${now.toISOString().slice(0,10).replace(/-/g, '')}-${seq}`

    const order: Order = {
      id: now.getTime(),
      orderNumber: ordNumber,
      status: 'pending',
      items: items,
      subtotal: subtotal,
      deliveryFee: shippingCost,
      discount: 0,
      total: subtotal + shippingCost,
      paymentMethod: payment,
      shippingMethod: method,
      createdAt: now.toISOString(),
    }

    try { localStorage.setItem('lastOrder', JSON.stringify(order)) } catch {}
    setOrderNumber(ordNumber)
    setPlaced(true)
    clearCart()
    setPlacing(false)
  }

  if (items.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-3xl font-bold">Checkout</h1>
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="mb-4 text-gray-700">Tu carrito está vacío.</p>
          <Link href={ROUTES.products}><Button>Volver a productos</Button></Link>
        </div>
      </div>
    )
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-3xl font-bold">¡Pedido realizado!</h1>
        <div className="rounded-lg border bg-white p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <p className="mb-2 text-gray-700">Hemos recibido tu pedido. Te contactaremos por WhatsApp para confirmar.</p>
          {orderNumber && (
            <p className="mb-2 text-sm text-gray-600">Número de pedido: <span className="font-medium">{orderNumber}</span></p>
          )}
          <p className="text-gray-600">Gracias por comprar con nosotros.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href={ROUTES.home}><Button variant="outline">Ir al inicio</Button></Link>
            <Link href={ROUTES.products}><Button>Seguir comprando</Button></Link>
            <Link href={ROUTES.orders}><Button variant="secondary">Ver mi pedido</Button></Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Checkout</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Formulario de envío */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Datos de contacto</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Nombre completo</label>
                <Input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Ej. Juan Pérez" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Teléfono (WhatsApp)</label>
                <Input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Ej. 5555-5555" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Método de entrega</h2>
            <div className="flex gap-3">
              <Button variant={method === "domicilio" ? "default" : "outline"} onClick={()=>setMethod("domicilio")}>A domicilio</Button>
              <Button variant={method === "recoger" ? "default" : "outline"} onClick={()=>setMethod("recoger")}>Recoger en tienda</Button>
            </div>
            {method === "domicilio" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Departamento</label>
                  <Input value={department} onChange={e=>setDepartment(e.target.value)} placeholder="Ej. Guatemala" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Municipio</label>
                  <Input value={municipality} onChange={e=>setMunicipality(e.target.value)} placeholder="Ej. Guatemala" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Zona</label>
                  <Input value={zone} onChange={e=>setZone(e.target.value)} placeholder="Ej. Zona 1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Dirección</label>
                  <Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Calle, No., colonia, etc." />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Referencia</label>
                  <Input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Punto de referencia para el repartidor" />
                </div>
              </div>
            )}
            {belowMin && (
              <p className="mt-3 text-sm text-amber-600">El pedido mínimo para envío a domicilio es de {formatPrice(SHIPPING.minOrderAmount)}.</p>
            )}
          </div>

          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Método de pago</h2>
            <div className="flex flex-wrap gap-3">
              <Button variant={payment === 'efectivo' ? 'default' : 'outline'} onClick={()=>setPayment('efectivo')}>Efectivo</Button>
              <Button variant={payment === 'transferencia' ? 'default' : 'outline'} onClick={()=>setPayment('transferencia')}>Transferencia</Button>
              <Button variant={payment === 'tarjeta' ? 'default' : 'outline'} onClick={()=>setPayment('tarjeta')}>Tarjeta</Button>
              <Button variant={payment === 'paypal' ? 'default' : 'outline'} onClick={()=>setPayment('paypal')}>PayPal</Button>
            </div>
            {payment === 'transferencia' && (
              <div className="mt-4 rounded-md border bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-medium">Instrucciones de transferencia</p>
                <p>Banco: BAC | Cuenta monetaria: 000-000000-0 | Nombre: PanaderIA</p>
                <p>Envía el comprobante por WhatsApp al finalizar el pedido.</p>
              </div>
            )}
            {payment === 'tarjeta' && (
              <div className="mt-4 text-sm text-gray-600">
                <p>Pago con tarjeta disponible en entrega o en tienda (placeholder UI).</p>
              </div>
            )}
            {payment === 'paypal' && (
              <div className="mt-4 rounded-md border bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-medium">Pago con PayPal (demo)</p>
                <p>Próximamente redirigiremos a PayPal para completar el pago.</p>
              </div>
            )}
          </div>
        </div>

        {/* Resumen */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Resumen del pedido</h2>
            <div className="mb-4 max-h-52 space-y-2 overflow-auto pr-1 text-sm">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="truncate pr-2">{product.name} × {quantity}</div>
                  <div className="font-medium">{formatPrice((product.discount ? product.price * (1 - product.discount/100) : product.price) * quantity)}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Envío</span>
                <span className="font-medium">{shippingCost === 0 ? (method === 'recoger' ? 'Recoger en tienda' : 'Gratis') : formatPrice(shippingCost)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">{formatPrice(total)}</span>
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={placeOrder} disabled={!canPlace || placing}>
              {placing ? 'Procesando…' : 'Realizar pedido'}
            </Button>
            <p className="mt-2 text-center text-xs text-gray-500">Al realizar el pedido, aceptas nuestros términos y políticas.</p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
            <p>Envío base: {formatPrice(SHIPPING.baseFee)}. Envío gratis desde {formatPrice(SHIPPING.freeShippingThreshold)}. Pedido mínimo a domicilio: {formatPrice(SHIPPING.minOrderAmount)}.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
