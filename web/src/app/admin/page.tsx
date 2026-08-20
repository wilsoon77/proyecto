"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  Package,
  RefreshCw,
  Wheat,
} from "lucide-react"
import {
  inventoryService,
  notificationsService,
  productionService,
  rawMaterialsService,
} from "@/lib/api"
import type {
  ExpirationLot,
  Notification,
  ProductionLog,
  RawMaterialInventory,
} from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import TelegramAssistantButton from "@/components/admin/TelegramAssistantButton"

const ALERT_TYPES = new Set([
  "inventory.raw_material_low",
  "inventory.expiration_warning",
])

function asNumber(value: string | number | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-GT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AdminOperationPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterialInventory[]>([])
  const [expiringLots, setExpiringLots] = useState<ExpirationLot[]>([])
  const [production, setProduction] = useState<ProductionLog[]>([])
  const [activity, setActivity] = useState<Array<{ date: string; produced: number; sold: number; waste: number }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingExpirations, setIsCheckingExpirations] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [clock, setClock] = useState<Date | null>(null)

  useEffect(() => {
    const updateClock = () => setClock(new Date())
    updateClock()
    const timer = window.setInterval(updateClock, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const loadOperationalData = useCallback(async () => {
    setIsLoading(true)
    const results = await Promise.allSettled([
      notificationsService.getHistory(1, 20),
      rawMaterialsService.getInventory(user?.branchId ?? undefined),
      inventoryService.listExpirations({
        branch: user?.branch?.slug,
        status: "expiring",
        days: 7,
      }),
      productionService.getTodayProduction(user?.role === "ADMIN" || user?.role === "MANAGER" ? undefined : user?.branchId ?? undefined),
      inventoryService.getOperationalActivity({
        branchSlug: user?.role === "ADMIN" || user?.role === "MANAGER" ? undefined : user?.branch?.slug,
        days: 7,
      }),
    ])

    const history = results[0]
    if (history.status === "fulfilled") {
      setNotifications(history.value.data.filter((item) => ALERT_TYPES.has(item.type)))
    }
    const raw = results[1]
    if (raw.status === "fulfilled") setRawMaterials(raw.value)
    const expirations = results[2]
    if (expirations.status === "fulfilled") setExpiringLots(expirations.value.data)
    const productionResult = results[3]
    if (productionResult.status === "fulfilled") setProduction(productionResult.value)
    const activityResult = results[4]
    if (activityResult.status === "fulfilled") setActivity(activityResult.value.data)

    setLastUpdated(new Date())
    setIsLoading(false)
  }, [user?.role, user?.branchId, user?.branch?.slug])

  useEffect(() => {
    void loadOperationalData()
  }, [loadOperationalData])

  const checkExpirations = async () => {
    setIsCheckingExpirations(true)
    try {
      await inventoryService.checkExpirations()
      await loadOperationalData()
    } finally {
      setIsCheckingExpirations(false)
    }
  }

  const lowMaterials = rawMaterials.filter((item) => item.isLow)
  const hour = clock?.getHours() ?? -1
  const timeGreeting = hour >= 5 && hour < 12 ? "Buenos días" : hour >= 12 && hour < 19 ? "Buenas tardes" : "Buenas noches"
  const greeting = user?.firstName ? `${timeGreeting}, ${user.firstName}` : "Panel operativo"
  const producedUnits = production.reduce((sum, item) => sum + asNumber(item.unitsProduced), 0)
  const maxActivity = Math.max(1, ...activity.flatMap((item) => [item.produced, item.sold, item.waste]))

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary">
            {clock ? clock.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Operación de la panadería</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alertas y tareas de inventario, producción y cierre.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={checkExpirations}
            disabled={isCheckingExpirations}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw className={"h-4 w-4 " + (isCheckingExpirations ? "animate-spin" : "")} />
            Revisar caducidades
          </button>
          <TelegramAssistantButton />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/inventario/materias-primas" className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm transition hover:border-amber-400 hover:shadow-md">
          <div className="flex items-center justify-between">
            <Wheat className="h-5 w-5 text-amber-600" />
            <span className="text-3xl font-bold text-amber-950">{lowMaterials.length}</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-amber-950">Materias primas bajas</p>
          <p className="text-xs text-amber-800">Revisar y reabastecer</p>
        </Link>
        <Link href="/admin/inventario/caducidades?status=expiring" className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm transition hover:border-orange-400 hover:shadow-md">
          <div className="flex items-center justify-between">
            <CalendarClock className="h-5 w-5 text-orange-600" />
            <span className="text-3xl font-bold text-orange-950">{expiringLots.length}</span>
          </div>
          <p className="mt-3 text-sm font-medium">Próximos a vencer</p>
          <p className="text-xs text-muted-foreground">Productos comprados, próximos 7 días</p>
        </Link>
        <Link href="/admin/produccion" className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm transition hover:border-primary hover:shadow-md">
          <div className="flex items-center justify-between">
            <Factory className="h-5 w-5 text-primary" />
            <span className="text-3xl font-bold text-primary">{producedUnits}</span>
          </div>
          <p className="mt-3 text-sm font-semibold">Unidades producidas hoy</p>
          <p className="text-xs text-muted-foreground">Amasijos registrados: {production.length}</p>
        </Link>
        <Link href="/admin/cierre-dia" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md">
          <div className="flex items-center justify-between">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          </div>
          <p className="mt-3 text-sm font-semibold text-emerald-950">Cierre diario</p>
          <p className="text-xs text-emerald-800">Conciliar existencias antes de terminar</p>
        </Link>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Movimiento operativo</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Últimos 7 días · {user?.role === "ADMIN" || user?.role === "MANAGER" ? "ambas sucursales" : "sucursal asignada"}
          </p>
        </div>
        <div className="mt-5 flex h-48 items-end gap-2 border-b border-border pb-1">
          {activity.map((day) => {
            const label = new Date(`${day.date}T12:00:00`).toLocaleDateString("es-GT", { weekday: "short" }).replace(".", "")
            return (
              <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${day.date}: ${day.produced} producidas, ${day.sold} vendidas, ${day.waste} mermas`}>
                <div className="flex h-36 w-full items-end justify-center gap-0.5 sm:gap-1">
                  <span className="w-1/4 rounded-t bg-primary/80" style={{ height: `${Math.max(2, (day.produced / maxActivity) * 100)}%` }} />
                  <span className="w-1/4 rounded-t bg-chart-3/80" style={{ height: `${Math.max(2, (day.sold / maxActivity) * 100)}%` }} />
                  <span className="w-1/4 rounded-t bg-orange-400/80" style={{ height: `${Math.max(2, (day.waste / maxActivity) * 100)}%` }} />
                </div>
                <span className="text-[10px] capitalize text-muted-foreground">{label}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-primary/80" />Producción</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-chart-3/80" />Ventas</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-orange-400/80" />Mermas</span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h2 className="font-semibold">Alertas activas</h2>
            </div>
            <Link href="/admin/historial" className="text-xs font-medium text-primary hover:underline">
              Ver historial
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Cargando alertas...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No hay alertas recientes.</p>
            ) : (
              notifications.slice(0, 8).map((item) => (
                <div key={item.id} className="flex gap-3 p-4">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              <h2 className="font-semibold">Productos próximos a vencer</h2>
            </div>
            <Link href="/admin/inventario/caducidades" className="text-xs font-medium text-primary hover:underline">
              Ver lotes
            </Link>
          </div>
          <div className="divide-y divide-border">
            {expiringLots.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No hay lotes próximos a vencer.</p>
            ) : (
              expiringLots.slice(0, 8).map((lot) => (
                <div key={lot.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{lot.product.name}</p>
                    <p className="text-xs text-muted-foreground">{lot.branch.name} · vence {lot.expiresAt}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{lot.availableQuantity} uds.</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wheat className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold">Materias primas bajo mínimo</h2>
          </div>
          <Link href="/admin/inventario/materias-primas" className="text-xs font-medium text-primary hover:underline">
            Gestionar inventario
          </Link>
        </div>
        {lowMaterials.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No hay materias primas bajo mínimo en la sucursal consultada.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lowMaterials.slice(0, 9).map((item) => (
              <div key={item.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-950">{item.rawMaterial.name}</p>
                <p className="mt-1 text-xs text-amber-800">
                  {asNumber(item.quantity).toFixed(1)} {item.rawMaterial.baseUnit} · mínimo {asNumber(item.rawMaterial.minStock).toFixed(1)}
                </p>
                <p className="mt-1 text-[11px] text-amber-700">{item.branch.name}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-right text-xs text-muted-foreground">
        {lastUpdated ? "Actualizado " + lastUpdated.toLocaleTimeString("es-GT") : "Sin actualizar"}
      </p>
    </div>
  )
}
