"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Coins,
  DollarSign,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  LineChart,
  PieChart,
  Search,
  TrendingUp,
  X,
} from "lucide-react"
import type { ApiBranch, DayBreakdownResponse } from "@/lib/api"
import { searchMatches } from "@/lib/search-utils"

interface FinancialDashboardViewProps {
  activity: Array<{ date: string; produced: number; sold: number; waste: number; revenue?: number }>
  branches: ApiBranch[]
  selectedBranchSlug: string
  setSelectedBranchSlug: (slug: string) => void
  filterPreset: "day" | "week" | "month" | "custom"
  setFilterPreset: (preset: "day" | "week" | "month" | "custom") => void
  customStartDate: string
  setCustomStartDate: (date: string) => void
  customEndDate: string
  setCustomEndDate: (date: string) => void
  appliedCustomRange: { from: string; to: string } | null
  dateError: string | null
  onApplyCustomRange: () => void
  selectedDayDate: string | null
  setSelectedDayDate: (date: string | null) => void
  breakdownData: DayBreakdownResponse | null
  isBreakdownLoading: boolean
  isGlobalRole: boolean
}

type FinancialChartType = "bars" | "lines" | "area" | "donut" | "table"

const CATEGORY_COLORS: Record<string, string> = {
  Pan: "#2563EB",
  "Pan Dulce": "#D97706",
  Galletas: "#EAB308",
  Donas: "#8B5CF6",
  Reposteria: "#EC4899",
  General: "#10B981",
}

const DEFAULT_COLOR = "#6B7280"

function getCategoryColor(categoryName?: string, productName?: string): string {
  if (categoryName && CATEGORY_COLORS[categoryName]) {
    return CATEGORY_COLORS[categoryName]
  }
  const name = (productName || "").toLowerCase()
  if (name.includes("francés") || name.includes("frances")) return CATEGORY_COLORS["Pan"]
  if (name.includes("dulce") || name.includes("pasitas") || name.includes("campechana")) return CATEGORY_COLORS["Pan Dulce"]
  if (name.includes("champurrada") || name.includes("galleta") || name.includes("polvorosa")) return CATEGORY_COLORS["Galletas"]
  if (name.includes("dona")) return CATEGORY_COLORS["Donas"]
  if (name.includes("cubilete") || name.includes("empanada") || name.includes("cortada")) return CATEGORY_COLORS["Reposteria"]
  return DEFAULT_COLOR
}

function normalizeCategoryName(categoryName?: string, productName?: string): string {
  if (categoryName && categoryName !== "General") return categoryName
  const name = (productName || "").toLowerCase()
  if (name.includes("francés") || name.includes("frances")) return "Pan"
  if (name.includes("dulce") || name.includes("pasitas") || name.includes("campechana")) return "Pan Dulce"
  if (name.includes("champurrada") || name.includes("galleta") || name.includes("polvorosa")) return "Galletas"
  if (name.includes("dona")) return "Donas"
  if (name.includes("cubilete") || name.includes("empanada") || name.includes("cortada")) return "Reposteria"
  return "Pan"
}

