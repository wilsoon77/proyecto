"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Coins,
  ExternalLink,
  Factory,
  Info,
  Layers,
  LineChart,
  Package,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Wheat,
  X,
} from "lucide-react"
import {
  branchesService,
  dailyCloseService,
  inventoryService,
  notificationsService,
  productionService,
  rawMaterialsService,
} from "@/lib/api"
import type {
  ApiBranch,
  DailyCloseRecord,
  DayBreakdownItem,
  DayBreakdownResponse,
  ExpirationLot,
  Notification,
  ProductionLog,
  RawMaterialInventory,
  StockMovement,
} from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import TelegramAssistantButton from "@/components/admin/TelegramAssistantButton"
import { FinancialDashboardView } from "@/components/admin/FinancialDashboardView"
import { searchMatches } from "@/lib/search-utils"

const ALERT_TYPES = new Set([
  "inventory.raw_material_low",
  "inventory.expiration_warning",
])

type ChartType = "bars" | "lines" | "area"
type FilterPreset = "day" | "week" | "month" | "custom"

function getTodayIsoString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getPastIsoString(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function asNumber(value: string | number | null | undefined): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("es-GT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatExpirationDisplay(value?: string | null): string {
  if (!value) return "Sin fecha"
  const datePart = value.split("T")[0]
  const parts = datePart.split("-")
  if (parts.length !== 3) return value
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  if (isNaN(year) || isNaN(month) || isNaN(day)) return value
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"]
  const monthName = months[month - 1] || ""
  return `${day} ${monthName} ${year}`
}

function formatLongDateSafe(isoDate: string): string {
  const parts = isoDate.split("T")[0].split("-")
  if (parts.length !== 3) return isoDate
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  if (isNaN(year) || isNaN(month) || isNaN(day)) return isoDate
  const d = new Date(year, month - 1, day, 12, 0, 0)
  return d.toLocaleDateString("es-GT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function getBezierPath(points: Array<{ x: number; y: number }>): string {
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
  const [activity, setActivity] = useState<Array<{ date: string; produced: number; sold: number; waste: number; revenue?: number }>>([])
  const [mainView, setMainView] = useState<"operation" | "financial">("operation")
  const [wasteMovements, setWasteMovements] = useState<StockMovement[]>([])
  const [todayCloseRecord, setTodayCloseRecord] = useState<DailyCloseRecord | null>(null)
  const [branches, setBranches] = useState<ApiBranch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingExpirations, setIsCheckingExpirations] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [clock, setClock] = useState<Date | null>(null)

  // Controles de Grafica y Filtros
  const [chartType, setChartType] = useState<ChartType>("bars")
  const [filterPreset, setFilterPreset] = useState<FilterPreset>("week")
  const [customStartDate, setCustomStartDate] = useState<string>(() => getPastIsoString(14))
  const [customEndDate, setCustomEndDate] = useState<string>(() => getTodayIsoString())
  const [appliedCustomRange, setAppliedCustomRange] = useState<{ from: string; to: string } | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [selectedBranchSlug, setSelectedBranchSlug] = useState<string>("")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Estado del Desglose Interactivo por Producto (Drill-Down)
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null)
  const [breakdownData, setBreakdownData] = useState<DayBreakdownResponse | null>(null)
  const [isBreakdownLoading, setIsBreakdownLoading] = useState(false)
  const [breakdownTab, setBreakdownTab] = useState<"all" | "produced" | "sold" | "surplus" | "waste">("all")
  const [breakdownSearch, setBreakdownSearch] = useState("")

  const isGlobalRole = user?.role === "ADMIN" || user?.role === "MANAGER"

  // Carga reactiva del desglose por producto al seleccionar un día
  useEffect(() => {
    if (!selectedDayDate) {
      setBreakdownData(null)
      return
    }

    let isMounted = true
    setIsBreakdownLoading(true)

    const effectiveBranchSlug = isGlobalRole
      ? (selectedBranchSlug || undefined)
      : user?.branch?.slug

    inventoryService
      .getDayBreakdown({ date: selectedDayDate, branchSlug: effectiveBranchSlug })
      .then((data) => {
        if (isMounted) {
          setBreakdownData(data)
        }
      })
      .catch(() => {
        if (isMounted) {
          setBreakdownData(null)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsBreakdownLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedDayDate, selectedBranchSlug, isGlobalRole, user?.branch?.slug])

  const handleApplyCustomRange = () => {
    if (!customStartDate || !customEndDate) {
      setDateError("Ingresa fecha inicial y final")
      return
    }
    if (customStartDate > customEndDate) {
      setDateError("La fecha inicial no puede ser posterior a la fecha final")
      return
    }
    setDateError(null)
    setAppliedCustomRange({ from: customStartDate, to: customEndDate })
    setHoveredIndex(null)
  }

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

    const todayStr = getTodayIsoString()
    let fromDateStr = todayStr
    let toDateStr = todayStr

    let activityParams: { branchSlug?: string; days?: number; from?: string; to?: string } = {
      branchSlug: effectiveBranchSlug,
    }

    if (filterPreset === "day") {
      activityParams.days = 1
      fromDateStr = todayStr
      toDateStr = todayStr
    } else if (filterPreset === "week") {
      activityParams.days = 7
      fromDateStr = getPastIsoString(7)
      toDateStr = todayStr
    } else if (filterPreset === "month") {
      activityParams.days = 30
      fromDateStr = getPastIsoString(30)
      toDateStr = todayStr
    } else if (filterPreset === "custom") {
      const from = appliedCustomRange?.from || customStartDate
      const to = appliedCustomRange?.to || customEndDate
      activityParams.from = from
      activityParams.to = to
      fromDateStr = from
      toDateStr = to
    }

    const results = await Promise.allSettled([
      notificationsService.getHistory(1, 20),
      rawMaterialsService.getInventory(effectiveBranchId),
      // Caducidades a horizonte de 30 dias para productos de reventa comprados
      inventoryService.listExpirations({
        branch: effectiveBranchSlug,
        status: "expiring",
        days: 30,
      }),
      productionService.getTodayProduction(effectiveBranchId),
      inventoryService.getOperationalActivity(activityParams),
      // Movimientos de merma fisica para identificar productos con mayor descarte
      inventoryService.listMovements({
        branchSlug: effectiveBranchSlug,
        type: "MERMA",
        from: fromDateStr,
        to: toDateStr,
        pageSize: 250,
      }),
      // Estado de cierre diario de la jornada actual
      dailyCloseService.list({
        branchId: effectiveBranchId,
        from: todayStr,
        to: todayStr,
        pageSize: 1,
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
    if (activityResult.status === "fulfilled") {
      setActivity(activityResult.value.data)
      if (filterPreset === "day" && activityResult.value.data.length > 0) {
        setSelectedDayDate(activityResult.value.data[0].date)
      }
    }
    const movementsResult = results[5]
    if (movementsResult.status === "fulfilled") setWasteMovements(movementsResult.value.data)
    const closeResult = results[6]
    if (closeResult.status === "fulfilled" && closeResult.value.data.length > 0) {
      setTodayCloseRecord(closeResult.value.data[0])
    } else {
      setTodayCloseRecord(null)
    }

    setLastUpdated(new Date())
    setIsLoading(false)
  }, [
    isGlobalRole,
    selectedBranchSlug,
    user?.branch?.slug,
    user?.branchId,
    branches,
    filterPreset,
    appliedCustomRange,
    customStartDate,
    customEndDate,
  ])

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
  const timeGreeting = hour >= 5 && hour < 12 ? "Buenos dias" : hour >= 12 && hour < 19 ? "Buenas tardes" : "Buenas noches"
  const greeting = user?.firstName ? `${timeGreeting}, ${user.firstName}` : "Panel operativo"
  const producedUnits = production.reduce((sum, item) => sum + asNumber(item.unitsProduced), 0)

  // Metricas de caducidad para productos comprados (horizonte 30 dias)
  const urgentExpiringCount = useMemo(() => {
    return expiringLots.filter((lot) => {
      if (lot.daysLeft !== null && lot.daysLeft !== undefined) {
        return lot.daysLeft <= 3
      }
      if (!lot.expiresAt) return false
      const diff = Math.ceil((new Date(lot.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return diff <= 3
    }).length
  }, [expiringLots])

  const weekExpiringCount = useMemo(() => {
    return expiringLots.filter((lot) => {
      if (lot.daysLeft !== null && lot.daysLeft !== undefined) {
        return lot.daysLeft <= 7
      }
      if (!lot.expiresAt) return false
      const diff = Math.ceil((new Date(lot.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return diff <= 7
    }).length
  }, [expiringLots])

  const expiringUnitsTotal = useMemo(() => {
    return expiringLots.reduce((sum, l) => sum + asNumber(l.availableQuantity), 0)
  }, [expiringLots])

  // Metricas acumuladas del periodo seleccionado
  // Se distingue claramente:
  // - Horneado = Produccion total elaborada
  // - Ventas = Despachado al mostrador
  // - Sobrante = Pan bueno guardado para venta matutina del dia siguiente (Horneado - Ventas - Merma)
  // - Merma = Descarte fisico real (pan quemado, caido o inservible)
  const totals = useMemo(() => {
    return activity.reduce(
      (acc, curr) => {
        const surplusDay = Math.max(0, curr.produced - curr.sold - curr.waste)
        return {
          produced: acc.produced + curr.produced,
          sold: acc.sold + curr.sold,
          waste: acc.waste + curr.waste,
          surplus: acc.surplus + surplusDay,
        }
      },
      { produced: 0, sold: 0, waste: 0, surplus: 0 }
    )
  }, [activity])

  // Agrupacion para la Grafica 2: Top Panes con Mayor Merma Real
  // Si hay un dia seleccionado en la grafica (selectedDayDate), muestra el descarte real de ese dia;
  // de lo contrario, muestra el descarte acumulado de todo el periodo seleccionado.
  const { topWasteProducts, totalWasteUnits, isDayFiltered } = useMemo(() => {
    if (selectedDayDate) {
      if (breakdownData?.items) {
        const wasteItems = breakdownData.items
          .filter((item) => item.waste > 0)
          .map((item) => ({
            name: item.productName || "Pan sin nombre",
            quantity: item.waste,
          }))
        const dayWasteTotal = wasteItems.reduce((sum, item) => sum + item.quantity, 0)
        const list = wasteItems
          .map((item) => ({
            name: item.name,
            quantity: item.quantity,
            percentage: dayWasteTotal > 0 ? (item.quantity / dayWasteTotal) * 100 : 0,
          }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 8)
        return { topWasteProducts: list, totalWasteUnits: dayWasteTotal, isDayFiltered: true }
      }

      const map = new Map<string, number>()
      wasteMovements
        .filter((m) => m.createdAt?.startsWith(selectedDayDate))
        .forEach((m) => {
          const name = m.productName || "Pan sin nombre"
          const qty = map.get(name) || 0
          map.set(name, qty + asNumber(m.quantity))
        })
      const dayWasteTotal = Array.from(map.values()).reduce((sum, q) => sum + q, 0)
      const list = Array.from(map.entries())
        .map(([name, quantity]) => ({
          name,
          quantity,
          percentage: dayWasteTotal > 0 ? (quantity / dayWasteTotal) * 100 : 0,
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8)
      return { topWasteProducts: list, totalWasteUnits: dayWasteTotal, isDayFiltered: true }
    }

    const map = new Map<string, number>()
    wasteMovements.forEach((m) => {
      const name = m.productName || "Pan sin nombre"
      const qty = map.get(name) || 0
      map.set(name, qty + asNumber(m.quantity))
    })
    const totalWasteUnits = Array.from(map.values()).reduce((sum, q) => sum + q, 0)
    const list = Array.from(map.entries())
      .map(([name, quantity]) => ({
        name,
        quantity,
        percentage: totalWasteUnits > 0 ? (quantity / totalWasteUnits) * 100 : 0,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8)
    return { topWasteProducts: list, totalWasteUnits, isDayFiltered: false }
  }, [selectedDayDate, breakdownData, wasteMovements])

  // Metricas del Desglose Diario Seleccionado (Drill-Down)
  const breakdownTotals = useMemo(() => {
    if (!breakdownData?.items) {
      return { produced: 0, sold: 0, surplus: 0, waste: 0 }
    }
    return breakdownData.items.reduce(
      (acc, item) => ({
        produced: acc.produced + item.produced,
        sold: acc.sold + item.sold,
        surplus: acc.surplus + item.surplus,
        waste: acc.waste + item.waste,
      }),
      { produced: 0, sold: 0, surplus: 0, waste: 0 }
    )
  }, [breakdownData])

  const breakdownFilteredItems = useMemo(() => {
    if (!breakdownData?.items) return []
    let list = [...breakdownData.items]

    if (breakdownSearch.trim()) {
      list = list.filter((item) => searchMatches(item.productName, breakdownSearch))
    }

    if (breakdownTab === "produced") {
      list = list.filter((i) => i.produced > 0).sort((a, b) => b.produced - a.produced)
    } else if (breakdownTab === "sold") {
      list = list.filter((i) => i.sold > 0).sort((a, b) => b.sold - a.sold)
    } else if (breakdownTab === "surplus") {
      list = list.filter((i) => i.surplus > 0).sort((a, b) => b.surplus - a.surplus)
    } else if (breakdownTab === "waste") {
      list = list.filter((i) => i.waste > 0).sort((a, b) => b.waste - a.waste)
    } else {
      list.sort((a, b) => (b.produced + b.sold + b.waste) - (a.produced + a.sold + a.waste))
    }

    return list
  }, [breakdownData, breakdownSearch, breakdownTab])

  const maxActivity = Math.max(
    1,
    ...activity.flatMap((item) => {
      const surplus = Math.max(0, item.produced - item.sold - item.waste)
      return [item.produced, item.sold, item.waste, surplus]
    })
  )

  // Coordenadas calculadas para la grafica SVG
  const svgMetrics = useMemo(() => {
    const count = activity.length
    const columnWidth = count > 20 ? 46 : count > 10 ? 54 : count > 3 ? 72 : 120
    const computedWidth = Math.max(720, count * columnWidth)
    const width = computedWidth
    const height = 240
    const paddingLeft = 48
    const paddingRight = 32
    const paddingTop = 24
    const paddingBottom = 40
    const innerWidth = width - paddingLeft - paddingRight
    const innerHeight = height - paddingTop - paddingBottom

    const stepX = count > 1 ? innerWidth / (count - 1) : innerWidth / 2

    const pointsProduced = activity.map((item, idx) => ({
      x: count === 1 ? paddingLeft + innerWidth / 2 : paddingLeft + idx * stepX,
      y: paddingTop + innerHeight - (maxActivity > 0 ? (item.produced / maxActivity) * innerHeight : 0),
    }))

    const pointsSold = activity.map((item, idx) => ({
      x: count === 1 ? paddingLeft + innerWidth / 2 : paddingLeft + idx * stepX,
      y: paddingTop + innerHeight - (maxActivity > 0 ? (item.sold / maxActivity) * innerHeight : 0),
    }))

    const pointsSurplus = activity.map((item, idx) => {
      const surplus = Math.max(0, item.produced - item.sold - item.waste)
      return {
        x: count === 1 ? paddingLeft + innerWidth / 2 : paddingLeft + idx * stepX,
        y: paddingTop + innerHeight - (maxActivity > 0 ? (surplus / maxActivity) * innerHeight : 0),
      }
    })

    const pointsWaste = activity.map((item, idx) => ({
      x: count === 1 ? paddingLeft + innerWidth / 2 : paddingLeft + idx * stepX,
      y: paddingTop + innerHeight - (maxActivity > 0 ? (item.waste / maxActivity) * innerHeight : 0),
    }))

    const baselineY = paddingTop + innerHeight

    const pathProduced = count > 1 ? getBezierPath(pointsProduced) : ""
    const pathSold = count > 1 ? getBezierPath(pointsSold) : ""
    const pathSurplus = count > 1 ? getBezierPath(pointsSurplus) : ""
    const pathWaste = count > 1 ? getBezierPath(pointsWaste) : ""

    const areaProduced = count > 1 && pointsProduced.length > 1
      ? `${pathProduced} L ${pointsProduced[pointsProduced.length - 1].x} ${baselineY} L ${pointsProduced[0].x} ${baselineY} Z`
      : ""

    const areaSold = count > 1 && pointsSold.length > 1
      ? `${pathSold} L ${pointsSold[pointsSold.length - 1].x} ${baselineY} L ${pointsSold[0].x} ${baselineY} Z`
      : ""

    const areaSurplus = count > 1 && pointsSurplus.length > 1
      ? `${pathSurplus} L ${pointsSurplus[pointsSurplus.length - 1].x} ${baselineY} L ${pointsSurplus[0].x} ${baselineY} Z`
      : ""

    const areaWaste = count > 1 && pointsWaste.length > 1
      ? `${pathWaste} L ${pointsWaste[pointsWaste.length - 1].x} ${baselineY} L ${pointsWaste[0].x} ${baselineY} Z`
      : ""

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      innerWidth,
      innerHeight,
      baselineY,
      pointsProduced,
      pointsSold,
      pointsSurplus,
      pointsWaste,
      pathProduced,
      pathSold,
      pathSurplus,
      pathWaste,
      areaProduced,
      areaSold,
      areaSurplus,
      areaWaste,
    }
  }, [activity, maxActivity])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Principal */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9E4D1A]">
              {greeting}
            </span>
            <span className="text-xs font-semibold text-[#8C522B]">
              {clock ? clock.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#2B170F] sm:text-3xl">
            {mainView === "operation" ? "Operacion de la panaderia" : "Ventas e Ingresos"}
          </h1>
          <p className="mt-1 text-xs text-[#6E5545] sm:text-sm">
            {mainView === "operation"
              ? "Control de inventario, ciclo del pan diario y alertas automaticas."
              : "Analisis de recaudacion en caja (Q), rentabilidad y desglose por producto."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mainView === "operation" && (
            <button
              type="button"
              onClick={checkExpirations}
              disabled={isCheckingExpirations}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#DECDBB] bg-white px-4 py-2.5 text-xs font-bold text-[#2B170F] hover:border-[#D97706] hover:bg-[#FAF5EE] disabled:opacity-60 transition shadow-xs"
            >
              <RefreshCw className={"h-4 w-4 text-[#D97706] " + (isCheckingExpirations ? "animate-spin" : "")} />
              <span className="hidden sm:inline">Revisar caducidades</span>
              <span className="sm:hidden">Caducidades</span>
            </button>
          )}
          <TelegramAssistantButton />
        </div>
      </div>

      {/* Switcher de Vistas Principales: Operativo vs Financiero */}
      <div className="flex items-center justify-between gap-3 border-b border-[#DECDBB] pb-4">
        <div className="inline-flex p-1 rounded-2xl bg-[#EFE6DC] border border-[#DECDBB] w-full sm:w-auto shadow-inner">
          <button
            type="button"
            onClick={() => setMainView("operation")}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mainView === "operation"
                ? "bg-[#D97706] text-white shadow-sm"
                : "text-[#6E5545] hover:text-[#2B170F]"
            }`}
          >
            <Factory className="h-4 w-4 shrink-0" />
            <span>Operacion y Produccion</span>
          </button>
          <button
            type="button"
            onClick={() => setMainView("financial")}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mainView === "financial"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-[#6E5545] hover:text-[#2B170F]"
            }`}
          >
            <Coins className="h-4 w-4 shrink-0" />
            <span>Ventas e Ingresos (Q)</span>
          </button>
        </div>
      </div>

      {mainView === "operation" ? (
        <>
          {/* Tarjetas Bento de Metricas Rapidas (Semaforo Operativo Nivel 1) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Caducidades de Comprados (< 30 dias) */}
        <Link
          href="/admin/inventario/caducidades?status=expiring"
          className="group rounded-2xl border border-[#DECDBB] bg-[#F3E9DC] p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D97706] hover:shadow-md min-h-[140px] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8DAC9] text-[#A25514]">
                <CalendarClock className="h-5 w-5" />
              </div>
              <span className="font-display text-3xl font-bold text-[#2B170F]">{expiringLots.length}</span>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#8C522B]">Caducidades (&lt; 30 dias)</p>
            <p className="mt-0.5 text-xs text-[#6E5545]">
              {expiringUnitsTotal} uds. de productos comprados / reventa
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#DECDBB]/60 flex items-center justify-between">
            {urgentExpiringCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                <AlertTriangle className="h-3 w-3" /> {urgentExpiringCount} criticos (&le; 3d)
              </span>
            ) : weekExpiringCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                {weekExpiringCount} proximos (&le; 7d)
              </span>
            ) : expiringLots.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                Vencen este mes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Bajo control
              </span>
            )}
            <span className="text-[10px] font-semibold text-[#8C522B] group-hover:text-[#D97706] inline-flex items-center">
              Ver lotes <ArrowRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </Link>

        {/* Card 2: Materias Primas Bajo Minimo */}
        <Link
          href="/admin/inventario/materias-primas"
          className="group rounded-2xl border border-[#ECCDB5] bg-[#FAF0E6] p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D97706] hover:shadow-md min-h-[140px] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0DDCD] text-[#C85A17]">
                <Wheat className="h-5 w-5" />
              </div>
              <span className="font-display text-3xl font-bold text-[#9E4D1A]">{lowMaterials.length}</span>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#9E4D1A]">Materias primas bajas</p>
            <p className="mt-0.5 text-xs text-[#6E5545]">Insumos requeridos para hornear</p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#ECCDB5]/60 flex items-center justify-between">
            {lowMaterials.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                Reabastecer urgente
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Stock suficiente
              </span>
            )}
            <span className="text-[10px] font-semibold text-[#8C522B] group-hover:text-[#D97706] inline-flex items-center">
              Gestionar <ArrowRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </Link>

        {/* Card 3: Horneado Acumulado Hoy */}
        <Link
          href="/admin/produccion"
          className="group rounded-2xl border border-[#42261B] bg-[#2B170F] p-5 text-[#FAF5EE] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg min-h-[140px] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D2317] text-[#F59E0B]">
                <Factory className="h-5 w-5" />
              </div>
              <span className="font-display text-3xl font-bold text-[#FBBF24]">{producedUnits}</span>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#D49E6E]">Horneado de hoy</p>
            <p className="mt-0.5 text-xs text-[#D2C3B4]">{production.length} tandas registradas en horno</p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#42261B] flex items-center justify-between">
            {producedUnits > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Produccion activa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-800/80 px-2 py-0.5 text-[10px] font-bold text-stone-400">
                Sin tandas registradas
              </span>
            )}
            <span className="text-[10px] font-semibold text-[#D49E6E] group-hover:text-[#FBBF24] inline-flex items-center">
              Nueva tanda <ArrowRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </Link>

        {/* Card 4: Estado del Cierre de Jornada */}
        <Link
          href="/admin/cierre-dia"
          className="group rounded-2xl border border-[#DECDBB] bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D97706] hover:shadow-md min-h-[140px] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              {todayCloseRecord ? (
                <span className="inline-flex items-center gap-1 font-display text-base font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" /> Conciliado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-display text-base font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                  <Clock className="h-4 w-4" /> Pendiente
                </span>
              )}
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#2B170F]">Cierre de jornada</p>
            <p className="mt-0.5 text-xs text-[#6E5545]">
              {todayCloseRecord
                ? `Cerrado por ${todayCloseRecord.user.firstName || "operador"}`
                : "Conciliar sobrantes, ventas y mermas al terminar"}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#DECDBB]/60 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8C522B]">
              {todayCloseRecord ? "Auditoria lista" : "Requerido al final del turno"}
            </span>
            <span className="text-[10px] font-semibold text-[#8C522B] group-hover:text-[#D97706] inline-flex items-center">
              Ir a cierre <ArrowRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </Link>
      </div>

      {/* SECCION 1: CICLO DEL PAN DIARIO (Movimiento Operativo) */}
      <section className="rounded-2xl border border-[#E8DCCB] bg-white p-5 shadow-xs sm:p-6 space-y-4">
        {/* Barra Superior con Titulo y Controles */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[#E8DCCB] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF0E6] text-[#D97706]">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h2 className="font-bold text-base text-[#2B170F] sm:text-lg">Ciclo del pan diario</h2>
            </div>
            <p className="text-xs text-[#6E5545] mt-1">
              Horneado vs Ventas vs Sobrante para manana vs Merma real en unidades fisicas
            </p>
          </div>

          {/* Barra de Filtros y Selector de Grafica */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            {/* Filtro de Sucursal (Para roles globales) */}
            {isGlobalRole && (
              <div className="relative flex items-center w-full sm:w-auto">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C522B] pointer-events-none" />
                <select
                  value={selectedBranchSlug}
                  onChange={(e) => setSelectedBranchSlug(e.target.value)}
                  className="w-full sm:w-auto min-h-[44px] pl-9 pr-8 text-xs font-semibold bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] hover:border-[#D97706] focus:outline-none focus:ring-1 focus:ring-[#D97706] appearance-none cursor-pointer transition"
                  title="Filtrar por sucursal"
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C522B] pointer-events-none" />
              </div>
            )}

            {/* Presets: Dia, Semana, Mes, Personalizado */}
            <div className="flex w-full sm:w-auto rounded-xl border border-[#DECDBB] bg-[#FAF5EE] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setFilterPreset("day")
                  setHoveredIndex(null)
                }}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center min-h-[40px] px-2.5 sm:px-3 py-2 rounded-lg transition ${
                  filterPreset === "day"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Ver balance del dia actual"
              >
                Dia
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterPreset("week")
                  setHoveredIndex(null)
                }}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center min-h-[40px] px-2.5 sm:px-3 py-2 rounded-lg transition ${
                  filterPreset === "week"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Ver ultimos 7 dias"
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterPreset("month")
                  setHoveredIndex(null)
                }}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center min-h-[40px] px-2.5 sm:px-3 py-2 rounded-lg transition ${
                  filterPreset === "month"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Ver ultimos 30 dias"
              >
                Mes
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterPreset("custom")
                  setHoveredIndex(null)
                }}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2.5 sm:px-3 py-2 rounded-lg transition ${
                  filterPreset === "custom"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Seleccionar rango de fechas libre"
              >
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Rango libre</span>
                <span className="sm:hidden">Libre</span>
              </button>
            </div>

            {/* Selector de Tipo de Grafica (Barras / Lineas / Area) */}
            <div className="flex w-full sm:w-auto rounded-xl border border-[#DECDBB] bg-[#FAF5EE] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartType("bars")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2.5 sm:px-3 py-2 rounded-lg transition ${
                  chartType === "bars"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Vista de Barras"
              >
                <BarChart3 className="h-3.5 w-3.5 shrink-0" />
                <span>Barras</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType("lines")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2.5 sm:px-3 py-2 rounded-lg transition ${
                  chartType === "lines"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Vista de Lineas"
              >
                <LineChart className="h-3.5 w-3.5 shrink-0" />
                <span>Lineas</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType("area")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2.5 sm:px-3 py-2 rounded-lg transition ${
                  chartType === "area"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Vista de Area Suave"
              >
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                <span>Area</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel Desplegable para Filtro de Rango Libre */}
        {filterPreset === "custom" && (
          <div className="rounded-xl border border-[#DECDBB] bg-[#FAF5EE] p-3 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <span className="font-bold text-[#8C522B] shrink-0">Desde:</span>
                <input
                  type="date"
                  value={customStartDate}
                  max={customEndDate || getTodayIsoString()}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full sm:w-auto min-h-[40px] px-2.5 rounded-lg border border-[#DECDBB] bg-white text-[#2B170F] font-medium focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                />
              </div>
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <span className="font-bold text-[#8C522B] shrink-0">Hasta:</span>
                <input
                  type="date"
                  value={customEndDate}
                  min={customStartDate}
                  max={getTodayIsoString()}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full sm:w-auto min-h-[40px] px-2.5 rounded-lg border border-[#DECDBB] bg-white text-[#2B170F] font-medium focus:outline-none focus:ring-1 focus:ring-[#D97706]"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCustomRange}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 px-4 rounded-lg bg-[#D97706] text-white font-bold hover:bg-[#B45309] transition shadow-xs w-full sm:w-auto"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Aplicar</span>
              </button>

              {appliedCustomRange && (
                <span className="text-[11px] text-[#8C522B] font-semibold bg-white/70 px-2.5 py-1.5 rounded-md border border-[#DECDBB] text-center w-full sm:w-auto">
                  Activo: {appliedCustomRange.from} al {appliedCustomRange.to} ({activity.length} dias)
                </span>
              )}
            </div>
            {dateError && (
              <p className="text-xs text-red-600 font-semibold">{dateError}</p>
            )}
          </div>
        )}

        {/* Resumen de Metricas del Periodo con Indicador de Decision */}
        {(() => {
          const wasteRate = totals.produced > 0 ? (totals.waste / totals.produced) * 100 : 0
          const salesRate = totals.produced > 0 ? (totals.sold / totals.produced) * 100 : 0
          const surplusRate = totals.produced > 0 ? (totals.surplus / totals.produced) * 100 : 0
          const utilizationRate = totals.produced > 0 ? ((totals.sold + totals.surplus) / totals.produced) * 100 : 100

          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pt-1">
              {/* 1. Horneado */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Horneado Total</p>
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-blue-700 mt-1">
                  {totals.produced.toLocaleString()} <span className="text-xs font-normal text-blue-800">uds</span>
                </p>
                <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Volumen elaborado</p>
              </div>

              {/* 2. Ventas */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Ventas Despachadas</p>
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-emerald-700 mt-1">
                  {totals.sold.toLocaleString()} <span className="text-xs font-normal text-emerald-800">uds</span>
                </p>
                <p className="text-[11px] text-emerald-700 font-bold mt-0.5">{salesRate.toFixed(1)}% colocado</p>
              </div>

              {/* 3. Sobrante para Manana */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Sobrante Manana</p>
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-amber-700 mt-1">
                  {totals.surplus.toLocaleString()} <span className="text-xs font-normal text-amber-800">uds</span>
                </p>
                <p className="text-[11px] text-amber-700 font-bold mt-0.5">{surplusRate.toFixed(1)}% disponible</p>
              </div>

              {/* 4. Merma Real Descartada */}
              <div className="rounded-2xl border border-red-200 bg-red-50/70 p-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Merma Real</p>
                  <span className="h-2 w-2 rounded-full bg-red-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-red-600 mt-1">
                  {totals.waste.toLocaleString()} <span className="text-xs font-normal text-red-800">uds</span>
                </p>
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="text-[11px] text-red-600 font-bold">{wasteRate.toFixed(1)}% descarte</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${wasteRate <= 5 ? 'bg-emerald-100 text-emerald-700' : wasteRate <= 10 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>
                    {wasteRate <= 5 ? 'Optimo' : wasteRate <= 10 ? 'Normal' : 'Alto'}
                  </span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* CONTENEDOR DE GRAFICA / BALANCE */}
        <div className="pt-2">
          {activity.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#6E5545] bg-[#FAF5EE]/40 rounded-2xl border border-dashed border-[#DECDBB]">
              No hay movimientos registrados para el periodo o sucursal seleccionada.
            </div>
          ) : activity.length === 1 ? (
            /* VISTA ESPECIALIZADA: 1 DIA (Balance Diario del Ciclo del Pan) */
            <div className="rounded-2xl border border-[#E8DCCB] bg-[#FAF5EE]/50 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8DCCB] pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E4D1A]">
                    Jornada Operativa
                  </span>
                  <h3 className="font-display text-lg font-bold text-[#2B170F]">
                    {new Date(`${activity[0].date}T12:00:00`).toLocaleDateString("es-GT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3 py-1 text-xs font-bold text-[#9E4D1A]">
                  Balance del Dia
                </div>
              </div>

              {/* 4 Columnas Proporcionales del Dia */}
              {(() => {
                const dayProd = activity[0].produced
                const daySold = activity[0].sold
                const dayWaste = activity[0].waste
                const daySurplus = Math.max(0, dayProd - daySold - dayWaste)

                return (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDayDate(activity[0].date)
                        setBreakdownTab("produced")
                      }}
                      className="rounded-xl border border-blue-200 bg-white p-4 shadow-2xs hover:border-blue-400 hover:shadow-xs transition text-left cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                        <span>HORNEADO</span>
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-blue-700">
                        {dayProd.toLocaleString()} <span className="text-xs font-normal text-blue-800">uds</span>
                      </p>
                      <p className="mt-1 text-[11px] text-[#6E5545] group-hover:text-blue-700 font-medium transition">
                        100% volumen &bull; Ver panes &rarr;
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDayDate(activity[0].date)
                        setBreakdownTab("sold")
                      }}
                      className="rounded-xl border border-emerald-200 bg-white p-4 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition text-left cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                        <span>VENTAS</span>
                        <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-emerald-700">
                        {daySold.toLocaleString()} <span className="text-xs font-normal text-emerald-800">uds</span>
                      </p>
                      <p className="mt-1 text-[11px] text-emerald-700 font-bold group-hover:underline">
                        {dayProd > 0 ? ((daySold / dayProd) * 100).toFixed(1) : "0"}% colocado &bull; Ver panes &rarr;
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDayDate(activity[0].date)
                        setBreakdownTab("surplus")
                      }}
                      className="rounded-xl border border-amber-200 bg-white p-4 shadow-2xs hover:border-amber-400 hover:shadow-xs transition text-left cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                        <span>SOBRANTE MANANA</span>
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-amber-700">
                        {daySurplus.toLocaleString()} <span className="text-xs font-normal text-amber-800">uds</span>
                      </p>
                      <p className="mt-1 text-[11px] text-amber-700 font-bold group-hover:underline">
                        {dayProd > 0 ? ((daySurplus / dayProd) * 100).toFixed(1) : "0"}% guardado &bull; Ver panes &rarr;
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDayDate(activity[0].date)
                        setBreakdownTab("waste")
                      }}
                      className="rounded-xl border border-red-200 bg-white p-4 shadow-2xs hover:border-red-400 hover:shadow-xs transition text-left cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-red-800">
                        <span>MERMA REAL</span>
                        <span className="h-2 w-2 rounded-full bg-red-600" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-red-600">
                        {dayWaste.toLocaleString()} <span className="text-xs font-normal text-red-800">uds</span>
                      </p>
                      <p className="mt-1 text-[11px] text-red-600 font-bold group-hover:underline">
                        {dayProd > 0 ? ((dayWaste / dayProd) * 100).toFixed(1) : "0"}% descarte &bull; Ver panes &rarr;
                      </p>
                    </button>
                  </div>
                )
              })()}

              {/* Barra Comparativa Horizontal del Dia */}
              {activity[0].produced > 0 && (() => {
                const dayProd = activity[0].produced
                const daySold = activity[0].sold
                const dayWaste = activity[0].waste
                const daySurplus = Math.max(0, dayProd - daySold - dayWaste)
                const soldPct = (daySold / dayProd) * 100
                const surplusPct = (daySurplus / dayProd) * 100
                const wastePct = (dayWaste / dayProd) * 100

                return (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#2B170F] mb-1.5">
                      <span>Distribucion del Pan Horneado ({dayProd} uds = 100%)</span>
                      <span className="text-[11px] font-normal text-[#6E5545]">
                        Aprovechamiento util: {(soldPct + surplusPct).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-5 w-full rounded-full bg-[#DECDBB]/40 overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-emerald-600 transition-all"
                        style={{ width: `${Math.min(100, soldPct)}%` }}
                        title={`Ventas: ${daySold} uds (${soldPct.toFixed(1)}%)`}
                      />
                      <div
                        className="h-full bg-amber-500 transition-all"
                        style={{ width: `${Math.min(100, surplusPct)}%` }}
                        title={`Sobrante para manana: ${daySurplus} uds (${surplusPct.toFixed(1)}%)`}
                      />
                      <div
                        className="h-full bg-red-500 transition-all"
                        style={{ width: `${Math.min(100, wastePct)}%` }}
                        title={`Merma descartada: ${dayWaste} uds (${wastePct.toFixed(1)}%)`}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6E5545]">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <i className="h-2 w-2 rounded-full bg-emerald-600" />
                        Vendido: {daySold} uds
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                        <i className="h-2 w-2 rounded-full bg-amber-500" />
                        Sobrante manana: {daySurplus} uds
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                        <i className="h-2 w-2 rounded-full bg-red-600" />
                        Merma real: {dayWaste} uds
                      </span>
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : chartType === "bars" ? (
            /* 1. MODO BARRAS (Horneado, Ventas, Sobrante, Merma) */
            <div className="space-y-2">
              {activity.length > 10 && (
                <div className="flex items-center justify-between text-[11px] text-[#8C522B] px-1">
                  <span>Mostrando {activity.length} dias en el rango seleccionado</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[#D97706] font-semibold">
                    &larr; Desliza horizontalmente para explorar el historial &rarr;
                  </span>
                </div>
              )}
              <div className="overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#DECDBB] hover:scrollbar-thumb-[#B45309]/50">
                <div style={{ minWidth: `${Math.max(680, activity.length * (activity.length > 20 ? 56 : 72))}px` }}>
                  <div className="flex h-56 items-end gap-1.5 sm:gap-2.5 border-b border-[#E8DCCB] pb-2 px-1">
                    {activity.map((day, idx) => {
                      const dateObj = new Date(`${day.date}T12:00:00`)
                      const label = activity.length > 14
                        ? dateObj.toLocaleDateString("es-GT", { month: "short" }).replace(".", "")
                        : dateObj.toLocaleDateString("es-GT", { weekday: "short" }).replace(".", "")
                      const dayNum = dateObj.getDate()
                      const isHovered = hoveredIndex === idx
                      const isSelected = selectedDayDate === day.date
                      const surplusDay = Math.max(0, day.produced - day.sold - day.waste)

                      return (
                        <div
                          key={day.date}
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          onClick={() => {
                            setHoveredIndex(idx)
                            setSelectedDayDate(selectedDayDate === day.date ? null : day.date)
                          }}
                          className={`flex min-w-[50px] sm:min-w-[60px] flex-1 flex-col items-center justify-end gap-2 rounded-2xl transition-all p-1 cursor-pointer ${
                            isSelected
                              ? "bg-[#FAF0E6] ring-2 ring-[#D97706] shadow-sm scale-[1.03]"
                              : isHovered
                              ? "bg-[#FAF0E6] shadow-2xs scale-[1.02]"
                              : "hover:bg-[#FAF5EE]/70"
                          }`}
                          title={`${day.date}: ${day.produced} horneadas, ${day.sold} vendidas, ${surplusDay} sobrante, ${day.waste} mermas. Clic para ver desglose por panes.`}
                        >
                          <div className="flex h-40 w-full items-end justify-center gap-0.5 sm:gap-1">
                            {/* Barra Horneado (Azul) */}
                            <span
                              className="w-2 sm:w-2.5 rounded-t-md bg-blue-600 transition-all hover:bg-blue-700"
                              style={{ height: `${Math.max(4, (day.produced / maxActivity) * 100)}%` }}
                            />
                            {/* Barra Ventas (Verde) */}
                            <span
                              className="w-2 sm:w-2.5 rounded-t-md bg-emerald-600 transition-all hover:bg-emerald-700"
                              style={{ height: `${Math.max(4, (day.sold / maxActivity) * 100)}%` }}
                            />
                            {/* Barra Sobrante (Ambar) */}
                            <span
                              className="w-2 sm:w-2.5 rounded-t-md bg-amber-500 transition-all hover:bg-amber-600"
                              style={{ height: `${Math.max(4, (surplusDay / maxActivity) * 100)}%` }}
                            />
                            {/* Barra Merma (Rojo) */}
                            <span
                              className="w-2 sm:w-2.5 rounded-t-md bg-red-500 transition-all hover:bg-red-600"
                              style={{ height: `${Math.max(4, (day.waste / maxActivity) * 100)}%` }}
                            />
                          </div>
                          <div className="text-center leading-tight">
                            <span className="block text-xs font-bold text-[#2B170F]">{dayNum}</span>
                            <span className="block text-[10px] font-semibold uppercase text-[#8C522B]">{label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 2. MODO LINEAS / AREA SUAVE */
            <div className="space-y-2">
              {activity.length > 10 && (
                <div className="flex items-center justify-between text-[11px] text-[#8C522B] px-1">
                  <span>Mostrando {activity.length} dias de actividad</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[#D97706] font-semibold">
                    &larr; Desliza horizontalmente para explorar el historial &rarr;
                  </span>
                </div>
              )}
              <div className="overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#DECDBB] hover:scrollbar-thumb-[#B45309]/50">
                <div style={{ minWidth: `${svgMetrics.width}px` }}>
                  <div className="relative h-60 w-full">
                    <svg
                      viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}
                      className="h-full w-full overflow-visible"
                    >
                      <defs>
                        <linearGradient id="grad-prod" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="grad-sold" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="grad-surplus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="grad-waste" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Guias Horizontales con Escala */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = svgMetrics.paddingTop + svgMetrics.innerHeight * (1 - ratio)
                        const val = Math.round(maxActivity * ratio)
                        return (
                          <g key={ratio}>
                            <line
                              x1={svgMetrics.paddingLeft}
                              y1={y}
                              x2={svgMetrics.width - svgMetrics.paddingRight}
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

                      {/* Areas Rellenas con Gradiente (si chartType === 'area') */}
                      {chartType === "area" && (
                        <>
                          <path d={svgMetrics.areaProduced} fill="url(#grad-prod)" />
                          <path d={svgMetrics.areaSold} fill="url(#grad-sold)" />
                          <path d={svgMetrics.areaSurplus} fill="url(#grad-surplus)" />
                          <path d={svgMetrics.areaWaste} fill="url(#grad-waste)" />
                        </>
                      )}

                      {/* Lineas de Tendencia */}
                      {svgMetrics.pathProduced && (
                        <path
                          d={svgMetrics.pathProduced}
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      )}
                      {svgMetrics.pathSold && (
                        <path
                          d={svgMetrics.pathSold}
                          fill="none"
                          stroke="#059669"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      )}
                      {svgMetrics.pathSurplus && (
                        <path
                          d={svgMetrics.pathSurplus}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      )}
                      {svgMetrics.pathWaste && (
                        <path
                          d={svgMetrics.pathWaste}
                          fill="none"
                          stroke="#dc2626"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Puntos y Etiquetas X */}
                      {activity.map((item, idx) => {
                        const ptProd = svgMetrics.pointsProduced[idx]
                        const ptSold = svgMetrics.pointsSold[idx]
                        const ptSurplus = svgMetrics.pointsSurplus[idx]
                        const ptWaste = svgMetrics.pointsWaste[idx]
                        const isHovered = hoveredIndex === idx
                        const isSelected = selectedDayDate === item.date

                        const dateObj = new Date(`${item.date}T12:00:00`)
                        const label = activity.length > 14
                          ? dateObj.toLocaleDateString("es-GT", { month: "short" }).replace(".", "")
                          : dateObj.toLocaleDateString("es-GT", { weekday: "short" }).replace(".", "")
                        const dayNum = dateObj.getDate()

                        const stepTick = activity.length > 24 ? 3 : activity.length > 14 ? 2 : 1
                        const showTick = idx === 0 || idx === activity.length - 1 || idx % stepTick === 0

                        return (
                          <g
                            key={item.date}
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={() => {
                              setHoveredIndex(idx)
                              setSelectedDayDate(selectedDayDate === item.date ? null : item.date)
                            }}
                            className="cursor-pointer"
                          >
                            {(isHovered || isSelected) && (
                              <line
                                x1={ptProd.x}
                                y1={svgMetrics.paddingTop}
                                x2={ptProd.x}
                                y2={svgMetrics.baselineY}
                                stroke={isSelected ? "#D97706" : "#8C522B"}
                                strokeOpacity={isSelected ? "0.85" : "0.4"}
                                strokeWidth={isSelected ? "2" : "1.5"}
                                strokeDasharray={isSelected ? "none" : "2,2"}
                              />
                            )}

                            {/* Punto Horneado (Azul) */}
                            <circle
                              cx={ptProd.x}
                              cy={ptProd.y}
                              r={isHovered ? "5.5" : "3"}
                              fill="#2563eb"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              className="transition-all"
                            />
                            {/* Punto Ventas (Verde) */}
                            <circle
                              cx={ptSold.x}
                              cy={ptSold.y}
                              r={isHovered ? "5.5" : "3"}
                              fill="#059669"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              className="transition-all"
                            />
                            {/* Punto Sobrante (Ambar) */}
                            <circle
                              cx={ptSurplus.x}
                              cy={ptSurplus.y}
                              r={isHovered ? "5.5" : "3"}
                              fill="#f59e0b"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              className="transition-all"
                            />
                            {/* Punto Merma (Rojo) */}
                            <circle
                              cx={ptWaste.x}
                              cy={ptWaste.y}
                              r={isHovered ? "5.5" : "3"}
                              fill="#dc2626"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              className="transition-all"
                            />

                            {(showTick || isHovered) && (
                              <text
                                x={ptProd.x}
                                y={svgMetrics.baselineY + 16}
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight={isHovered ? "bold" : "600"}
                                fill={isHovered ? "#D97706" : "#2B170F"}
                                opacity={isHovered ? "1" : "0.75"}
                              >
                                {dayNum} {label}
                              </text>
                            )}
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tarjeta de Detalle en Hover / Seleccion */}
        {(() => {
          const activeIndex =
            hoveredIndex !== null
              ? hoveredIndex
              : activity.findIndex((a) => a.date === selectedDayDate)
          if (activeIndex < 0 || !activity[activeIndex]) return null
          const day = activity[activeIndex]
          const surplusDay = Math.max(0, day.produced - day.sold - day.waste)
          const isCurrentSelected = selectedDayDate === day.date
          return (
            <div className="rounded-2xl border border-[#DECDBB] bg-[#FAF5EE] p-3.5 text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in shadow-2xs">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#D97706]" />
                <span className="font-bold text-[#2B170F]">
                  {formatLongDateSafe(day.date)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="inline-flex items-center gap-1.5 font-bold text-blue-700">
                  <i className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  Horneado: <strong>{day.produced.toLocaleString()}</strong> uds
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                  <i className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  Ventas: <strong>{day.sold.toLocaleString()}</strong> uds
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-amber-700">
                  <i className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Sobrante: <strong>{surplusDay.toLocaleString()}</strong> uds
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-red-600">
                  <i className="h-2.5 w-2.5 rounded-full bg-red-600" />
                  Merma real: <strong>{day.waste.toLocaleString()}</strong> uds
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDayDate(isCurrentSelected ? null : day.date)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#D97706] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#B45309] transition cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>{isCurrentSelected ? "Ocultar desglose" : "Explorar panes del día"}</span>
                </button>
              </div>
            </div>
          )
        })()}

        {/* PANEL DE DRILL-DOWN: DESGLOSE PRODUCTO POR PRODUCTO */}
        {selectedDayDate && (
          <div className="rounded-2xl border-2 border-[#D97706]/40 bg-gradient-to-b from-[#FFFDF9] to-[#FAF5EE] p-4 sm:p-6 shadow-sm space-y-4 animate-in fade-in-50 slide-in-from-top-2">
            {/* Header del desglose */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E8DCCB] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-[#9E4D1A]">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#2B170F] capitalize">
                      Desglose detallado por producto: {formatLongDateSafe(selectedDayDate)}
                    </h3>
                    <p className="text-xs text-[#6E5545]">
                      Auditoría del ciclo diario por pan: horneado, vendido, sobrante guardado y merma descartada.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {breakdownData?.dailyCloseId && (
                  <Link
                    href={`/admin/cierre-dia/${breakdownData.dailyCloseId}`}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                  >
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    <span>Cierre Oficial #{breakdownData.dailyCloseId}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDayDate(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#DECDBB] bg-white text-[#8C522B] hover:bg-[#FAF5EE] hover:text-[#2B170F] transition cursor-pointer"
                  title="Cerrar desglose"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Pestañas de Filtro por Indicador */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#F0E6D8]/60 border border-[#DECDBB]">
                <button
                  type="button"
                  onClick={() => setBreakdownTab("all")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    breakdownTab === "all"
                      ? "bg-white text-[#2B170F] shadow-xs"
                      : "text-[#6E5545] hover:text-[#2B170F]"
                  }`}
                >
                  <span>Todos los panes</span>
                  {breakdownData && (
                    <span className="rounded-full bg-[#E8DAC9] px-1.5 py-0.2 text-[10px] font-bold text-[#8C522B]">
                      {breakdownFilteredItems.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownTab("produced")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    breakdownTab === "produced"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  <i className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Horneado</span>
                  {breakdownData && (
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${breakdownTab === "produced" ? "bg-blue-700 text-white" : "bg-blue-100 text-blue-800"}`}>
                      {breakdownTotals.produced} uds
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownTab("sold")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    breakdownTab === "sold"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  <i className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Ventas</span>
                  {breakdownData && (
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${breakdownTab === "sold" ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-800"}`}>
                      {breakdownTotals.sold} uds
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownTab("surplus")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    breakdownTab === "surplus"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-amber-800 hover:bg-amber-50"
                  }`}
                >
                  <i className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>Sobrante para mañana</span>
                  {breakdownData && (
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${breakdownTab === "surplus" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-900"}`}>
                      {breakdownTotals.surplus} uds
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownTab("waste")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    breakdownTab === "waste"
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-red-700 hover:bg-red-50"
                  }`}
                >
                  <i className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Merma real</span>
                  {breakdownData && (
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${breakdownTab === "waste" ? "bg-red-700 text-white" : "bg-red-100 text-red-800"}`}>
                      {breakdownTotals.waste} uds
                    </span>
                  )}
                </button>
              </div>

              {/* Buscador rápido */}
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8C522B]" />
                <input
                  type="text"
                  placeholder="Buscar pan..."
                  value={breakdownSearch}
                  onChange={(e) => setBreakdownSearch(e.target.value)}
                  className="w-full rounded-xl border border-[#DECDBB] bg-white py-1.5 pl-8 pr-3 text-xs text-[#2B170F] placeholder-[#8C522B]/60 focus:border-[#D97706] focus:outline-none"
                />
                {breakdownSearch && (
                  <button
                    type="button"
                    onClick={() => setBreakdownSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C522B] hover:text-[#2B170F]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Listado / Tabla de productos */}
            {isBreakdownLoading ? (
              <div className="py-12 text-center text-xs text-[#6E5545] space-y-2">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#D97706]" />
                <p>Cargando desglose de productos para esta fecha...</p>
              </div>
            ) : breakdownFilteredItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6E5545] bg-white rounded-xl border border-dashed border-[#DECDBB]">
                No se encontraron productos registrados con el filtro actual.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E8DCCB] bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF5EE] text-[11px] font-bold uppercase tracking-wider text-[#8C522B] border-b border-[#E8DCCB]">
                    <tr>
                      <th className="py-2.5 px-3">Producto / Pan</th>
                      <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                      <th className="py-2.5 px-3 text-right">Horneado</th>
                      <th className="py-2.5 px-3 text-right">Ventas</th>
                      <th className="py-2.5 px-3 text-right">Sobrante</th>
                      <th className="py-2.5 px-3 text-right">Merma Real</th>
                      <th className="py-2.5 px-3 text-right">Impacto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DCCB]/60">
                    {breakdownFilteredItems.map((item) => {
                      const hasWaste = item.waste > 0
                      const wastePct = item.produced > 0 ? (item.waste / item.produced) * 100 : 0
                      return (
                        <tr key={item.productId} className="hover:bg-[#FAF5EE]/50 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-[#2B170F] block">{item.productName}</span>
                            {item.unitsPerTray && (
                              <span className="text-[10px] text-[#8C522B]">
                                Capacidad: {item.unitsPerTray} uds / lata
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#6E5545] font-medium">
                            Q {item.price.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {item.produced > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                                {item.produced.toLocaleString()} uds
                              </span>
                            ) : (
                              <span className="text-[#8C522B]/50">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {item.sold > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                                {item.sold.toLocaleString()} uds
                              </span>
                            ) : (
                              <span className="text-[#8C522B]/50">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {item.surplus > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 font-bold text-amber-800">
                                {item.surplus.toLocaleString()} uds
                              </span>
                            ) : (
                              <span className="text-[#8C522B]/50">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {hasWaste ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2 py-0.5 font-bold text-red-700">
                                {item.waste.toLocaleString()} uds
                              </span>
                            ) : (
                              <span className="text-emerald-700 text-[11px] font-semibold">0 uds</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {hasWaste ? (
                              <span className="text-[11px] font-bold text-red-600">
                                {wastePct.toFixed(1)}% descarte
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-emerald-600">
                                100% aprovechado
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Leyenda Inferior */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E8DCCB] pt-3 text-xs text-[#6E5545]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-bold text-blue-700">
              <i className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Horneado (Produccion)
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
              <i className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              Ventas (Despacho)
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-amber-700">
              <i className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Sobrante para manana (Preservado)
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-red-600">
              <i className="h-2.5 w-2.5 rounded-full bg-red-600" />
              Merma real (Descarte fisico)
            </span>
          </div>
          <span className="text-[11px] text-[#8C522B] font-semibold">
            {selectedBranchSlug
              ? `Filtrado por: ${branches.find((b) => b.slug === selectedBranchSlug)?.name || selectedBranchSlug}`
              : "Consolidado de todas las sucursales"}
          </span>
        </div>
      </section>

      {/* SECCION 2: GRAFICA DE TOP PANES CON MAYOR MERMA REAL */}
      <section className="rounded-2xl border border-[#E8DCCB] bg-white p-5 shadow-xs sm:p-6 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E8DCCB] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <TrendingDown className="h-4 w-4" />
              </div>
              <h2 className="font-bold text-base text-[#2B170F] sm:text-lg">
                {isDayFiltered ? "Top panes con mayor merma del día" : "Top panes con mayor merma real"}
              </h2>
            </div>
            <p className="text-xs text-[#6E5545] mt-0.5">
              {isDayFiltered && selectedDayDate ? (
                <span>
                  Descarte físico registrado el <strong>{formatLongDateSafe(selectedDayDate)}</strong> para calibrar tandas de horneado
                </span>
              ) : (
                "Productos con mayor descarte acumulado en el periodo para calibrar tandas de horneado"
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isDayFiltered && (
              <button
                type="button"
                onClick={() => setSelectedDayDate(null)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-[#DECDBB] bg-[#FAF5EE] px-2.5 py-1.5 text-xs font-semibold text-[#8C522B] hover:text-[#2B170F] hover:bg-white transition cursor-pointer"
                title="Quitar filtro del día y ver periodo acumulado"
              >
                <X className="h-3.5 w-3.5" />
                <span>Ver periodo completo</span>
              </button>
            )}
            <div className="inline-flex items-center gap-2 rounded-xl bg-red-50 border border-red-200/90 px-3 py-1.5 text-xs">
              <span className="text-[#8C522B] font-semibold">{isDayFiltered ? "Merma del día:" : "Total de mermas:"}</span>
              <span className="font-extrabold text-red-700 text-sm">
                {totalWasteUnits.toLocaleString()} uds.
              </span>
              {(() => {
                const referenceProduced = isDayFiltered ? breakdownTotals.produced : totals.produced
                if (referenceProduced <= 0) return null
                return (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                    {((totalWasteUnits / referenceProduced) * 100).toFixed(1)}% del horneado
                  </span>
                )
              })()}
            </div>
            <Link
              href="/admin/produccion"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#DECDBB] bg-[#FAF5EE] px-3.5 py-2 text-xs font-bold text-[#8C522B] hover:text-[#D97706] hover:border-[#D97706] transition"
            >
              <span>Ajustar tandas en produccion</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {topWasteProducts.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#6E5545] bg-[#FAF5EE]/40 rounded-xl border border-dashed border-[#DECDBB]">
            {isDayFiltered && selectedDayDate ? (
              <span>Excelente: No se registraron descartes de merma para el <strong>{formatLongDateSafe(selectedDayDate)}</strong>. El amasijo y la venta estuvieron balanceados.</span>
            ) : (
              "Excelente: No se registran descartes de merma en el periodo seleccionado. El amasijo y la venta estan balanceados."
            )}
          </div>
        ) : (
          <div className="space-y-3.5 pt-1">
            {/* Indicador de Total de Mermas del Periodo o Día */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-red-50/70 border border-red-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-100 text-red-700 font-bold">
                  <TrendingDown className="h-3.5 w-3.5" />
                </span>
                <span className="font-bold text-[#2B170F]">
                  {isDayFiltered && selectedDayDate
                    ? `Descarte físico del día (${formatLongDateSafe(selectedDayDate)}):`
                    : "Descarte físico total consolidado:"}
                </span>
                <span className="font-extrabold text-red-700 text-sm">
                  {totalWasteUnits.toLocaleString()} unidades descartadas
                </span>
              </div>
              <span className="text-[#8C522B] font-medium text-[11px]">
                {topWasteProducts.length} {topWasteProducts.length === 1 ? "variedad con merma registrada" : "variedades con merma registrada"}
              </span>
            </div>

            {topWasteProducts.map((item, idx) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF5EE] border border-[#DECDBB] text-[10px] font-bold text-[#8C522B]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[#2B170F]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="text-red-600 font-bold">{item.quantity} uds. descartadas</span>
                    <span className="text-[11px] text-[#8C522B]">({item.percentage.toFixed(1)}% de merma total)</span>
                  </div>
                </div>
                {/* Barra de Progreso Horizontal */}
                <div className="h-3 w-full rounded-full bg-[#FAF5EE] border border-[#DECDBB]/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                    style={{ width: `${Math.max(6, Math.min(100, item.percentage))}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-[#DECDBB] bg-[#FAF5EE]/70 p-3 text-xs text-[#8C522B] mt-4 flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-[#D97706]" />
              <p>
                <strong>Consejo de horneado:</strong> Para los panes con merma continua, reduzca de 2 a 5 latas en la pantalla de{" "}
                <Link href="/admin/produccion" className="text-[#D97706] font-bold hover:underline">
                  Registro de Horneado
                </Link>{" "}
                hasta que el descarte diario no supere el 5% del volumen horneado.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Grid Inferior de Alertas y Caducidades de Comprados */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Panel 1: Alertas Automaticas */}
        <section className="rounded-2xl border border-[#E8DCCB] bg-white shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E8DCCB] p-4 bg-[#FAF5EE]/60">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-[#D97706]" />
                <h2 className="font-bold text-sm text-[#2B170F]">Alertas automaticas activas</h2>
              </div>
              <Link href="/admin/historial" className="text-xs font-bold text-[#D97706] hover:underline">
                Ver historial
              </Link>
            </div>
            <div className="divide-y divide-[#E8DCCB]">
              {isLoading ? (
                <p className="p-4 text-xs text-[#6E5545]">Cargando alertas...</p>
              ) : notifications.length === 0 ? (
                <p className="p-4 text-xs text-[#6E5545]">No hay alertas pendientes en el sistema.</p>
              ) : (
                notifications.slice(0, 6).map((item) => (
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
          </div>
          <div className="p-3 border-t border-[#E8DCCB] bg-[#FAF5EE]/30 text-right">
            <Link href="/admin/historial" className="text-[11px] font-bold text-[#8C522B] hover:text-[#D97706]">
              Explorar todas las notificaciones &rarr;
            </Link>
          </div>
        </section>

        {/* Panel 2: Productos Comprados Proximos a Vencer (< 30 dias) */}
        <section className="rounded-2xl border border-[#E8DCCB] bg-white shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E8DCCB] p-4 bg-[#FAF5EE]/60">
              <div className="flex items-center gap-2">
                <Package className="h-4.5 w-4.5 text-[#D97706]" />
                <div>
                  <h2 className="font-bold text-sm text-[#2B170F]">Lotes de reventa por vencer</h2>
                  <p className="text-[11px] text-[#6E5545]">Productos comprados (horizonte de 30 dias)</p>
                </div>
              </div>
              <Link href="/admin/inventario/caducidades" className="text-xs font-bold text-[#D97706] hover:underline">
                Gestionar lotes
              </Link>
            </div>
            <div className="divide-y divide-[#E8DCCB]">
              {expiringLots.length === 0 ? (
                <p className="p-4 text-xs text-[#6E5545]">No hay lotes de reventa proximos a vencer en los proximos 30 dias.</p>
              ) : (
                expiringLots.slice(0, 6).map((lot) => {
                  const daysLeft = lot.daysLeft ?? (
                    lot.expiresAt
                      ? Math.ceil((new Date(lot.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null
                  )
                  const isCritical = daysLeft !== null && daysLeft <= 3
                  const isWarning = daysLeft !== null && daysLeft > 3 && daysLeft <= 7

                  return (
                    <div key={lot.id} className="flex items-center justify-between gap-4 p-4 hover:bg-[#FAF5EE]/40 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-bold text-[#2B170F]">{lot.product.name}</p>
                          {isCritical ? (
                            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                              {daysLeft <= 0 ? "Vence hoy" : `${daysLeft}d critico`}
                            </span>
                          ) : isWarning ? (
                            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                              {daysLeft}d proximo
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-[#FAF5EE] border border-[#DECDBB] px-2 py-0.5 text-[9px] font-semibold text-[#8C522B]">
                              {daysLeft}d
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6E5545]">
                          {lot.branch.name} · Vence: {formatExpirationDisplay(lot.expiresAt)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-[#2B170F] bg-[#FAF5EE] border border-[#DECDBB] px-2.5 py-1.5 rounded-lg">
                        {lot.availableQuantity} uds.
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
          <div className="p-3 border-t border-[#E8DCCB] bg-[#FAF5EE]/30 text-right">
            <Link href="/admin/inventario/caducidades" className="text-[11px] font-bold text-[#8C522B] hover:text-[#D97706]">
              Ver modulo completo de caducidades &rarr;
            </Link>
          </div>
        </section>
      </div>

      {/* Seccion Materias Primas Bajo Minimo */}
      <section className="rounded-2xl border border-[#E8DCCB] bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wheat className="h-4.5 w-4.5 text-[#D97706]" />
            <div>
              <h2 className="font-bold text-sm text-[#2B170F]">Materias primas bajo minimo</h2>
              <p className="text-[11px] text-[#6E5545]">Insumos esenciales para el amasijo en riesgo de agotamiento</p>
            </div>
          </div>
          <Link
            href="/admin/inventario/materias-primas"
            className="inline-flex min-h-[44px] items-center gap-1 text-xs font-bold text-[#D97706] hover:underline"
          >
            <span>Gestionar insumos</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {lowMaterials.length === 0 ? (
          <p className="mt-4 text-xs text-[#6E5545]">
            No hay materias primas bajo minimo en la sucursal consultada. El inventario cubre la demanda proyectada.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lowMaterials.slice(0, 9).map((item) => (
              <div key={item.id} className="rounded-xl border border-[#ECCDB5] bg-[#FAF0E6] p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#2B170F]">{item.rawMaterial.name}</p>
                    <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[9px] font-bold">
                      Bajo stock
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#9E4D1A] font-semibold">
                    Disponible: {asNumber(item.quantity).toFixed(1)} {item.rawMaterial.baseUnit}
                  </p>
                  <p className="text-[11px] text-[#6E5545]">
                    Stock minimo requerido: {asNumber(item.rawMaterial.minStock).toFixed(1)} {item.rawMaterial.baseUnit}
                  </p>
                </div>
                <p className="mt-2 text-[10px] text-[#8C522B] pt-2 border-t border-[#ECCDB5]/60">
                  {item.branch.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
        </>
      ) : (
        <FinancialDashboardView
          activity={activity}
          branches={branches}
          selectedBranchSlug={selectedBranchSlug}
          setSelectedBranchSlug={setSelectedBranchSlug}
          filterPreset={filterPreset}
          setFilterPreset={setFilterPreset}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          appliedCustomRange={appliedCustomRange}
          dateError={dateError}
          onApplyCustomRange={handleApplyCustomRange}
          selectedDayDate={selectedDayDate}
          setSelectedDayDate={setSelectedDayDate}
          breakdownData={breakdownData}
          isBreakdownLoading={isBreakdownLoading}
          isGlobalRole={isGlobalRole}
        />
      )}

      {/* Pie de Pagina con Sincronizacion */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8C522B] pt-2">
        <p>
          {mainView === "operation"
            ? "Panel adaptado al ciclo operativo de panaderia tradicional y gestion de vencimientos de reventa."
            : "Panel de control financiero de ventas, recaudacion monetaria en Quetzales y rendimiento por categoria."}
        </p>
        <p>
          {lastUpdated ? "Ultima actualizacion: " + lastUpdated.toLocaleTimeString("es-GT") : "Sin actualizar"}
        </p>
      </div>
    </div>
  )
}
