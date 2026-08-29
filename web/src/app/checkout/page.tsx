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
import { Lightbulb, PartyPopper, Phone, MapPin, CheckCircle2 } from "lucide-react"
import { presentationUnitPrice } from "@/lib/presentation-quantities"

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { show } = useToast()
  const { config, canPurchase, isLoading: isConfigLoading } = useSystemConfig()
  const minOrderAmount = config['orders.min_amount'] ?? ORDER_CONFIG.minOrderAmount
  
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [savePhoneToProfile, setSavePhoneToProfile] = useState(false)
  const [customerNotes, setCustomerNotes] = useState("")
  const [selectedBranchId, setSelectedBranchId] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedBranch')
      if (saved) return Number(saved)
    }
    return 1
  })
  const [branches, setBranches] = useState<ApiBranch[]>([])
  const [branchesError, setBranchesError] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFullName(`${user.firstName} ${user.lastName}`.trim())
      setPhone(user.phone || "")
    }
  }, [user])

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setBranchesError(false)
        const data = await branchesService.list()
        setBranches(data)
      } catch (err) {
        console.error('Error cargando sucursales:', err)
        setBranchesError(true)
      }
    }
    loadBranches()
  }, [])

  const belowMin = subtotal < minOrderAmount

  const placeOrder = async () => {
    if (placing) return
    setError(null)
    setPlacing(true)
    try {
      if (isAuthenticated && savePhoneToProfile && phone && !user?.phone) {
        try {
          await authService.updateMe({ phone })
        } catch (phoneErr) {
          console.warn('No se pudo guardar el teléfono en el perfil:', phoneErr)
        }
      }

      const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0]
      const branchSlug = selectedBranch?.slug || 'central'

      const payload = {
        branchSlug,
        paymentMethod: 'EFECTIVO' as const,
        customerNotes: customerNotes.trim() || undefined,
        items: items.map(it => ({
          productSlug: it.product.slug,
          quantity: it.quantity,
          presentationId: it.presentation?.id,
        }))
      }

      const response = await ordersService.reserve(payload)
      setOrderNumber(response.orderNumber)
      clearCart()
      setPlaced(true)
      show('¡Pedido realizado con éxito!', { variant: 'success' })
    } catch (e: unknown) {
      const errObj = e as { error?: { message?: string }; message?: string }
      const msg = errObj?.error?.message || errObj?.message || 'Error al procesar el pedido. Intenta nuevamente.'
      setError(msg)
      show(msg, { variant: 'error' })
    } finally {
      setPlacing(false)
    }
  }

  if (isConfigLoading || isAuthLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!canPurchase && !placed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-300/70 bg-amber-50 p-8 shadow-card">
          <h1 className="font-serif text-2xl font-bold text-amber-950">Compras deshabilitadas</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-amber-900">
            El sitio está disponible como catálogo informativo. No se pueden confirmar reservas en este momento.
          </p>
          <Link href={ROUTES.products} className="mt-6 inline-block">
            <Button className="shadow-warm">Volver al catálogo</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card space-y-4">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">Confirmar Pedido</h1>
          <p className="text-muted-foreground">Tu carrito está vacío.</p>
          <Link href={ROUTES.products}><Button className="shadow-warm">Volver a productos</Button></Link>
        </div>
      </div>
    )
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 animate-fade-up">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-success/10 text-success">
            <PartyPopper className="h-10 w-10 animate-bounce-in" />
          </div>
          <h1 className="font-serif text-3xl font-extrabold text-foreground">¡Pedido Reservado con Éxito!</h1>
          <p className="text-muted-foreground max-w-md mx-auto">Tu pedido ha sido registrado en nuestro sistema. Te notificaremos cuando esté listo para recoger.</p>
          {orderNumber && (
            <p className="text-sm text-muted-foreground">Número de pedido: <span className="font-bold text-foreground bg-muted px-2.5 py-1 rounded-md">{orderNumber}</span></p>
          )}
          <p className="text-xs text-muted-foreground">Gracias por tu preferencia en Panadería Svetlana.</p>
          <div className="pt-4 flex flex-wrap justify-center gap-3">
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
      <h1 className="mb-6 font-serif text-3xl font-extrabold text-foreground">Confirmar Pedido</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        {/* Formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos de contacto */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-card space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground">Datos de contacto</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="checkout-fullname" className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground">Nombre completo</label>
                <Input id="checkout-fullname" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ej. Juan Pérez" className="h-11 rounded-xl" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="checkout-phone" className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground">Teléfono (WhatsApp)</label>
                <Input id="checkout-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej. 5555-5555" className="h-11 rounded-xl" />
                {isAuthenticated && !user?.phone && phone && (
                  <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={savePhoneToProfile} 
                      onChange={(e) => setSavePhoneToProfile(e.target.checked)} 
                      className="accent-primary w-4 h-4 rounded" 
                    />
                    Guardar este número en mi cuenta
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Sucursal de retiro */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-card space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground">Sucursal de retiro</h2>
            <p className="text-xs text-muted-foreground">Tu pedido se procesará exclusivamente para retiro en esta sucursal.</p>
            {branches.length > 0 ? (
              <div className="space-y-3 pt-1">
                {branches.filter(b => b.id === selectedBranchId).map(branch => (
                  <div
                    key={branch.id}
                    className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4"
                  >
                    <div>
                      <p className="font-bold text-foreground">{branch.name}</p>
                      <p className="text-xs text-muted-foreground">{branch.address}</p>
                      {branch.phone && (
                        <p className="text-xs text-primary mt-1 inline-flex items-center gap-1 font-semibold">
                          <Phone className="h-3.5 w-3.5" /> {branch.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : branchesError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <p className="font-medium">Error al cargar sucursales</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>Reintentar</Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Cargando sucursales...</p>
            )}
          </div>

          {/* Notas del cliente */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-card space-y-3">
            <h2 className="font-serif text-xl font-bold text-foreground">Notas adicionales</h2>
            <textarea
              className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              rows={3}
              value={customerNotes}
              onChange={e => setCustomerNotes(e.target.value)}
              placeholder="¿Alguna instrucción especial para tu pedido?"
            />
          </div>

          {/* Monto mínimo */}
          {belowMin && (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-xs sm:text-sm text-warning">
              <p className="font-semibold">Pedido mínimo no alcanzado</p>
              <p className="mt-0.5">El monto mínimo para realizar un pedido es de {formatPrice(minOrderAmount)}. Tu subtotal actual es {formatPrice(subtotal)}.</p>
            </div>
          )}

          {/* Mensaje para usuarios no autenticados */}
          {!isAuthenticated && (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-xs sm:text-sm text-warning">
              <p className="font-semibold flex items-center gap-1.5 mb-1">
                <Lightbulb className="h-4 w-4 text-warning animate-pulse" />
                ¿Ya tienes cuenta?
              </p>
              <p>
                <Link href={ROUTES.login} className="underline font-semibold hover:no-underline">Inicia sesión</Link> para guardar tus pedidos y ver tu historial.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs sm:text-sm text-destructive">
              <p className="font-semibold">Error</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Resumen lateral */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-card space-y-4">
            <h2 className="font-serif text-xl font-bold text-foreground">Resumen del Pedido</h2>
            <div className="space-y-3 text-sm">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map(it => (
                  <div key={`${it.product.id}:${it.presentation?.id ?? 'base'}`} className="flex justify-between text-xs py-1 border-b border-border/50">
                    <span className="text-muted-foreground line-clamp-1">{it.quantity}x {it.product.name} {it.presentation ? `(${it.presentation.name})` : ''}</span>
                    <span className="font-medium shrink-0 ml-2">{formatPrice(presentationUnitPrice(it.product, it.presentation) * it.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-base">
                <span className="font-semibold text-foreground">Total a pagar:</span>
                <span className="font-serif text-xl font-extrabold text-primary">{formatPrice(subtotal)}</span>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-sm font-semibold shadow-warm touch-tactile" 
              onClick={() => {
                if (!fullName.trim() || !phone.trim()) {
                  show('Por favor, completa tu nombre y número de teléfono antes de continuar.', { variant: 'error' })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  return
                }
                placeOrder()
              }} 
              disabled={placing || belowMin}
            >
              {placing ? 'Procesando…' : 'Reservar Pedido'}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">Al realizar el pedido, aceptas nuestros términos y condiciones de retiro.</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 text-xs text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <p>Retira en sucursal. Pedido mínimo: {formatPrice(minOrderAmount)}. Pago al recoger.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
