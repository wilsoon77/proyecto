"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { addressesService, ordersService, authService } from "@/lib/api"
import type { ApiAddress, ApiOrder } from "@/lib/api/types"
import { ROUTES } from "@/lib/constants"
import { formatDate, formatPrice } from "@/lib/utils"
import { AlertTriangle, Loader2 } from "lucide-react"

export default function PerfilPage() {
  const { user, isAuthenticated, isLoading: authLoading, updateProfile, logout } = useAuth()
  const router = useRouter()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  
  // Direcciones
  const [addresses, setAddresses] = useState<ApiAddress[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  
  // Últimos pedidos
  const [recentOrders, setRecentOrders] = useState<ApiOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estado para eliminar cuenta
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)

  // Cargar datos del usuario
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "")
      setLastName(user.lastName ?? "")
      setEmail(user.email ?? "")
      setPhone(user.phone ?? "")
    } else if (!authLoading && !isAuthenticated) {
      // Cargar de localStorage si no está autenticado
      try {
        const raw = localStorage.getItem('profile')
        if (raw) {
          const p = JSON.parse(raw)
          setFirstName(p.firstName ?? "")
          setLastName(p.lastName ?? "")
          setEmail(p.email ?? "")
          setPhone(p.phone ?? "")
        }
      } catch {}
    }
  }, [user, authLoading, isAuthenticated])

  // Cargar direcciones y pedidos si está autenticado
  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated) return

      setLoadingAddresses(true)
      setLoadingOrders(true)

      try {
        const [addressList, ordersResponse] = await Promise.all([
          addressesService.list().catch(() => []),
          ordersService.myOrders({ pageSize: 5 }).catch(() => ({ data: [] }))
        ])
        setAddresses(addressList)
        setRecentOrders(ordersResponse.data)
      } catch (err) {
        console.error('Error cargando datos del usuario:', err)
      } finally {
        setLoadingAddresses(false)
        setLoadingOrders(false)
      }
    }

    if (!authLoading) {
      loadUserData()
    }
  }, [isAuthenticated, authLoading])

  const save = async () => {
    setSaving(true)
    setError(null)

    try {
      if (isAuthenticated) {
        // Actualizar en la API
        await updateProfile({ firstName, lastName, phone })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        // Guardar en localStorage
        const data = { firstName, lastName, email, phone }
        localStorage.setItem('profile', JSON.stringify(data))
        // Prellenar checkout
        const checkout = {
          fullName: `${firstName} ${lastName}`.trim(),
          phone,
          department: "",
          municipality: "",
          zone: "",
          address: "",
          reference: "",
        }
        localStorage.setItem('checkoutCustomer', JSON.stringify(checkout))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error('Error guardando perfil:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push(ROUTES.home)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "ELIMINAR") return
    
    setDeleting(true)
    setError(null)
    
    try {
      await authService.deactivate()
      logout()
      router.push(ROUTES.home)
    } catch (err) {
      console.error('Error desactivando cuenta:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar la cuenta')
      setDeleting(false)
    }
  }

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`${ROUTES.login}?returnUrl=${encodeURIComponent('/perfil')}`)
    }
  }, [authLoading, isAuthenticated, router])

  // Mostrar loading o redirigiendo
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-600">{authLoading ? 'Cargando...' : 'Redirigiendo al login...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <Button variant="outline" onClick={handleLogout}>Cerrar sesión</Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Información personal */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Información personal</h2>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <Input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Juan" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Apellido</label>
              <Input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Pérez" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Correo</label>
              <Input value={email} disabled className="bg-gray-50" />
              <p className="mt-1 text-xs text-gray-500">El correo no se puede cambiar</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Teléfono</label>
              <Input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="5555-5555" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
            {saved && <span className="text-sm text-emerald-700">✓ Cambios guardados</span>}
          </div>
        </div>

        {/* Direcciones */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Mis direcciones</h2>
          {loadingAddresses ? (
            <div className="animate-pulse space-y-2">
              <div className="h-16 rounded bg-gray-200" />
              <div className="h-16 rounded bg-gray-200" />
            </div>
          ) : addresses.length === 0 ? (
            <p className="text-gray-600">No tienes direcciones guardadas. Se crearán automáticamente cuando hagas un pedido a domicilio.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map(addr => (
                <div key={addr.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{addr.street}</p>
                  <p className="text-gray-600">{addr.city}{addr.state ? `, ${addr.state}` : ''}{addr.zone ? ` - ${addr.zone}` : ''}</p>
                  {addr.reference && <p className="text-gray-500 text-xs">Ref: {addr.reference}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimos pedidos */}
      <div className="mt-6 rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Últimos pedidos</h2>
          <Link href={ROUTES.orders} className="text-sm text-primary hover:underline">
            Ver todos →
          </Link>
        </div>
        {loadingOrders ? (
          <div className="animate-pulse space-y-2">
            <div className="h-12 rounded bg-gray-200" />
            <div className="h-12 rounded bg-gray-200" />
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-gray-600">Aún no tienes pedidos.</p>
        ) : (
          <div className="divide-y">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-gray-600">{formatDate(new Date(order.createdAt))}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                  <p className="text-sm text-gray-600">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zona de peligro - Eliminar cuenta */}
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-red-700">Eliminar cuenta</h2>
            <p className="mt-1 text-sm text-red-600">
              Esta acción desactivará tu cuenta. No podrás iniciar sesión hasta que contactes a soporte. 
              Tu historial de pedidos se conservará.
            </p>
            
            {!showDeleteConfirm ? (
              <Button 
                variant="outline" 
                className="mt-4 border-red-300 text-red-600 hover:bg-red-100"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Eliminar mi cuenta
              </Button>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-red-700 font-medium">
                  Para confirmar, escribe ELIMINAR en el campo de abajo:
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Escribe ELIMINAR"
                  className="max-w-xs border-red-300 focus:border-red-500 focus:ring-red-500"
                />
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "ELIMINAR" || deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      "Confirmar eliminación"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText("")
                    }}
                    disabled={deleting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
