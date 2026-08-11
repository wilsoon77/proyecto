"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { authService, ordersService } from "@/lib/api"
import type { ApiOrder } from "@/lib/api/types"
import { ROUTES } from "@/lib/constants"
import { formatDate, formatPrice } from "@/lib/utils"
import { TriangleAlert as AlertTriangle, Loader as Loader2 } from "lucide-react"

export default function PerfilPage() {
  const { user, isAuthenticated, isLoading: authLoading, updateProfile, logout } = useAuth()
  const router = useRouter()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [recentOrders, setRecentOrders] = useState<ApiOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "")
      setLastName(user.lastName ?? "")
      setEmail(user.email ?? "")
      setPhone(user.phone ?? "")
    }
  }, [user])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    setLoadingOrders(true)
    ordersService.myOrders({ pageSize: 5 })
      .then((response) => setRecentOrders(response.data))
      .catch((loadError) => console.error("Error cargando pedidos:", loadError))
      .finally(() => setLoadingOrders(false))
  }, [isAuthenticated, authLoading])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.login + "?returnUrl=" + encodeURIComponent("/perfil"))
    }
  }, [authLoading, isAuthenticated, router])

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateProfile({ firstName, lastName, phone })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "ELIMINAR") return
    setDeleting(true)
    setError(null)
    try {
      await authService.deactivate()
      logout()
      router.push(ROUTES.home)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Error al desactivar la cuenta")
      setDeleting(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push(ROUTES.home)
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">{authLoading ? "Cargando..." : "Redirigiendo al login..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mi perfil</h1>
        <Button variant="outline" onClick={handleLogout}>Cerrar sesión</Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Información personal</h2>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre</label>
              <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Apellido</label>
              <Input value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Correo</label>
              <Input value={email} disabled className="bg-cream" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Teléfono</label>
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
            {saved && <span className="text-sm text-emerald-700">Cambios guardados</span>}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Últimos pedidos</h2>
            <Link href={ROUTES.orders} className="text-sm text-primary hover:underline">Ver todos</Link>
          </div>
          {loadingOrders ? (
            <div className="animate-pulse space-y-2">
              <div className="h-12 rounded bg-border" />
              <div className="h-12 rounded bg-border" />
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-muted-foreground">Aún no tienes pedidos.</p>
          ) : (
            <div className="divide-y">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(new Date(order.createdAt))}</p>
                    <p className="text-xs text-muted-foreground">Retiro en {order.branch?.name || "sucursal"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                    <p className="text-sm text-muted-foreground">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/10 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-destructive">Desactivar cuenta</h2>
            <p className="mt-1 text-sm text-destructive">
              Esta acción desactivará tu cuenta y no podrás iniciar sesión hasta contactar a soporte.
            </p>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                className="mt-4 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Desactivar mi cuenta
              </Button>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-destructive">Escribe ELIMINAR para confirmar:</p>
                <Input
                  value={deleteConfirmText}
                  onChange={(event) => setDeleteConfirmText(event.target.value)}
                  className="max-w-xs border-destructive/30"
                />
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "ELIMINAR" || deleting}
                  >
                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirmar
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
