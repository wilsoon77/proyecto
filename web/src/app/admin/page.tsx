"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Factory,
  LineChart,
  Package,
  RefreshCw,
  TrendingUp,
  Wheat,
} from "lucide-react"
import {
  branchesService,
  inventoryService,
  notificationsService,
  productionService,
  rawMaterialsService,
} from "@/lib/api"
import type {
  ApiBranch,
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

type ChartType = "bars" | "lines" | "area"
type DayRange = 7 | 14 | 30

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

/**
 * Calcula un path SVG suave (curva Bézier cúbica) a partir de una lista de coordenadas {x, y}.
 */
function getBezierPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return path
}

export default function AdminOperationPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterialInventory[]>([])
  const [expiringLots, setExpiringLots] = useState<ExpirationLot[]>([])
  const [production, setProduction] = useState<ProductionLog[]>([])
  const [activity, setActivity] = useState<Array<{ date: string; produced: number; sold: number; waste: number }>>([])
  const [branches, setBranches] = useState<ApiBranch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingExpirations, setIsCheckingExpirations] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [clock, setClock] = useState<Date | null>(null)

  // Controles de Gráfica y Filtros
  const [chartType, setChartType] = useState<ChartType>("bars")
  const [selectedDays, setSelectedDays] = useState<DayRange>(7)
  const [selectedBranchSlug, setSelectedBranchSlug] = useState<string>("")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const isGlobalRole = user?.role === "ADMIN" || user?.role === "MANAGER"

  useEffect(() => {
    const updateClock = () => setClock(new Date())
    updateClock()
    const timer = window.setInterval(updateClock, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  // Cargar lista de sucursales disponibles
  useEffect(() => {
    let isMounted = true
    branchesService.list().then((list) => {
      if (isMounted) {
        setBranches(list.filter((b) => b.isActive))
      }
    }).catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  const loadOperationalData = useCallback(async () => {
    setIsLoading(true)
    const effectiveBranchSlug = isGlobalRole
      ? (selectedBranchSlug || undefined)
      : user?.branch?.slug

    const effectiveBranchId = isGlobalRole
      ? (selectedBranchSlug ? branches.find((b) => b.slug === selectedBranchSlug)?.id : undefined)
      : user?.branchId ?? undefined

    const results = await Promise.allSettled([
      notificationsService.getHistory(1, 20),
      rawMaterialsService.getInventory(effectiveBranchId),
      inventoryService.listExpirations({
        branch: effectiveBranchSlug,
        status: "expiring",
        days: 7,
      }),
      productionService.getTodayProduction(effectiveBranchId),
      inventoryService.getOperationalActivity({
        branchSlug: effectiveBranchSlug,
        days: selectedDays,
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
  }, [isGlobalRole, selectedBranchSlug, user?.branch?.slug, user?.branchId, branches, selectedDays])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOperationalData(), 0)
    return () => window.clearTimeout(timer)
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

  // Métricas acumuladas del período seleccionado
  const totals = useMemo(() => {
    return activity.reduce(
      (acc, curr) => ({
        produced: acc.produced + curr.produced,
        sold: acc.sold + curr.sold,
        waste: acc.waste + curr.waste,
      }),
      { produced: 0, sold: 0, waste: 0 }
    )
  }, [activity])

  const maxActivity = Math.max(1, ...activity.flatMap((item) => [item.produced, item.sold, item.waste]))

  // Coordenadas calculadas para la gráfica SVG de líneas/área
  const svgMetrics = useMemo(() => {
    const width = 800
    const height = 220
    const paddingLeft = 40
    const paddingRight = 20
    const paddingTop = 20
    const paddingBottom = 35
    const innerWidth = width - paddingLeft - paddingRight
    const innerHeight = height - paddingTop - paddingBottom

    const count = activity.length
    const stepX = count > 1 ? innerWidth / (count - 1) : innerWidth

    const pointsProduced = activity.map((item, idx) => ({
      x: paddingLeft + idx * stepX,
      y: paddingTop + innerHeight - (item.produced / maxActivity) * innerHeight,
    }))

    const pointsSold = activity.map((item, idx) => ({
      x: paddingLeft + idx * stepX,
      y: paddingTop + innerHeight - (item.sold / maxActivity) * innerHeight,
    }))

    const pointsWaste = activity.map((item, idx) => ({
      x: paddingLeft + idx * stepX,
      y: paddingTop + innerHeight - (item.waste / maxActivity) * innerHeight,
    }))

    const baselineY = paddingTop + innerHeight

    // Paths para líneas
    const pathProduced = getBezierPath(pointsProduced)
    const pathSold = getBezierPath(pointsSold)
    const pathWaste = getBezierPath(pointsWaste)

    // Paths cerrados para áreas con degradado
    const areaProduced = pointsProduced.length > 1
      ? `${pathProduced} L ${pointsProduced[pointsProduced.length - 1].x} ${baselineY} L ${pointsProduced[0].x} ${baselineY} Z`
      : ""

    const areaSold = pointsSold.length > 1
      ? `${pathSold} L ${pointsSold[pointsSold.length - 1].x} ${baselineY} L ${pointsSold[0].x} ${baselineY} Z`
      : ""

    const areaWaste = pointsWaste.length > 1
      ? `${pathWaste} L ${pointsWaste[pointsWaste.length - 1].x} ${baselineY} L ${pointsWaste[0].x} ${baselineY} Z`
      : ""

    return {
      width,
      height,
      paddingLeft,
      paddingTop,
      innerWidth,
      innerHeight,
      baselineY,
      pointsProduced,
      pointsSold,
      pointsWaste,
      pathProduced,
      pathSold,
      pathWaste,
      areaProduced,
      areaSold,
      areaWaste,
    }
  }, [activity, maxActivity])

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header Principal */}
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={checkExpirations}
            disabled={isCheckingExpirations}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60 transition"
          >
            <RefreshCw className={"h-4 w-4 " + (isCheckingExpirations ? "animate-spin" : "")} />
            <span className="hidden sm:inline">Revisar caducidades</span>
            <span className="sm:hidden">Caducidades</span>
          </button>
          <TelegramAssistantButton />
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
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

      {/* SECCIÓN DE MOVIMIENTO OPERATIVO (Con cambio de tipo de gráfica y filtros) */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6 space-y-4">
        {/* Barra Superior con Título y Controles */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg text-foreground">Movimiento operativo</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tendencia de producción, ventas y mermas en unidades físicas
            </p>
          </div>

          {/* Barra de Filtros y Selector de Gráfica */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filtro de Sucursal (Para roles globales) */}
            {isGlobalRole && (
              <div className="relative inline-flex items-center">
                <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <select
                  value={selectedBranchSlug}
                  onChange={(e) => setSelectedBranchSlug(e.target.value)}
                  className="h-9 pl-8 pr-7 text-xs font-medium bg-background border border-border rounded-lg text-foreground hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                  title="Filtrar por sucursal"
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              </div>
            )}

            {/* Selector de Rango de Días */}
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-medium">
              {([7, 14, 30] as DayRange[]).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setSelectedDays(days)}
                  className={`px-2.5 py-1 rounded-md transition ${
                    selectedDays === days
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>

            {/* Toggle Tipo de Gráfica (Barras / Líneas / Área) */}
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setChartType("bars")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                  chartType === "bars"
                    ? "bg-card text-foreground font-semibold shadow-xs text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Vista de Barras"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Barras</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType("lines")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                  chartType === "lines"
                    ? "bg-card text-foreground font-semibold shadow-xs text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Vista de Líneas"
              >
                <LineChart className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Líneas</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType("area")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                  chartType === "area"
                    ? "bg-card text-foreground font-semibold shadow-xs text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Vista de Área Suave"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Área</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de Métricas del Período */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 sm:p-3 text-center sm:text-left">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Producción Total</p>
            <p className="text-base sm:text-xl font-bold text-primary mt-0.5">{totals.produced} <span className="text-xs font-normal text-muted-foreground">uds</span></p>
          </div>
          <div className="rounded-lg border border-chart-3/20 bg-chart-3/5 p-2.5 sm:p-3 text-center sm:text-left">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Ventas Totales</p>
            <p className="text-base sm:text-xl font-bold text-chart-3 mt-0.5">{totals.sold} <span className="text-xs font-normal text-muted-foreground">uds</span></p>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50/70 p-2.5 sm:p-3 text-center sm:text-left">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Mermas Totales</p>
            <p className="text-base sm:text-xl font-bold text-orange-600 mt-0.5">{totals.waste} <span className="text-xs font-normal text-muted-foreground">uds</span></p>
          </div>
        </div>

        {/* CONTENEDOR DE GRÁFICA */}
        <div className="pt-2">
          {activity.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No hay movimientos registrados para el período o sucursal seleccionada.
            </div>
          ) : chartType === "bars" ? (
            /* 1. MODO BARRAS */
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[500px]">
                <div className="flex h-52 items-end gap-1.5 sm:gap-2 border-b border-border pb-1">
                  {activity.map((day, idx) => {
                    const dateObj = new Date(`${day.date}T12:00:00`)
                    const label = dateObj.toLocaleDateString("es-GT", { weekday: "short" }).replace(".", "")
                    const dayNum = dateObj.getDate()
                    const isHovered = hoveredIndex === idx

                    return (
                      <div
                        key={day.date}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className={`flex min-w-0 flex-1 flex-col items-center justify-end gap-2 rounded-t-lg transition-colors p-1 ${
                          isHovered ? "bg-muted/40" : ""
                        }`}
                        title={`${day.date}: ${day.produced} producidas, ${day.sold} vendidas, ${day.waste} mermas`}
                      >
                        <div className="flex h-40 w-full items-end justify-center gap-0.5 sm:gap-1">
                          <span
                            className="w-1/3 rounded-t bg-primary/80 transition-all hover:bg-primary"
                            style={{ height: `${Math.max(3, (day.produced / maxActivity) * 100)}%` }}
                          />
                          <span
                            className="w-1/3 rounded-t bg-chart-3/80 transition-all hover:bg-chart-3"
                            style={{ height: `${Math.max(3, (day.sold / maxActivity) * 100)}%` }}
                          />
                          <span
                            className="w-1/3 rounded-t bg-orange-400/80 transition-all hover:bg-orange-500"
                            style={{ height: `${Math.max(3, (day.waste / maxActivity) * 100)}%` }}
                          />
                        </div>
                        <div className="text-center">
                          <span className="block text-[11px] font-semibold text-foreground">{dayNum}</span>
                          <span className="block text-[10px] capitalize text-muted-foreground">{label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* 2. MODO LÍNEAS / ÁREA SUAVE (SVG Vectorial) */
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[500px]">
                <div className="relative h-56 w-full">
                  <svg
                    viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}
                    className="h-full w-full overflow-visible"
                  >
                    <defs>
                      {/* Gradiente Producción */}
                      <linearGradient id="grad-prod" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d97706" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
                      </linearGradient>
                      {/* Gradiente Ventas */}
                      <linearGradient id="grad-sold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                      {/* Gradiente Mermas */}
                      <linearGradient id="grad-waste" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Guías Horizontales */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = svgMetrics.paddingTop + svgMetrics.innerHeight * (1 - ratio)
                      const val = Math.round(maxActivity * ratio)
                      return (
                        <g key={ratio}>
                          <line
                            x1={svgMetrics.paddingLeft}
                            y1={y}
                            x2={svgMetrics.width - 20}
                            y2={y}
                            stroke="currentColor"
                            strokeOpacity="0.1"
                            strokeDasharray={ratio === 0 ? "none" : "3,3"}
                          />
                          <text
                            x={svgMetrics.paddingLeft - 8}
                            y={y + 3}
                            textAnchor="end"
                            fontSize="10"
                            fill="currentColor"
                            opacity="0.5"
                          >
                            {val}
                          </text>
                        </g>
                      )
                    })}

                    {/* Áreas Rellenas con Gradiente (si chartType === 'area') */}
                    {chartType === "area" && (
                      <>
                        <path d={svgMetrics.areaProduced} fill="url(#grad-prod)" />
                        <path d={svgMetrics.areaSold} fill="url(#grad-sold)" />
                        <path d={svgMetrics.areaWaste} fill="url(#grad-waste)" />
                      </>
                    )}

                    {/* Líneas de Tendencia */}
                    <path
                      d={svgMetrics.pathProduced}
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d={svgMetrics.pathSold}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d={svgMetrics.pathWaste}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Puntos y Etiquetas X */}
                    {activity.map((item, idx) => {
                      const ptProd = svgMetrics.pointsProduced[idx]
                      const ptSold = svgMetrics.pointsSold[idx]
                      const ptWaste = svgMetrics.pointsWaste[idx]
                      const isHovered = hoveredIndex === idx

                      const dateObj = new Date(`${item.date}T12:00:00`)
                      const label = dateObj.toLocaleDateString("es-GT", { weekday: "short" }).replace(".", "")
                      const dayNum = dateObj.getDate()

                      return (
                        <g
                          key={item.date}
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className="cursor-pointer"
                        >
                          {/* Línea vertical en hover */}
                          {isHovered && (
                            <line
                              x1={ptProd.x}
                              y1={svgMetrics.paddingTop}
                              x2={ptProd.x}
                              y2={svgMetrics.baselineY}
                              stroke="currentColor"
                              strokeOpacity="0.25"
                              strokeWidth="1.5"
                              strokeDasharray="2,2"
                            />
                          )}

                          {/* Punto Producción */}
                          <circle
                            cx={ptProd.x}
                            cy={ptProd.y}
                            r={isHovered ? "5" : "3.5"}
                            fill="#d97706"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            className="transition-all"
                          />
                          {/* Punto Venta */}
                          <circle
                            cx={ptSold.x}
                            cy={ptSold.y}
                            r={isHovered ? "5" : "3.5"}
                            fill="#10b981"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            className="transition-all"
                          />
                          {/* Punto Merma */}
                          <circle
                            cx={ptWaste.x}
                            cy={ptWaste.y}
                            r={isHovered ? "5" : "3.5"}
                            fill="#f97316"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            className="transition-all"
                          />

                          {/* Etiqueta Eje X */}
                          <text
                            x={ptProd.x}
                            y={svgMetrics.baselineY + 14}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight={isHovered ? "bold" : "normal"}
                            fill="currentColor"
                            opacity={isHovered ? "1" : "0.7"}
                          >
                            {dayNum} {label}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tarjeta de Detalle en Hover */}
        {hoveredIndex !== null && activity[hoveredIndex] && (
          <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <span className="font-semibold text-foreground">
              {new Date(`${activity[hoveredIndex].date}T12:00:00`).toLocaleDateString("es-GT", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
                <i className="h-2 w-2 rounded-full bg-primary" />
                Producción: <strong>{activity[hoveredIndex].produced}</strong> uds
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                <i className="h-2 w-2 rounded-full bg-chart-3" />
                Ventas: <strong>{activity[hoveredIndex].sold}</strong> uds
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-orange-700">
                <i className="h-2 w-2 rounded-full bg-orange-500" />
                Mermas: <strong>{activity[hoveredIndex].waste}</strong> uds
              </span>
            </div>
          </div>
        )}

        {/* Leyenda Inferior */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-primary/80" />
              Producción
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-chart-3/80" />
              Ventas
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-orange-400/80" />
              Mermas
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground/80">
            {selectedBranchSlug
              ? `Filtrado por: ${branches.find((b) => b.slug === selectedBranchSlug)?.name || selectedBranchSlug}`
              : "Consolidado de todas las sucursales"}
          </span>
        </div>
      </section>

      {/* Grid Inferior de Alertas y Caducidades */}
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

      {/* Sección Materias Primas Bajo Mínimo */}
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
