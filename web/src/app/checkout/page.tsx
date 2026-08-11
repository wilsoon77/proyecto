"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/CartContext"
import { useAuth } from "@/context/AuthContext"
import { ORDER_CONFIG, ROUTES } from "@/lib/constants"
import { useSystemConfig } from "@/context/SystemConfigContext"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ordersService, branchesService, authService } from "@/lib/api"
import type { ApiBranch } from "@/lib/api/types"
import { useToast } from "@/context/ToastContext"
import { Lightbulb } from "lucide-react"
import { presentationUnitPrice } from "@/lib/presentation-quantities"

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { show } = useToast()
  const { config } = useSystemConfig()
  const minOrderAmount = config['orders.min_amount'] ?? ORDER_CONFIG.minOrderAmount
  
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/ingresar?redirect=/checkout')
    }
  }, [isLoading, isAuthenticated, router])

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
  const [branchesError, setBranchesError] = useState(false)
  const [savePhoneToProfile, setSavePhoneToProfile] = useState(true)

  const belowMin = subtotal > 0 && subtotal < minOrderAmount

  const canPlace = useMemo(() => {
    if (items.length === 0) return false
    if (belowMin) return false
    return Boolean(fullName && phone && selectedBranchId)
  }, [items.length, fullName, phone, selectedBranchId, belowMin])

  // Cargar sucursales
  useEffect(() => {
    const loadBranches = async () => {
      setBranchesError(false)
      try {
        const branchList = await branchesService.list()
        setBranches(branchList)

        const preferredBranchSlug = localStorage.getItem('selectedBranch')
        if (preferredBranchSlug) {
          const match = branchList.find(b => b.slug === preferredBranchSlug)
          if (match) setSelectedBranchId(match.id)
          else if (branchList.length > 0) setSelectedBranchId(branchList[0].id)
        } else if (branchList.length > 0) {
          setSelectedBranchId(branchList[0].id)
        }
      } catch (err) {
        console.error('Error cargando sucursales:', err)
        setBranchesError(true)
      }
    }
    loadBranches()
  }, [])

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
    } catch { }
    setHydrated(true)
  }, [user])

  // Persistir datos del cliente
  useEffect(() => {
    if (!hydrated) return
    const data = { fullName, phone }
    try { localStorage.setItem('checkoutCustomer', JSON.stringify(data)) } catch { }
  }, [fullName, phone, hydrated])

  const placeOrder = async () => {
    if (!canPlace) return
    setPlacing(true)
    setError(null)

    try {
      const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0]
      if (!selectedBranch) {
        throw new Error('Debes seleccionar una sucursal')
      }

      const orderData = {
        branchSlug: selectedBranch.slug,
        customerNotes: customerNotes.trim() || undefined,
        items: items.map(item => ({
          productSlug: item.product.slug,
          quantity: item.quantity,
          presentationId: item.presentation?.id,
        }))
      }

      const order = await ordersService.reserve(orderData)
      
      // Guardar teléfono en el perfil si así lo decidió el usuario
      if (savePhoneToProfile && phone && user && !user.phone) {
        try {
          await authService.updateMe({ phone: phone.trim() })
        } catch (e) {
          console.warn('No se pudo guardar el teléfono en el perfil', e)
        }
      }

      setOrderNumber(order.orderNumber)
      setPlaced(true)
      clearCart()
    } catch (err: any) {
      console.error('Error al crear orden:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Error al procesar el pedido. Intenta de nuevo.'
      const finalMsg = Array.isArray(errorMsg) ? errorMsg[0] : errorMsg

      if (finalMsg.toLowerCase().includes('stock')) {
        show('El stock de alguno de tus productos cambió o se agotó. Hemos limpiado tu carrito por seguridad.', { variant: 'error' })
        clearCart()
        setTimeout(() => {
          window.location.href = '/productos'
        }, 5000)
      } else {
        setError(finalMsg)
        show(finalMsg, { variant: 'error' })
      }
    } finally {
      setPlacing(false)
    }
  }

  // Pantalla de carga mientras verificamos la sesión
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Verificando sesión...</p>
      </div>
    )
  }

  if (items.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-4 font-display text-2xl sm:text-3xl font-bold">Confirmar Pedido</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
          <p className="mb-4 text-card-foreground">Tu carrito está vacío.</p>
          <Link href={ROUTES.products}><Button>Volver a productos</Button></Link>
        </div>
      </div>
    )
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-4 font-display text-2xl sm:text-3xl font-bold">¡Pedido reservado!</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
          <div className="text-6xl mb-4 animate-bounce-in">🎉</div>
          <p className="mb-2 text-card-foreground">Tu pedido ha sido registrado. Te notificaremos cuando esté listo para recoger.</p>
          {orderNumber && (
            <p className="mb-2 text-sm text-muted-foreground">Número de pedido: <span className="font-medium text-foreground">{orderNumber}</span></p>
          )}
          <p className="text-muted-foreground">Gracias por tu preferencia.</p>
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
      <h1 className="mb-6 font-display text-2xl sm:text-3xl font-bold text-foreground">Confirmar Pedido</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos de contacto */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-xl font-semibold">Datos de contacto</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="checkout-fullname" className="mb-1 block text-sm font-medium text-foreground">Nombre completo</label>
                <Input id="checkout-fullname" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ej. Juan Pérez" />
              </div>
              <div>
                <label htmlFor="checkout-phone" className="mb-1 block text-sm font-medium text-foreground">Teléfono (WhatsApp)</label>
                <Input id="checkout-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej. 5555-5555" />
                {isAuthenticated && !user?.phone && phone && (
                  <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={savePhoneToProfile} 
                      onChange={(e) => setSavePhoneToProfile(e.target.checked)} 
                      className="accent-primary w-4 h-4" 
                    />
                    Guardar este número en mi cuenta
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Sucursal de retiro (Solo visualización) */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-xl font-semibold">Sucursal de retiro</h2>
            <p className="mb-3 text-sm text-muted-foreground">Tu pedido se procesará exclusivamente para retiro en esta sucursal.</p>
            {branches.length > 0 ? (
              <div className="space-y-3">
                {branches.filter(b => b.id === selectedBranchId).map(branch => (
                  <div
                    key={branch.id}
                    className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{branch.name}</p>
                      <p className="text-sm text-muted-foreground">{branch.address}</p>
                      {branch.phone && <p className="text-sm text-primary mt-1">📞 {branch.phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : branchesError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-medium">Error al cargar sucursales</p>
                <p>Verifica tu conexión a internet e intenta de nuevo.</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>Reintentar</Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Cargando sucursales...</p>
            )}
          </div>

          {/* Notas del cliente */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-xl font-semibold">Notas adicionales</h2>
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
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
              <p className="font-medium">Pedido mínimo no alcanzado</p>
              <p>El monto mínimo para realizar un pedido es de {formatPrice(minOrderAmount)}. Tu subtotal actual es {formatPrice(subtotal)}.</p>
            </div>
          )}

          {/* Mensaje para usuarios no autenticados */}
          {!isAuthenticated && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
              <p className="font-medium flex items-center gap-1.5 mb-1">
                <Lightbulb className="h-4 w-4 text-warning animate-pulse" />
                ¿Ya tienes cuenta?
              </p>
              <p>
                <Link href={ROUTES.login} className="underline hover:no-underline">Inicia sesión</Link> para guardar tus pedidos y ver tu historial.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Resumen */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-xl font-semibold">Resumen del pedido</h2>
            <div className="mb-4 max-h-52 space-y-2 overflow-auto pr-1 text-sm">
              {items.map(({ product, quantity, presentation }) => (
                <div key={`${product.id}:${presentation?.id ?? 'base'}`} className="flex items-center justify-between">
<div className="truncate pr-2">{product.name}{presentation ? ` (${presentation.name})` : ''} × {quantity}</div>
                  <div className="font-medium">{formatPrice(presentationUnitPrice(product, presentation) * quantity)}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between border-t pt-2 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">{formatPrice(subtotal)}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Pago al recoger en sucursal</p>
            <Button 
              className="mt-4 w-full shadow-warm" 
              onClick={() => {
                if (!canPlace) {
                  show('Por favor, completa Nombre, Teléfono y Sucursal para ordenar.', { variant: 'error' })
                  // Hacemos un poco de scroll hacia arriba por si no los ven
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  return
                }
                placeOrder()
              }} 
              disabled={placing}
            >
              {placing ? 'Procesando…' : 'Reservar Pedido'}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">Al realizar el pedido, aceptas nuestros términos y políticas.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <p>📍 Retira en sucursal. Pedido mínimo: {formatPrice(minOrderAmount)}. Pago al recoger.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
