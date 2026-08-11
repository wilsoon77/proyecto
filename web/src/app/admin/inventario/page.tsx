"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Package,
  RefreshCw,
  Warehouse,
} from "lucide-react"
import { inventoryService, rawMaterialsService } from "@/lib/api"
import type { ExpirationLot, RawMaterialInventory } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/components/ui/toast"

const INVENTORY_TOOLS = [
  {
    href: "/admin/inventario/productos",
    title: "Productos terminados",
    description: "Consulta existencias, reservas y disponibilidad por sucursal.",
    icon: Package,
  },
  {
    href: "/admin/inventario/materias-primas",
    title: "Materias primas",
    description: "Registra compras y revisa cantidades contra el mínimo configurado.",
    icon: Warehouse,
  },
  {
    href: "/admin/inventario/caducidades",
    title: "Caducidades",
    description: "Revisa lotes comprados próximos a vencer.",
    icon: CalendarClock,
  },
  {
    href: "/admin/inventario/movimiento",
    title: "Movimientos",
    description: "Registra compras, mermas, ajustes y transferencias.",
    icon: ArrowRightLeft,
  },
  {
    href: "/admin/inventario/conteo",
    title: "Conteo físico",
    description: "Concilia el conteo real al cierre de la jornada.",
    icon: ClipboardCheck,
  },
]

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function InventarioResumenPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [rawInventory, setRawInventory] = useState<RawMaterialInventory[]>([])
  const [expiringLots, setExpiringLots] = useState<ExpirationLot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingExpirations, setIsCheckingExpirations] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const globalScope = user?.role === "ADMIN" || user?.role === "MANAGER"
      const [rawData, expirationData] = await Promise.all([
        rawMaterialsService.getInventory(globalScope ? undefined : user?.branchId ?? undefined),
        inventoryService.listExpirations({
          branch: globalScope ? undefined : user?.branch?.slug,
          status: "expiring",
          days: 7,
        }),
      ])
      setRawInventory(rawData)
      setExpiringLots(expirationData.data)
    } catch (loadError) {
      console.error("Error cargando inventario operativo:", loadError)
      setError("No se pudo cargar el estado del inventario")
      showToast("Error al cargar el inventario", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showToast, user?.role, user?.branch?.slug, user?.branchId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const checkExpirations = async () => {
    setIsCheckingExpirations(true)
    try {
      await inventoryService.checkExpirations()
      await loadData()
      showToast("Caducidades revisadas", "success")
    } catch (checkError) {
      console.error("Error revisando caducidades:", checkError)
      showToast("No se pudieron revisar las caducidades", "error")
    } finally {
      setIsCheckingExpirations(false)
    }
  }

  const lowMaterials = rawInventory.filter((item) => item.isLow)

  if (isLoading && rawInventory.length === 0 && expiringLots.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-5">
          <div className="h-8 w-64 rounded bg-border" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-64 rounded-xl bg-border" />
            <div className="h-64 rounded-xl bg-border" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground sm:text-3xl">
            <Warehouse className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
            Inventario operativo
          </h1>
          <p className="mt-1 text-muted-foreground">
            Revisa las dos alertas que requieren atención: materia prima baja y caducidades próximas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void loadData()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-cream disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
          <button
            onClick={() => void checkExpirations()}
            disabled={isCheckingExpirations}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
          >
            <CalendarClock className={`h-4 w-4 ${isCheckingExpirations ? "animate-spin" : ""}`} />
            Revisar caducidades
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Materia prima baja
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Se alerta al llegar al mínimo configurado.</p>
            </div>
            <span className="rounded-full bg-warning/10 px-3 py-1 text-sm font-bold text-warning">
              {lowMaterials.length}
            </span>
          </div>
          {lowMaterials.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 p-4 text-sm text-success">
              <CheckCircle2 className="h-5 w-5" />
              No hay materias primas por debajo del mínimo.
            </div>
          ) : (
            <div className="space-y-2">
              {lowMaterials.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 p-3">
                  <div>
                    <p className="font-medium text-foreground">{item.rawMaterial.name}</p>
                    <p className="text-xs text-muted-foreground">{item.branch.name}</p>
                  </div>
                  <span className="text-sm font-bold text-warning">
                    {Number(item.quantity).toFixed(1)} {item.rawMaterial.baseUnit}
                  </span>
                </div>
              ))}
              {lowMaterials.length > 6 && (
                <p className="pt-2 text-xs text-muted-foreground">Hay {lowMaterials.length - 6} alertas más.</p>
              )}
            </div>
          )}
          <Link href="/admin/inventario/materias-primas" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
            Gestionar materias primas →
          </Link>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <CalendarClock className="h-5 w-5 text-destructive" />
                Próximos vencimientos
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Solo lotes de productos comprados dentro de 7 días.</p>
            </div>
            <span className="rounded-full bg-destructive/10 px-3 py-1 text-sm font-bold text-destructive">
              {expiringLots.length}
            </span>
          </div>
          {expiringLots.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 p-4 text-sm text-success">
              <CheckCircle2 className="h-5 w-5" />
              No hay lotes próximos a vencer.
            </div>
          ) : (
            <div className="space-y-2">
              {expiringLots.slice(0, 6).map((lot) => (
                <div key={lot.id} className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <div>
                    <p className="font-medium text-foreground">{lot.product.name}</p>
                    <p className="text-xs text-muted-foreground">{lot.branch.name} · {lot.availableQuantity} disponibles</p>
                  </div>
                  <span className="text-right text-sm font-bold text-destructive">
                    {lot.expiresAt ? formatDate(lot.expiresAt) : "Sin fecha"}
                    {lot.daysLeft !== null && <span className="block text-xs font-normal">{lot.daysLeft} días</span>}
                  </span>
                </div>
              ))}
              {expiringLots.length > 6 && (
                <p className="pt-2 text-xs text-muted-foreground">Hay {expiringLots.length - 6} lotes más.</p>
              )}
            </div>
          )}
          <Link href="/admin/inventario/caducidades" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
            Ver caducidades →
          </Link>
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-foreground">Operaciones de inventario</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INVENTORY_TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <Link key={tool.href} href={tool.href} className="group rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary">→</span>
                </div>
                <h3 className="font-semibold text-foreground">{tool.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
