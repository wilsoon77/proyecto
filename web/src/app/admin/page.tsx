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
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9E4D1A]">
              {greeting}
            </span>
            <span className="text-xs font-semibold text-[#8C522B]">
              {clock ? clock.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#2B170F] sm:text-3xl">Operación de la panadería</h1>
          <p className="mt-1 text-xs text-[#6E5545] sm:text-sm">
            Control de inventario, producción del día y cierres de turno.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={checkExpirations}
            disabled={isCheckingExpirations}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DECDBB] bg-white px-3.5 py-2 text-xs font-bold text-[#2B170F] hover:border-[#D97706] hover:bg-[#FAF5EE] disabled:opacity-60 transition shadow-xs"
          >
            <RefreshCw className={"h-4 w-4 text-[#D97706] " + (isCheckingExpirations ? "animate-spin" : "")} />
            <span className="hidden sm:inline">Revisar caducidades</span>
            <span className="sm:hidden">Caducidades</span>
          </button>
          <TelegramAssistantButton />
        </div>
      </div>

      {/* Tarjetas Bento de Métricas Rápidas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Warm Amber Oat */}
        <Link href="/admin/inventario/materias-primas" className="group rounded-2xl border border-[#ECCDB5] bg-[#FAF0E6] p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D97706] hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0DDCD] text-[#C85A17]">
              <Wheat className="h-5 w-5" />
            </div>
            <span className="font-display text-3xl font-bold text-[#9E4D1A]">{lowMaterials.length}</span>
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#9E4D1A]">Materias primas bajas</p>
          <p className="mt-0.5 text-xs text-[#6E5545]">Revisar y reabastecer stock</p>
        </Link>

        {/* Card 2: Oat Cream */}
        <Link href="/admin/inventario/caducidades?status=expiring" className="group rounded-2xl border border-[#DECDBB] bg-[#F3E9DC] p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D97706] hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8DAC9] text-[#A25514]">
              <CalendarClock className="h-5 w-5" />
            </div>
            <span className="font-display text-3xl font-bold text-[#2B170F]">{expiringLots.length}</span>
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#8C522B]">Próximos a vencer</p>
          <p className="mt-0.5 text-xs text-[#6E5545]">Lotes en los próximos 7 días</p>
        </Link>

        {/* Card 3: Deep Roast Espresso */}
        <Link href="/admin/produccion" className="group rounded-2xl border border-[#42261B] bg-[#2B170F] p-5 text-[#FAF5EE] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D2317] text-[#F59E0B]">
              <Factory className="h-5 w-5" />
            </div>
            <span className="font-display text-3xl font-bold text-[#FBBF24]">{producedUnits}</span>
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#D49E6E]">Unidades producidas hoy</p>
          <p className="mt-0.5 text-xs text-[#D2C3B4]">Amasijos registrados: {production.length}</p>
        </Link>

        {/* Card 4: Clean White Card */}
        <Link href="/admin/cierre-dia" className="group rounded-2xl border border-[#DECDBB] bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D97706] hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#2B170F]">Cierre del turno</p>
          <p className="mt-0.5 text-xs text-[#6E5545]">Conciliar existencias y ventas</p>
        </Link>
      </div>

      {/* SECCIÓN DE MOVIMIENTO OPERATIVO (Con cambio de tipo de gráfica y filtros) */}
      <section className="rounded-2xl border border-[#E8DCCB] bg-white p-5 shadow-xs sm:p-6 space-y-4">
        {/* Barra Superior con Título y Controles */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[#E8DCCB] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF0E6] text-[#D97706]">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h2 className="font-bold text-base text-[#2B170F] sm:text-lg">Movimiento operativo</h2>
            </div>
            <p className="text-xs text-[#6E5545] mt-1">
              Tendencia de producción, ventas y mermas en unidades físicas
            </p>
          </div>

          {/* Barra de Filtros y Selector de Gráfica */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filtro de Sucursal (Para roles globales) */}
            {isGlobalRole && (
              <div className="relative inline-flex items-center">
                <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C522B] pointer-events-none" />
                <select
                  value={selectedBranchSlug}
                  onChange={(e) => setSelectedBranchSlug(e.target.value)}
                  className="h-9 pl-8 pr-7 text-xs font-semibold bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] hover:border-[#D97706] focus:outline-none focus:ring-1 focus:ring-[#D97706] appearance-none cursor-pointer"
                  title="Filtrar por sucursal"
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#8C522B] pointer-events-none" />
              </div>
            )}

            {/* Selector de Rango de Días */}
            <div className="inline-flex rounded-xl border border-[#DECDBB] bg-[#FAF5EE] p-0.5 text-xs font-semibold">
              {([7, 14, 30] as DayRange[]).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setSelectedDays(days)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    selectedDays === days
                      ? "bg-white text-[#D97706] font-bold shadow-2xs"
                      : "text-[#6E5545] hover:text-[#2B170F]"
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>

            {/* Toggle Tipo de Gráfica (Barras / Líneas / Área) */}
            <div className="inline-flex rounded-xl border border-[#DECDBB] bg-[#FAF5EE] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartType("bars")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                  chartType === "bars"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Vista de Barras"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Barras</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType("lines")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                  chartType === "lines"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Vista de Líneas"
              >
                <LineChart className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Líneas</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType("area")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                  chartType === "area"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Vista de Área Suave"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Área</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de Métricas del Período con Indicador de Decisión */}
        {(() => {
          const wasteRate = totals.produced > 0 ? (totals.waste / totals.produced) * 100 : 0
          const salesRate = totals.produced > 0 ? (totals.sold / totals.produced) * 100 : 0
          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pt-1">
              {/* 1. Producción */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Producción Total</p>
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-blue-700 mt-1">
                  {totals.produced.toLocaleString()} <span className="text-xs font-normal text-blue-800">uds</span>
                </p>
                <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Volumen horneado</p>
              </div>

              {/* 2. Ventas */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Ventas Totales</p>
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-emerald-700 mt-1">
                  {totals.sold.toLocaleString()} <span className="text-xs font-normal text-emerald-800">uds</span>
                </p>
                <p className="text-[11px] text-emerald-700 font-bold mt-0.5">{salesRate.toFixed(1)}% colocado</p>
              </div>

              {/* 3. Mermas */}
              <div className="rounded-2xl border border-red-200 bg-red-50/70 p-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Mermas Totales</p>
                  <span className="h-2 w-2 rounded-full bg-red-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-red-600 mt-1">
                  {totals.waste.toLocaleString()} <span className="text-xs font-normal text-red-800">uds</span>
                </p>
                <p className="text-[11px] text-red-600 font-bold mt-0.5">{wasteRate.toFixed(1)}% desperdicio</p>
              </div>

              {/* 4. Semáforo de Control Operativo */}
              <div className="rounded-2xl border border-[#DECDBB] bg-[#FAF5EE] p-3.5 shadow-2xs">
                <p className="text-[10px] font-bold text-[#8C522B] uppercase tracking-wider">Tasa de Merma</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${wasteRate <= 5 ? 'bg-emerald-500' : wasteRate <= 10 ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <span className="text-sm sm:text-base font-bold text-[#2B170F]">
                    {wasteRate.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-[#6E5545] mt-0.5">
                  {wasteRate <= 5 ? 'Control óptimo (<5%)' : wasteRate <= 10 ? 'Rango normal (5-10%)' : 'Alerta: Reducir amasijo'}
                </p>
              </div>
            </div>
          )
        })()}

        {/* CONTENEDOR DE GRÁFICA */}
        <div className="pt-2">
          {activity.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#6E5545]">
              No hay movimientos registrados para el período o sucursal seleccionada.
            </div>
          ) : chartType === "bars" ? (
            /* 1. MODO BARRAS DE ALTO CONTRASTE */
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[500px]">
                <div className="flex h-52 items-end gap-1.5 sm:gap-2 border-b border-[#E8DCCB] pb-1">
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
                        className={`flex min-w-0 flex-1 flex-col items-center justify-end gap-2 rounded-xl transition-colors p-1 ${
                          isHovered ? "bg-[#FAF5EE]" : ""
                        }`}
                        title={`${day.date}: ${day.produced} producidas, ${day.sold} vendidas, ${day.waste} mermas`}
                      >
                        <div className="flex h-40 w-full items-end justify-center gap-0.5 sm:gap-1">
                          <span
                            className="w-1/3 rounded-t-md bg-blue-600 transition-all hover:bg-blue-700"
                            style={{ height: `${Math.max(3, (day.produced / maxActivity) * 100)}%` }}
                          />
                          <span
                            className="w-1/3 rounded-t-md bg-emerald-600 transition-all hover:bg-emerald-700"
                            style={{ height: `${Math.max(3, (day.sold / maxActivity) * 100)}%` }}
                          />
                          <span
                            className="w-1/3 rounded-t-md bg-red-500 transition-all hover:bg-red-600"
                            style={{ height: `${Math.max(3, (day.waste / maxActivity) * 100)}%` }}
                          />
                        </div>
                        <div className="text-center">
                          <span className="block text-[11px] font-bold text-[#2B170F]">{dayNum}</span>
                          <span className="block text-[10px] capitalize text-[#8C522B]">{label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* 2. MODO LÍNEAS / ÁREA SUAVE (SVG Vectorial con Paleta de Decisión) */
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[500px]">
                <div className="relative h-56 w-full">
                  <svg
                    viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}
                    className="h-full w-full overflow-visible"
                  >
                    <defs>
                      {/* Gradiente Producción (Azul Cobalto) */}
                      <linearGradient id="grad-prod" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.30" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                      </linearGradient>
                      {/* Gradiente Ventas (Verde Esmeralda) */}
                      <linearGradient id="grad-sold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" stopOpacity="0.30" />
                        <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                      </linearGradient>
                      {/* Gradiente Mermas (Rojo Carmesí) */}
                      <linearGradient id="grad-waste" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#dc2626" stopOpacity="0.30" />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
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
                            stroke="#E8DCCB"
                            strokeOpacity="0.8"
                            strokeDasharray={ratio === 0 ? "none" : "3,3"}
                          />
                          <text
                            x={svgMetrics.paddingLeft - 8}
                            y={y + 3}
                            textAnchor="end"
                            fontSize="10"
                            fontWeight="600"
                            fill="#8C522B"
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

                    {/* Líneas de Tendencia de Alto Contraste */}
                    <path
                      d={svgMetrics.pathProduced}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.75"
                      strokeLinecap="round"
                    />
                    <path
                      d={svgMetrics.pathSold}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.75"
                      strokeLinecap="round"
                    />
                    <path
                      d={svgMetrics.pathWaste}
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="2.75"
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
                              stroke="#8C522B"
                              strokeOpacity="0.35"
                              strokeWidth="1.5"
                              strokeDasharray="2,2"
                            />
                          )}

                          {/* Punto Producción (Azul) */}
                          <circle
                            cx={ptProd.x}
                            cy={ptProd.y}
                            r={isHovered ? "5.5" : "3.5"}
                            fill="#2563eb"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-all"
                          />
                          {/* Punto Venta (Verde) */}
                          <circle
                            cx={ptSold.x}
                            cy={ptSold.y}
                            r={isHovered ? "5.5" : "3.5"}
                            fill="#059669"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-all"
                          />
                          {/* Punto Merma (Rojo) */}
                          <circle
                            cx={ptWaste.x}
                            cy={ptWaste.y}
                            r={isHovered ? "5.5" : "3.5"}
                            fill="#dc2626"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-all"
                          />

                          {/* Etiqueta Eje X */}
                          <text
                            x={ptProd.x}
                            y={svgMetrics.baselineY + 15}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight={isHovered ? "bold" : "600"}
                            fill="#2B170F"
                            opacity={isHovered ? "1" : "0.75"}
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
          <div className="rounded-2xl border border-[#DECDBB] bg-[#FAF5EE] p-3 text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <span className="font-bold text-[#2B170F]">
              {new Date(`${activity[hoveredIndex].date}T12:00:00`).toLocaleDateString("es-GT", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-bold text-blue-700">
                <i className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                Producción: <strong>{activity[hoveredIndex].produced}</strong> uds
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                <i className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                Ventas: <strong>{activity[hoveredIndex].sold}</strong> uds
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-red-600">
                <i className="h-2.5 w-2.5 rounded-full bg-red-600" />
                Mermas: <strong>{activity[hoveredIndex].waste}</strong> uds
              </span>
            </div>
          </div>
        )}

        {/* Leyenda Inferior */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E8DCCB] pt-3 text-xs text-[#6E5545]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-bold text-blue-700">
              <i className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Producción (Horneado)
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
              <i className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              Ventas (Despacho)
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-red-600">
              <i className="h-2.5 w-2.5 rounded-full bg-red-600" />
              Mermas (Desperdicio)
            </span>
          </div>
          <span className="text-[11px] text-[#8C522B] font-semibold">
            {selectedBranchSlug
              ? `Filtrado por: ${branches.find((b) => b.slug === selectedBranchSlug)?.name || selectedBranchSlug}`
              : "Consolidado de todas las sucursales"}
          </span>
        </div>
      </section>

      {/* Grid Inferior de Alertas y Caducidades */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E8DCCB] bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#E8DCCB] p-4 bg-[#FAF5EE]/60">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-[#D97706]" />
              <h2 className="font-bold text-sm text-[#2B170F]">Alertas activas</h2>
            </div>
            <Link href="/admin/historial" className="text-xs font-bold text-[#D97706] hover:underline">
              Ver historial
            </Link>
          </div>
          <div className="divide-y divide-[#E8DCCB]">
            {isLoading ? (
              <p className="p-4 text-xs text-[#6E5545]">Cargando alertas...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-xs text-[#6E5545]">No hay alertas recientes.</p>
            ) : (
              notifications.slice(0, 8).map((item) => (
                <div key={item.id} className="flex gap-3 p-4 hover:bg-[#FAF5EE]/40 transition-colors">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#2B170F]">{item.title}</p>
                    <p className="mt-0.5 text-xs text-[#6E5545]">{item.message}</p>
                    <p className="mt-1 text-[10px] text-[#8C522B]">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E8DCCB] bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#E8DCCB] p-4 bg-[#FAF5EE]/60">
            <div className="flex items-center gap-2">
              <Package className="h-4.5 w-4.5 text-[#D97706]" />
              <h2 className="font-bold text-sm text-[#2B170F]">Productos próximos a vencer</h2>
            </div>
            <Link href="/admin/inventario/caducidades" className="text-xs font-bold text-[#D97706] hover:underline">
              Ver lotes
            </Link>
          </div>
          <div className="divide-y divide-[#E8DCCB]">
            {expiringLots.length === 0 ? (
              <p className="p-4 text-xs text-[#6E5545]">No hay lotes próximos a vencer.</p>
            ) : (
              expiringLots.slice(0, 8).map((lot) => (
                <div key={lot.id} className="flex items-center justify-between gap-4 p-4 hover:bg-[#FAF5EE]/40 transition-colors">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#2B170F]">{lot.product.name}</p>
                    <p className="text-[11px] text-[#6E5545]">{lot.branch.name} · vence {lot.expiresAt}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[#2B170F] bg-[#FAF5EE] border border-[#DECDBB] px-2.5 py-1 rounded-lg">
                    {lot.availableQuantity} uds.
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Sección Materias Primas Bajo Mínimo */}
      <section className="rounded-2xl border border-[#E8DCCB] bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wheat className="h-4.5 w-4.5 text-[#D97706]" />
            <h2 className="font-bold text-sm text-[#2B170F]">Materias primas bajo mínimo</h2>
          </div>
          <Link href="/admin/inventario/materias-primas" className="text-xs font-bold text-[#D97706] hover:underline">
            Gestionar inventario
          </Link>
        </div>
        {lowMaterials.length === 0 ? (
          <p className="mt-4 text-xs text-[#6E5545]">No hay materias primas bajo mínimo en la sucursal consultada.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lowMaterials.slice(0, 9).map((item) => (
              <div key={item.id} className="rounded-xl border border-[#ECCDB5] bg-[#FAF0E6] p-3.5">
                <p className="text-xs font-bold text-[#2B170F]">{item.rawMaterial.name}</p>
                <p className="mt-1 text-xs text-[#9E4D1A]">
                  {asNumber(item.quantity).toFixed(1)} {item.rawMaterial.baseUnit} · mínimo {asNumber(item.rawMaterial.minStock).toFixed(1)}
                </p>
                <p className="mt-1 text-[10px] text-[#8C522B]">{item.branch.name}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-right text-[11px] text-[#8C522B]">
        {lastUpdated ? "Actualizado " + lastUpdated.toLocaleTimeString("es-GT") : "Sin actualizar"}
      </p>
    </div>
  )
}