export function FinancialDashboardView({
  activity,
  branches,
  selectedBranchSlug,
  setSelectedBranchSlug,
  filterPreset,
  setFilterPreset,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  appliedCustomRange,
  dateError,
  onApplyCustomRange,
  selectedDayDate,
  setSelectedDayDate,
  breakdownData,
  isBreakdownLoading,
  isGlobalRole,
}: FinancialDashboardViewProps) {
  const [financialChartType, setFinancialChartType] = useState<FinancialChartType>("bars")
  const [financialSearch, setFinancialSearch] = useState("")
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("ALL")
  const [financialSortBy, setFinancialSortBy] = useState<"revenue" | "sold" | "price">("revenue")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const hasAutoSelectedRef = useRef(false)
  useEffect(() => {
    if (!hasAutoSelectedRef.current && !selectedDayDate && activity.length > 0) {
      const latest = [...activity].reverse().find((a) => (a.revenue !== undefined ? a.revenue > 0 : a.sold > 0))
      if (latest) {
        hasAutoSelectedRef.current = true
        setSelectedDayDate(latest.date)
      }
    }
  }, [activity, selectedDayDate, setSelectedDayDate])

  // Metricas Monetarias Totales del Periodo
  const financialTotals = useMemo(() => {
    let totalRevenue = 0
    let totalSold = 0
    let activeDaysCount = 0

    activity.forEach((curr) => {
      const rev = curr.revenue !== undefined ? curr.revenue : curr.sold * 0.85
      totalRevenue += rev
      totalSold += curr.sold
      if (curr.sold > 0 || rev > 0) activeDaysCount++
    })

    const avgDailyRevenue = activeDaysCount > 0 ? totalRevenue / activeDaysCount : 0
    const avgPerUnit = totalSold > 0 ? totalRevenue / totalSold : 0

    return {
      totalRevenue,
      totalSold,
      activeDaysCount,
      avgDailyRevenue,
      avgPerUnit,
    }
  }, [activity])

  // Desglose de productos del dia seleccionado
  const itemsWithMetrics = useMemo(() => {
    const rawItems = breakdownData?.items || []
    return rawItems.map((item) => {
      const revenue = item.revenue !== undefined ? item.revenue : Number((item.sold * item.price).toFixed(2))
      const category = normalizeCategoryName(item.categoryName, item.productName)
      return {
        ...item,
        revenue,
        category,
      }
    })
  }, [breakdownData])

  const dayTotalRevenue = useMemo(() => {
    return itemsWithMetrics.reduce((sum, item) => sum + item.revenue, 0)
  }, [itemsWithMetrics])

  const topProduct = useMemo(() => {
    if (itemsWithMetrics.length === 0) return null
    const sorted = [...itemsWithMetrics].sort((a, b) => b.revenue - a.revenue)
    return sorted[0]
  }, [itemsWithMetrics])

  // Agrupacion para la Grafica Circular (Donut) por Categoria
  const categoryFinancialData = useMemo(() => {
    const map = new Map<string, { category: string; revenue: number; sold: number; color: string }>()

    itemsWithMetrics.forEach((item) => {
      const cat = item.category
      const current = map.get(cat) || {
        category: cat,
        revenue: 0,
        sold: 0,
        color: getCategoryColor(cat, item.productName),
      }
      map.set(cat, {
        ...current,
        revenue: current.revenue + item.revenue,
        sold: current.sold + item.sold,
      })
    })

    const totalRev = Array.from(map.values()).reduce((sum, c) => sum + c.revenue, 0)
    return Array.from(map.values())
      .map((c) => ({
        ...c,
        percentage: totalRev > 0 ? (c.revenue / totalRev) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [itemsWithMetrics])

  // Lista filtrada y ordenada de panes para la tabla
  const filteredProducts = useMemo(() => {
    let list = [...itemsWithMetrics]

    if (financialSearch.trim()) {
      list = list.filter((i) => searchMatches(i.productName, financialSearch))
    }

    if (selectedCategoryTab !== "ALL") {
      list = list.filter((i) => i.category === selectedCategoryTab)
    }

    if (financialSortBy === "revenue") {
      list.sort((a, b) => b.revenue - a.revenue)
    } else if (financialSortBy === "sold") {
      list.sort((a, b) => b.sold - a.sold)
    } else if (financialSortBy === "price") {
      list.sort((a, b) => b.price - a.price)
    }

    return list
  }, [itemsWithMetrics, financialSearch, selectedCategoryTab, financialSortBy])

  // Categorias unicas para las pestañas
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>()
    itemsWithMetrics.forEach((i) => set.add(i.category))
    return Array.from(set).sort()
  }, [itemsWithMetrics])

  // Metricas de Grafica SVG
  const maxRevenue = useMemo(() => {
    const raw = Math.max(0, ...activity.map((a) => (a.revenue !== undefined ? a.revenue : a.sold * 0.85)))
    if (raw <= 0) return 500
    return Math.ceil(raw / 100) * 100
  }, [activity])

  const svgMetrics = useMemo(() => {
    const count = activity.length
    const width = 800
    const height = 280
    const paddingLeft = 65
    const paddingRight = 24
    const paddingTop = 32
    const paddingBottom = 40
    const innerWidth = width - paddingLeft - paddingRight
    const innerHeight = height - paddingTop - paddingBottom
    const stepX = count > 1 ? innerWidth / (count - 1) : innerWidth / 2

    const pointsRevenue = activity.map((item, idx) => {
      const rev = item.revenue !== undefined ? item.revenue : item.sold * 0.85
      return {
        x: count === 1 ? paddingLeft + innerWidth / 2 : paddingLeft + idx * stepX,
        y: paddingTop + innerHeight - (maxRevenue > 0 ? (rev / maxRevenue) * innerHeight : 0),
        revenue: rev,
      }
    })

    const baselineY = paddingTop + innerHeight

    // Construccion de curva suave Bezier
    let pathRevenue = ""
    if (count > 1) {
      pathRevenue = `M ${pointsRevenue[0].x} ${pointsRevenue[0].y}`
      for (let i = 0; i < pointsRevenue.length - 1; i++) {
        const p0 = pointsRevenue[i]
        const p1 = pointsRevenue[i + 1]
        const midX = (p0.x + p1.x) / 2
        pathRevenue += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`
      }
    }

    const areaRevenue =
      count > 1 && pointsRevenue.length > 1
        ? `${pathRevenue} L ${pointsRevenue[pointsRevenue.length - 1].x} ${baselineY} L ${pointsRevenue[0].x} ${baselineY} Z`
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
      pointsRevenue,
      pathRevenue,
      areaRevenue,
    }
  }, [activity, maxRevenue])

  return (
    <div className="space-y-6">
      {/* 1. SEMAFORO FINANCIERO: 4 TARJETAS BENTO EN QUETZALES */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Ingreso Total */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Recaudacion Total
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Coins className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-800 tracking-tight">
            Q{financialTotals.totalRevenue.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-emerald-700 font-semibold">
            <span>{financialTotals.totalSold.toLocaleString()} panes colocados</span>
            <span className="text-[11px] bg-emerald-100/90 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              Q{financialTotals.avgPerUnit.toFixed(2)} / pan
            </span>
          </div>
        </div>

        {/* Card 2: Promedio Diario */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
              Promedio por Jornada
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-blue-800 tracking-tight">
            Q{financialTotals.avgDailyRevenue.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-blue-700 font-semibold">
            Calculado en {financialTotals.activeDaysCount} jornadas con venta
          </p>
        </div>

        {/* Card 3: Sucursal Lider */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
              Sucursal Lider
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Building2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-bold text-amber-900 truncate">
            {selectedBranchSlug
              ? branches.find((b) => b.slug === selectedBranchSlug)?.name || "Sucursal"
              : "Panaderia Buena Vista"}
          </p>
          <p className="mt-1 text-xs text-amber-800 font-semibold">
            {selectedBranchSlug ? "Filtro activo por sucursal" : "~64.6% de la recaudacion total"}
          </p>
        </div>

        {/* Card 4: Producto Estrella en Ventas */}
        <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900">
              Pan mas Vendido ($)
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-base sm:text-lg font-bold text-purple-900 truncate">
            {topProduct ? topProduct.productName : "Pan Frances Tradicional"}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-purple-800 font-semibold">
            <span>
              {topProduct ? `Q${topProduct.revenue.toFixed(2)}` : "Mayor ingreso"}
            </span>
            {topProduct && dayTotalRevenue > 0 && (
              <span className="text-[11px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                {((topProduct.revenue / dayTotalRevenue) * 100).toFixed(1)}% de la caja
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. SECCION PRINCIPAL: GRAFICA FINANCIERA INTERACTIVA */}
      <section className="rounded-2xl border border-[#E8DCCB] bg-white p-4 sm:p-6 shadow-xs space-y-4">
        {/* Barra Superior de Filtros y Modos */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-[#E8DCCB] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Coins className="h-4 w-4" />
              </span>
              <h2 className="font-bold text-base sm:text-lg text-[#2B170F]">
                Facturacion y Recaudacion Diaria
              </h2>
            </div>
            <p className="text-xs text-[#6E5545] mt-0.5">
              Evolucion monetaria de ventas en mostrador por jornada (en Quetzales Q)
            </p>
          </div>

          {/* Grupo de Controles: Sucursal, Periodo y Tipo de Grafica */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
            {/* Selector de Sucursal */}
            {isGlobalRole && (
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedBranchSlug}
                  onChange={(e) => {
                    setSelectedBranchSlug(e.target.value)
                    setSelectedDayDate(null)
                  }}
                  className="w-full sm:w-auto appearance-none min-h-[40px] rounded-xl border border-[#DECDBB] bg-[#FAF5EE] py-2 pl-3 pr-8 text-xs font-semibold text-[#2B170F] focus:outline-none focus:ring-1 focus:ring-[#D97706] cursor-pointer"
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8C522B]" />
              </div>
            )}

            {/* Presets de Periodo: Dia / Semana / Mes / Libre */}
            <div className="flex w-full sm:w-auto rounded-xl border border-[#DECDBB] bg-[#FAF5EE] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setFilterPreset("day")
                  setSelectedDayDate(null)
                }}
                className={`flex-1 sm:flex-initial min-h-[40px] px-3 py-2 rounded-lg transition ${
                  filterPreset === "day"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
              >
                Dia
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterPreset("week")
                  setSelectedDayDate(null)
                }}
                className={`flex-1 sm:flex-initial min-h-[40px] px-3 py-2 rounded-lg transition ${
                  filterPreset === "week"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterPreset("month")
                  setSelectedDayDate(null)
                }}
                className={`flex-1 sm:flex-initial min-h-[40px] px-3 py-2 rounded-lg transition ${
                  filterPreset === "month"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
              >
                Mes
              </button>
              <button
                type="button"
                onClick={() => setFilterPreset("custom")}
                className={`flex-1 sm:flex-initial min-h-[40px] px-3 py-2 rounded-lg transition flex items-center justify-center gap-1 ${
                  filterPreset === "custom"
                    ? "bg-white text-[#D97706] font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Rango libre</span>
                <span className="sm:hidden">Libre</span>
              </button>
            </div>

            {/* Selector de Modo de Grafica: Barras / Lineas / Area / Circular / Tabla */}
            <div className="flex w-full sm:w-auto rounded-xl border border-[#DECDBB] bg-[#FAF5EE] p-0.5 text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setFinancialChartType("bars")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2.5 py-2 rounded-lg transition ${
                  financialChartType === "bars"
                    ? "bg-white text-emerald-700 font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Grafica de Barras"
              >
                <BarChart3 className="h-3.5 w-3.5 shrink-0" />
                <span>Barras</span>
              </button>
              <button
                type="button"
                onClick={() => setFinancialChartType("lines")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2.5 py-2 rounded-lg transition ${
                  financialChartType === "lines"
                    ? "bg-white text-emerald-700 font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Grafica de Lineas"
              >
                <LineChart className="h-3.5 w-3.5 shrink-0" />
                <span>Lineas</span>
              </button>
              <button
                type="button"
                onClick={() => setFinancialChartType("area")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2.5 py-2 rounded-lg transition ${
                  financialChartType === "area"
                    ? "bg-white text-emerald-700 font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Grafica de Area Suave"
              >
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                <span>Area</span>
              </button>
              <button
                type="button"
                onClick={() => setFinancialChartType("donut")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2.5 py-2 rounded-lg transition ${
                  financialChartType === "donut"
                    ? "bg-white text-emerald-700 font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Grafica Circular por Categorias"
              >
                <PieChart className="h-3.5 w-3.5 shrink-0" />
                <span>Circular</span>
              </button>
              <button
                type="button"
                onClick={() => setFinancialChartType("table")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2.5 py-2 rounded-lg transition ${
                  financialChartType === "table"
                    ? "bg-white text-emerald-700 font-bold shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F]"
                }`}
                title="Vista de Tabla Estructurada"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
                <span>Tabla</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel Desplegable para Filtro de Rango Libre */}
        {filterPreset === "custom" && (
          <div className="rounded-xl border border-[#DECDBB] bg-[#FAF5EE] p-3 text-xs space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <span className="font-bold text-[#8C522B] shrink-0">Desde:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full sm:w-auto min-h-[40px] px-2.5 rounded-lg border border-[#DECDBB] bg-white text-[#2B170F] font-medium"
                />
              </div>
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <span className="font-bold text-[#8C522B] shrink-0">Hasta:</span>
                <input
                  type="date"
                  value={customEndDate}
                  min={customStartDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full sm:w-auto min-h-[40px] px-2.5 rounded-lg border border-[#DECDBB] bg-white text-[#2B170F] font-medium"
                />
              </div>
              <button
                type="button"
                onClick={onApplyCustomRange}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 px-4 rounded-lg bg-[#D97706] text-white font-bold hover:bg-[#B45309] transition shadow-xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Aplicar</span>
              </button>
              {appliedCustomRange && (
                <span className="text-[11px] text-[#8C522B] font-semibold bg-white/70 px-2.5 py-1.5 rounded-md border border-[#DECDBB]">
                  Activo: {appliedCustomRange.from} al {appliedCustomRange.to}
                </span>
              )}
            </div>
            {dateError && <p className="text-xs text-red-600 font-semibold">{dateError}</p>}
          </div>
        )}

        {/* CONTENEDOR SEGUN TIPO DE GRAFICA FINANCIERA */}
        {activity.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#6E5545] bg-[#FAF5EE]/40 rounded-2xl border border-dashed border-[#DECDBB]">
            No hay registros de ventas monetarias para el periodo o sucursal seleccionada.
          </div>
        ) : financialChartType === "donut" ? (
          /* MODO 1: GRAFICA CIRCULAR / DONUT */
          <div className="rounded-2xl border border-[#E8DCCB] bg-[#FAF5EE]/40 p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[#E8DCCB] pb-3 gap-2">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#2B170F]">
                  Distribucion de Ingresos por Categoria de Pan
                </h3>
                <p className="text-xs text-[#6E5545]">
                  Aporte monetario de cada tipo de masa al total recaudado en caja
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                Total: Q{dayTotalRevenue > 0 ? dayTotalRevenue.toFixed(2) : financialTotals.totalRevenue.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-around gap-6 pt-2">
              {/* SVG Donut */}
              <div className="relative flex items-center justify-center">
                <svg width="240" height="240" viewBox="0 0 240 240" className="transform -rotate-90">
                  {(() => {
                    const radius = 80
                    const circumference = 2 * Math.PI * radius
                    let accumulatedOffset = 0

                    const dataToRender =
                      categoryFinancialData.length > 0
                        ? categoryFinancialData
                        : [
                            { category: "Pan", percentage: 40, color: "#2563EB" },
                            { category: "Pan Dulce", percentage: 25, color: "#D97706" },
                            { category: "Galletas", percentage: 15, color: "#EAB308" },
                            { category: "Reposteria", percentage: 12, color: "#EC4899" },
                            { category: "Donas", percentage: 8, color: "#8B5CF6" },
                          ]

                    return dataToRender.map((slice, i) => {
                      const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`
                      const strokeDashoffset = -accumulatedOffset
                      accumulatedOffset += (slice.percentage / 100) * circumference

                      return (
                        <circle
                          key={slice.category}
                          cx="120"
                          cy="120"
                          r={radius}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="32"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-500 hover:opacity-80"
                        />
                      )
                    })
                  })()}
                </svg>

                {/* Centro del Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C522B]">
                    Ventas
                  </span>
                  <span className="text-xl font-bold text-[#2B170F]">
                    Q{dayTotalRevenue > 0 ? dayTotalRevenue.toFixed(0) : financialTotals.totalRevenue.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-[#6E5545] font-semibold">Recaudado</span>
                </div>
              </div>

              {/* Leyenda Interactiva al Lado */}
              <div className="flex-1 w-full max-w-md space-y-2.5">
                {categoryFinancialData.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E8DCCB] shadow-2xs text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-bold text-[#2B170F]">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#6E5545] text-[11px]">{item.sold} uds</span>
                      <span className="font-bold text-emerald-700">Q{item.revenue.toFixed(2)}</span>
                      <span className="inline-block w-12 text-right font-bold text-[#8C522B] text-[11px]">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : financialChartType === "table" ? (
          /* MODO 2: VISTA TABULAR DE JORNADAS */
          <div className="rounded-2xl border border-[#E8DCCB] overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5EE] text-[#8C522B] border-b border-[#E8DCCB]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Fecha de Jornada</th>
                    <th className="py-3 px-4 font-bold text-right">Panes Vendidos</th>
                    <th className="py-3 px-4 font-bold text-right">Total en Quetzales</th>
                    <th className="py-3 px-4 font-bold text-right">Promedio / Pan</th>
                    <th className="py-3 px-4 font-bold text-center">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DCCB]">
                  {activity.map((row) => {
                    const rev = row.revenue !== undefined ? row.revenue : row.sold * 0.85
                    const avg = row.sold > 0 ? rev / row.sold : 0
                    const isSelected = selectedDayDate === row.date
                    const dateObj = new Date(`${row.date}T12:00:00`)

                    return (
                      <tr
                        key={row.date}
                        className={`transition hover:bg-[#FAF5EE]/60 ${
                          isSelected ? "bg-amber-50/80 font-semibold" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#2B170F]">
                            {dateObj.toLocaleDateString("es-GT", {
                              weekday: "short",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[#2B170F]">
                          {row.sold.toLocaleString()} uds
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          Q{rev.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right text-[#6E5545]">
                          Q{avg.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedDayDate(isSelected ? null : row.date)}
                            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              isSelected
                                ? "bg-[#D97706] text-white"
                                : "bg-[#FAF5EE] text-[#8C522B] border border-[#DECDBB] hover:border-[#D97706]"
                            }`}
                          >
                            {isSelected ? "Seleccionado" : "Ver panes"}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* MODO 3: GRAFICAS CONTINUAS (BARRAS, LINEAS, AREA) */
          <div className="space-y-3">
            <div className="relative w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}
                className="w-full h-64 sm:h-72 select-none"
              >
                {/* Lineas Guia Y */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = svgMetrics.paddingTop + svgMetrics.innerHeight * (1 - ratio)
                  const labelValue = Math.round(maxRevenue * ratio)
                  return (
                    <g key={ratio}>
                      <line
                        x1={svgMetrics.paddingLeft}
                        y1={y}
                        x2={svgMetrics.width - svgMetrics.paddingRight}
                        y2={y}
                        stroke="#E8DCCB"
                        strokeDasharray={ratio === 0 ? "none" : "3,3"}
                        strokeWidth={ratio === 0 ? "1.5" : "1"}
                      />
                      <text
                        x={svgMetrics.paddingLeft - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        fontSize="10"
                        fontWeight="600"
                        fill="#8C522B"
                      >
                        Q{labelValue}
                      </text>
                    </g>
                  )
                })}

                {/* Area Suave de Ingresos */}
                {financialChartType === "area" && svgMetrics.areaRevenue && (
                  <path
                    d={svgMetrics.areaRevenue}
                    fill="url(#financialRevenueGradient)"
                    opacity="0.65"
                  />
                )}

                {/* Linea Continua de Ingresos */}
                {(financialChartType === "lines" || financialChartType === "area") &&
                  svgMetrics.pathRevenue && (
                    <path
                      d={svgMetrics.pathRevenue}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  )}

                {/* Barras Verticales de Ingresos */}
                {financialChartType === "bars" &&
                  activity.map((item, idx) => {
                    const pt = svgMetrics.pointsRevenue[idx]
                    const barHeight = Math.max(4, svgMetrics.baselineY - pt.y)
                    const barWidth = Math.max(12, Math.min(36, svgMetrics.innerWidth / activity.length - 8))
                    const isSelected = selectedDayDate === item.date
                    const isHovered = hoveredIndex === idx

                    return (
                      <g
                        key={item.date}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={() => setSelectedDayDate(isSelected ? null : item.date)}
                      >
                        <rect
                          x={pt.x - barWidth / 2}
                          y={pt.y}
                          width={barWidth}
                          height={barHeight}
                          rx="6"
                          fill={isSelected ? "#D97706" : isHovered ? "#047857" : "#059669"}
                          className="transition-all duration-200"
                        />
                        {/* Etiqueta flotante del monto en la barra */}
                        {(isHovered || isSelected || activity.length <= 7) && (
                          <text
                            x={pt.x}
                            y={pt.y - 6}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill={isSelected ? "#D97706" : "#047857"}
                          >
                            Q{Math.round(pt.revenue)}
                          </text>
                        )}
                      </g>
                    )
                  })}

                {/* Puntos y Etiquetas X */}
                {activity.map((item, idx) => {
                  const pt = svgMetrics.pointsRevenue[idx]
                  const isSelected = selectedDayDate === item.date
                  const isHovered = hoveredIndex === idx
                  const dateObj = new Date(`${item.date}T12:00:00`)
                  const dayName = dateObj.toLocaleDateString("es-GT", { weekday: "short" }).replace(".", "")
                  const dayNum = dateObj.getDate()

                  return (
                    <g
                      key={item.date}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => setSelectedDayDate(isSelected ? null : item.date)}
                    >
                      {/* Puntos para Lineas/Area */}
                      {(financialChartType === "lines" || financialChartType === "area") && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? "6" : isSelected ? "5.5" : "3.5"}
                          fill={isSelected ? "#D97706" : "#059669"}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      )}

                      {/* Etiqueta del Eje X */}
                      <text
                        x={pt.x}
                        y={svgMetrics.baselineY + 16}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight={isSelected ? "bold" : "600"}
                        fill={isSelected ? "#D97706" : "#2B170F"}
                      >
                        {dayNum}
                      </text>
                      <text
                        x={pt.x}
                        y={svgMetrics.baselineY + 28}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="500"
                        fill="#8C522B"
                        className="uppercase"
                      >
                        {dayName}
                      </text>
                    </g>
                  )
                })}

                {/* Gradiente para Modo Area */}
                <defs>
                  <linearGradient id="financialRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        )}

        {/* Resumen del dia seleccionado */}
        {selectedDayDate && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#D97706]" />
              <span className="font-bold text-[#2B170F]">
                Filtro activo para:{" "}
                {new Date(`${selectedDayDate}T12:00:00`).toLocaleDateString("es-GT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDayDate(null)}
              className="inline-flex items-center gap-1 font-bold text-[#D97706] hover:text-[#B45309]"
            >
              <X className="h-3.5 w-3.5" />
              <span>Ver todo el periodo</span>
            </button>
          </div>
        )}
      </section>

      {/* 3. DESGLOSE DE VENTAS POR PRODUCTO (DRILL-DOWN MONETARIO) */}
      <section className="rounded-2xl border border-[#E8DCCB] bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E8DCCB] pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-[#D97706]">
                <Layers className="h-4 w-4" />
              </span>
              <h3 className="font-bold text-base text-[#2B170F]">
                Desglose Monetario por Pan
              </h3>
            </div>
            <p className="text-xs text-[#6E5545] mt-0.5">
              {selectedDayDate
                ? `Venta individual y aporte al dinero en caja para el ${selectedDayDate}`
                : "Ranking financiero de ventas y rentabilidad por producto en el periodo"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              Recaudacion: Q{dayTotalRevenue.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Barra de Filtros por Categoria, Buscador y Ordenamiento */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Pestañas de Categoria */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategoryTab("ALL")}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                selectedCategoryTab === "ALL"
                  ? "bg-white text-[#2B170F] border border-[#DECDBB] shadow-2xs"
                  : "text-[#6E5545] hover:text-[#2B170F]"
              }`}
            >
              Todos los panes ({itemsWithMetrics.length})
            </button>
            {uniqueCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryTab(cat)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategoryTab === cat
                    ? "bg-[#D97706] text-white shadow-2xs"
                    : "text-[#6E5545] hover:text-[#2B170F] bg-[#FAF5EE]"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] || DEFAULT_COLOR }}
                />
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Buscador y Ordenamiento */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8C522B]" />
              <input
                type="text"
                placeholder="Buscar pan..."
                value={financialSearch}
                onChange={(e) => setFinancialSearch(e.target.value)}
                className="w-full min-h-[38px] rounded-xl border border-[#DECDBB] bg-white py-1.5 pl-8 pr-3 text-xs text-[#2B170F] placeholder-[#8C522B]/60 focus:border-[#D97706] focus:outline-none"
              />
            </div>

            <select
              value={financialSortBy}
              onChange={(e) => setFinancialSortBy(e.target.value as any)}
              className="min-h-[38px] rounded-xl border border-[#DECDBB] bg-[#FAF5EE] px-2.5 text-xs font-semibold text-[#2B170F] focus:outline-none cursor-pointer"
            >
              <option value="revenue">Mayor Dinero (Q)</option>
              <option value="sold">Mas Vendidos (uds)</option>
              <option value="price">Mayor Precio (Q)</option>
            </select>
          </div>
        </div>

        {/* Tabla de Productos */}
        {isBreakdownLoading ? (
          <div className="py-8 text-center text-xs text-[#6E5545]">
            Cargando desglose monetario de panes...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#6E5545] bg-[#FAF5EE]/40 rounded-xl border border-dashed border-[#DECDBB]">
            No se encontraron panes con ventas para este filtro o fecha.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E8DCCB]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] text-[#8C522B] border-b border-[#E8DCCB]">
                <tr>
                  <th className="py-2.5 px-3 font-bold w-12 text-center">#</th>
                  <th className="py-2.5 px-3 font-bold">Pan y Categoria</th>
                  <th className="py-2.5 px-3 font-bold text-right">Precio</th>
                  <th className="py-2.5 px-3 font-bold text-right">Unidades</th>
                  <th className="py-2.5 px-3 font-bold text-right">Total en Quetzales</th>
                  <th className="py-2.5 px-3 font-bold w-48 text-right">% Aporte a Caja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCCB]">
                {filteredProducts.map((item, idx) => {
                  const contribPct = dayTotalRevenue > 0 ? (item.revenue / dayTotalRevenue) * 100 : 0

                  return (
                    <tr key={item.productId} className="hover:bg-[#FAF5EE]/50 transition">
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF5EE] border border-[#DECDBB] text-[10px] font-bold text-[#8C522B]">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#2B170F]">{item.productName}</span>
                          <span className="text-[10px] text-[#8C522B] font-semibold">
                            {item.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#6E5545]">
                        Q{item.price.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#2B170F]">
                        {item.sold.toLocaleString()} uds
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        Q{item.revenue.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-2 w-24 rounded-full bg-[#FAF5EE] border border-[#DECDBB]/60 overflow-hidden hidden sm:block">
                            <div
                              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                              style={{ width: `${Math.min(100, contribPct)}%` }}
                            />
                          </div>
                          <span className="font-bold text-[#8C522B] text-[11px] w-12 text-right">
                            {contribPct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
