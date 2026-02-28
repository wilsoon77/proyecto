"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useCart } from "@/context/CartContext"
import { useAuth } from "@/context/AuthContext"
import { ORDER_CONFIG, ROUTES } from "@/lib/constants"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ordersService, branchesService } from "@/lib/api"
import type { ApiBranch } from "@/lib/api/types"

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()
  
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [customerNotes, setCustomerNotes] = useState("")
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Selección de sucursal para recoger
  const [branches, setBranches] = useState<ApiBranch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)

  const belowMin = subtotal > 0 && subtotal < ORDER_CONFIG.minOrderAmount

  const canPlace = useMemo(() => {
    if (items.length === 0) return false
    if (belowMin) return false
    return Boolean(fullName && phone && selectedBranchId)
  }, [items.length, fullName, phone, selectedBranchId, belowMin])

  // Cargar sucursales
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const branchList = await branchesService.list()
        setBranches(branchList)
        if (branchList.length > 0 && !selectedBranchId) {
          setSelectedBranchId(branchList[0].id)
        }
      } catch (err) {
        console.error('Error cargando sucursales:', err)
      }
    }
    loadBranches()
  }, [selectedBranchId])

  // Pre-fill datos del usuario
  useEffect(() => {
    try {
      if (user) {
        const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
        if (full) setFullName(full)
        if (user.phone) setPhone(user.phone)
      } else {
        const profileRaw = localStorage.getItem('profile')
        if (profileRaw) {
          const p = JSON.parse(profileRaw) as Record<string, string>
          const full = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()
          if (full) setFullName(full)
          if (p.phone) setPhone(p.phone)
        }
      }

      const raw = localStorage.getItem('checkoutCustomer')
      if (raw) {
        const data = JSON.parse(raw) as Record<string, string>
        if (data.fullName && !user) setFullName(data.fullName)
        if (data.phone && !user) setPhone(data.phone)
      }
    } catch {}
    setHydrated(true)
  }, [user])

  // Persistir datos del cliente
  useEffect(() => {
    if (!hydrated) return
    const data = { fullName, phone }
    try { localStorage.setItem('checkoutCustomer', JSON.stringify(data)) } catch {}
  }, [fullName, phone, hydrated])

  const placeOrder = async () => {
    if (!canPlace) return
    setPlacing(true)
    setError(null)

    try {
      if (isAuthenticated && user) {
        const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0]
        if (!selectedBranch) {
          throw new Error('Debes seleccionar una sucursal')
        }

        const orderData = {
          branchSlug: selectedBranch.slug,
          items: items.map(item => ({
            productSlug: item.product.slug,
            quantity: item.quantity
          }))
        }

        const order = await ordersService.reserve(orderData)
        setOrderNumber(order.orderNumber)
        setPlaced(true)
        clearCart()
      } else {
        // Usuario no autenticado: simular orden (guardar en localStorage)
        await new Promise(r => setTimeout(r, 800))

        const now = new Date()
        const seq = Math.floor(1000 + Math.random() * 9000)
        const ordNumber = `PED-${now.toISOString().slice(0,10).replace(/-/g, '')}-${seq}`

        const selectedBranch = branches.find(b => b.id === selectedBranchId)

        const order = {
          id: now.getTime(),
          orderNumber: ordNumber,
          status: 'PENDING',
          items: items.map(item => ({
            product: item.product,
            quantity: item.quantity,
            price: item.product.price,
          })),
          subtotal,
          total: subtotal,
          branch: selectedBranch ? { name: selectedBranch.name } : null,
          createdAt: now.toISOString(),
          customerInfo: { fullName, phone },
        }

        try { localStorage.setItem('lastOrder', JSON.stringify(order)) } catch {}
        setOrderNumber(ordNumber)
        setPlaced(true)
        clearCart()
      }
    } catch (err) {
      console.error('Error al crear orden:', err)
      setError(err instanceof Error ? err.message : 'Error al procesar el pedido. Intenta de nuevo.')
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-2xl sm:text-3xl font-bold">Confirmar Pedido</h1>
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
        <h1 className="mb-4 text-2xl sm:text-3xl font-bold">¡Pedido reservado!</h1>
        <div className="rounded-lg border bg-white p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <p className="mb-2 text-gray-700">Tu pedido ha sido registrado. Te notificaremos cuando esté listo para recoger.</p>
          {orderNumber && (
            <p className="mb-2 text-sm text-gray-600">Número de pedido: <span className="font-medium">{orderNumber}</span></p>
          )}
          <p className="text-gray-600">Gracias por tu preferencia.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
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
      <h1 className="mb-6 text-2xl sm:text-3xl font-bold text-gray-900">Confirmar Pedido</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos de contacto */}
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

          {/* Sucursal de retiro */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Sucursal de retiro</h2>
            <p className="mb-3 text-sm text-gray-600">Selecciona la sucursal donde deseas recoger tu pedido.</p>
            {branches.length > 0 ? (
              <div className="space-y-3">
                {branches.map(branch => (
                  <label
                    key={branch.id}
                    className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                      selectedBranchId === branch.id 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="branch"
                      checked={selectedBranchId === branch.id}
                      onChange={() => setSelectedBranchId(branch.id)}
                      className="mt-1 accent-amber-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{branch.name}</p>
                      <p className="text-sm text-gray-600">{branch.address}</p>
                      {branch.phone && <p className="text-sm text-gray-500">📞 {branch.phone}</p>}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Cargando sucursales...</p>
            )}
          </div>

          {/* Notas del cliente */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Notas adicionales</h2>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={3}
              value={customerNotes}
              onChange={e => setCustomerNotes(e.target.value)}
              placeholder="¿Alguna instrucción especial para tu pedido?"
            />
          </div>

          {/* Monto mínimo */}
          {belowMin && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Pedido mínimo no alcanzado</p>
              <p>El monto mínimo para realizar un pedido es de {formatPrice(ORDER_CONFIG.minOrderAmount)}. Tu subtotal actual es {formatPrice(subtotal)}.</p>
            </div>
          )}

          {/* Mensaje para usuarios no autenticados */}
          {!isAuthenticated && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">💡 ¿Ya tienes cuenta?</p>
              <p>
                <Link href={ROUTES.login} className="underline hover:no-underline">Inicia sesión</Link> para guardar tus pedidos y ver tu historial.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
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
              <div className="flex items-center justify-between border-t pt-2 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">{formatPrice(subtotal)}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">Pago al recoger en sucursal</p>
            <Button className="mt-4 w-full" onClick={placeOrder} disabled={!canPlace || placing}>
              {placing ? 'Procesando…' : 'Reservar Pedido'}
            </Button>
            <p className="mt-2 text-center text-xs text-gray-500">Al realizar el pedido, aceptas nuestros términos y políticas.</p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
            <p>📍 Retira en sucursal. Pedido mínimo: {formatPrice(ORDER_CONFIG.minOrderAmount)}. Pago al recoger.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
