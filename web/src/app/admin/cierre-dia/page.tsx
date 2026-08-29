"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { 
  TriangleAlert as AlertTriangle, 
  ArrowLeft, 
  Check, 
  ClipboardCheck, 
  Factory as History, 
  Loader2, 
  RefreshCw, 
  Save, 
  Store, 
  TrendingDown, 
  TrendingUp,
  Search,
  ShoppingBag,
  Croissant,
  CheckCircle2,
  Calendar,
  X,
  Plus,
  Minus
} from "lucide-react"
import {
  branchesService,
  dailyCloseService,
  type ApiBranch,
  type DailyCloseDetail,
  type DailyClosePreviewItem,
} from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { PresentationCountFields } from "@/components/admin/PresentationCountFields"
import { baseQuantityFromCounts, breakdownBaseQuantity } from "@/lib/presentation-quantities"

interface CloseEntry extends DailyClosePreviewItem {
  countedInput: string
  wasteInput: string
  countedPresentationInputs: Record<string, string>
  wastePresentationInputs: Record<string, string>
  countedLooseInput: string
  wasteLooseInput: string
}

interface Projection {
  productId: number
  countedQty: number
  wasteQty: number
  soldQty: number
  surplusQty: number
  valid: boolean
}

function businessDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value || ""
  return `${value("year")}-${value("month")}-${value("day")}`
}

function isWholeNumber(value: string) {
  return /^\d+$/.test(value)
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string" && message) return message
    if (Array.isArray(message) && typeof message[0] === "string") return message[0]
  }
  return fallback
}

export default function DailyClosePage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [branches, setBranches] = useState<ApiBranch[]>([])
  const [branchId, setBranchId] = useState<number | null>(null)
  const [closeDate, setCloseDate] = useState(businessDate)
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null)
  const [entries, setEntries] = useState<CloseEntry[]>([])
  const [note, setNote] = useState("")
  const [result, setResult] = useState<DailyCloseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros de navegación
  const [activeTab, setActiveTab] = useState<"PRODUCIDO" | "COMPRADO">("PRODUCIDO")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "with_sales" | "with_waste">("all")

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const loadBranches = async () => {
      try {
        if (user.role === "ADMIN" || user.role === "MANAGER") {
          const data = await branchesService.list()
          if (!cancelled) {
            setBranches(data)
            setBranchId((current) => current ?? data[0]?.id ?? null)
            if (data.length === 0) {
              setError("No hay sucursales disponibles para cerrar")
              setIsLoading(false)
            }
          }
        } else if (!cancelled) {
          const assignedBranchId = user.branch?.id ?? user.branchId ?? null
          setBranchId(assignedBranchId)
          if (!assignedBranchId) {
            setError("El usuario no tiene una sucursal asignada")
            setIsLoading(false)
          }
        }
      } catch (loadError) {
        console.error("Error cargando sucursales", loadError)
        if (!cancelled) {
          setError("No fue posible cargar las sucursales")
          setIsLoading(false)
        }
      }
    }

    void loadBranches()
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!branchId || !closeDate) return
    let cancelled = false

    const loadPreview = async () => {
      setIsLoading(true)
      setError(null)
      setResult(null)
      try {
        const preview = await dailyCloseService.preview(branchId, closeDate)
        if (cancelled) return
        setSnapshotAt(preview.snapshotAt)
        setEntries(preview.items.map((item) => {
          const presentations = item.presentations ?? []
          const countedBreakdown = breakdownBaseQuantity(item.countedQty, presentations)
          const wasteBreakdown = breakdownBaseQuantity(item.wasteQty, presentations)
          return {
            ...item,
            origin: item.origin ?? "PRODUCIDO",
            countedInput: String(item.countedQty),
            wasteInput: String(item.wasteQty),
            countedPresentationInputs: presentations.length > 0 ? countedBreakdown.counts : {},
            wastePresentationInputs: presentations.length > 0 ? wasteBreakdown.counts : {},
            countedLooseInput: presentations.length > 0 ? countedBreakdown.loose : "",
            wasteLooseInput: presentations.length > 0 ? wasteBreakdown.loose : "",
          }
        }))
      } catch (loadError: unknown) {
        console.error("Error cargando vista previa del cierre", loadError)
        if (!cancelled) {
          setEntries([])
          setSnapshotAt(null)
          setError(errorMessage(loadError, "No fue posible cargar la vista previa"))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadPreview()
    return () => {
      cancelled = true
    }
  }, [branchId, closeDate])

  const projections = useMemo<Projection[]>(() => entries.map((entry) => {
    const hasPresentations = (entry.presentations?.length ?? 0) > 0
    const countedQty = hasPresentations
      ? baseQuantityFromCounts(entry.countedPresentationInputs, entry.presentations ?? [], entry.countedLooseInput)
      : (isWholeNumber(entry.countedInput) ? Number(entry.countedInput) : Number.NaN)
    const wasteQty = hasPresentations
      ? baseQuantityFromCounts(entry.wastePresentationInputs, entry.presentations ?? [], entry.wasteLooseInput)
      : (isWholeNumber(entry.wasteInput) ? Number(entry.wasteInput) : Number.NaN)
    const countedValid = Number.isInteger(countedQty) && countedQty >= 0
    const wasteValid = Number.isInteger(wasteQty) && wasteQty >= 0
    const afterWaste = entry.systemQty - wasteQty
    const valid = countedValid && wasteValid && countedQty >= entry.reservedQty && wasteQty <= entry.systemQty

    return {
      productId: entry.productId,
      countedQty,
      wasteQty,
      soldQty: Math.max(afterWaste - countedQty, 0),
      surplusQty: Math.max(countedQty - afterWaste, 0),
      valid,
    }
  }), [entries])

  const projectionMap = useMemo(
    () => new Map(projections.map((projection) => [projection.productId, projection])),
    [projections],
  )

  const totals = useMemo(() => projections.reduce((summary, projection) => ({
    soldQty: summary.soldQty + projection.soldQty,
    wasteQty: summary.wasteQty + projection.wasteQty,
    surplusQty: summary.surplusQty + projection.surplusQty,
  }), { soldQty: 0, wasteQty: 0, surplusQty: 0 }), [projections])

  // Separación por tipo de producto
  const producedEntries = useMemo(() => entries.filter((e) => (e.origin ?? "PRODUCIDO") === "PRODUCIDO"), [entries])
  const purchasedEntries = useMemo(() => entries.filter((e) => e.origin === "COMPRADO"), [entries])

  // Filtrado actual
  const currentTabEntries = activeTab === "PRODUCIDO" ? producedEntries : purchasedEntries

  const filteredEntries = useMemo(() => {
    return currentTabEntries.filter((entry) => {
      const matchesSearch = 
        entry.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.categoryName && entry.categoryName.toLowerCase().includes(searchQuery.toLowerCase()))

      if (!matchesSearch) return false

      const projection = projectionMap.get(entry.productId)
      if (!projection) return true

      if (filterStatus === "with_sales") return projection.soldQty > 0
      if (filterStatus === "with_waste") return projection.wasteQty > 0
      if (filterStatus === "pending") return !projection.valid || isNaN(projection.countedQty)

      return true
    })
  }, [currentTabEntries, searchQuery, filterStatus, projectionMap])

  const invalidEntry = entries.find((entry) => !projectionMap.get(entry.productId)?.valid)

  const selectedBranchName = branches.find((branch) => branch.id === branchId)?.name
    || user?.branch?.name
    || "Sucursal"

  // Actualizaciones de campos
  const updateEntry = (productId: number, field: "countedInput" | "wasteInput", value: string) => {
    setEntries((current) => current.map((entry) => (
      entry.productId === productId ? { ...entry, [field]: value } : entry
    )))
  }

  const updatePresentationEntry = (productId: number, field: "countedPresentationInputs" | "wastePresentationInputs", presentationId: number, value: string) => {
    setEntries((current) => current.map((entry) => entry.productId === productId
      ? { ...entry, [field]: { ...entry[field], [String(presentationId)]: value } }
      : entry
    ))
  }

  const updateLooseEntry = (productId: number, field: "countedLooseInput" | "wasteLooseInput", value: string) => {
    setEntries((current) => current.map((entry) => entry.productId === productId ? { ...entry, [field]: value } : entry))
  }

  // Acciones rápidas
  const setAllTabToZero = () => {
    const idsToUpdate = new Set(currentTabEntries.map((e) => e.productId))
    setEntries((current) => current.map((entry) => {
      if (!idsToUpdate.has(entry.productId)) return entry
      const presentations = entry.presentations ?? []
      const zeroPresentationInputs: Record<string, string> = {}
      presentations.forEach((p) => { zeroPresentationInputs[String(p.id)] = "0" })

      return {
        ...entry,
        countedInput: "0",
        countedPresentationInputs: zeroPresentationInputs,
        countedLooseInput: "0",
      }
    }))
    showToast(`Se marcó en 0 el conteo de todos los productos ${activeTab === 'PRODUCIDO' ? 'producidos' : 'comprados'}`, "info")
  }

  const copySystemToCounted = () => {
    const idsToUpdate = new Set(currentTabEntries.map((e) => e.productId))
    setEntries((current) => current.map((entry) => {
      if (!idsToUpdate.has(entry.productId)) return entry
      const presentations = entry.presentations ?? []
      const breakdown = breakdownBaseQuantity(entry.systemQty, presentations)

      return {
        ...entry,
        countedInput: String(entry.systemQty),
        countedPresentationInputs: presentations.length > 0 ? breakdown.counts : {},
        countedLooseInput: presentations.length > 0 ? breakdown.loose : "",
        wasteInput: "0",
        wastePresentationInputs: {},
        wasteLooseInput: "0",
      }
    }))
    showToast("Se copió el stock del sistema al conteo físico", "info")
  }

  const adjustQuickCount = (productId: number, delta: number) => {
    const entry = entries.find((e) => e.productId === productId)
    if (!entry) return
    const currentVal = parseInt(entry.countedInput || "0", 10) || 0
    const nextVal = Math.max(0, currentVal + delta)
    updateEntry(productId, "countedInput", String(nextVal))
  }

  const handleSubmit = async () => {
    if (!branchId || !snapshotAt || entries.length === 0) {
      showToast("No hay inventario disponible para cerrar", "error")
      return
    }
    if (invalidEntry) {
      showToast(`Revisa las cantidades de ${invalidEntry.productName}`, "error")
      return
    }

    setIsSubmitting(true)
    try {
      const close = await dailyCloseService.create({
        branchId,
        closeDate,
        snapshotAt,
        note: note.trim() || undefined,
        items: entries.map((entry) => {
          const projection = projectionMap.get(entry.productId)!
          return {
            productId: entry.productId,
            countedQty: projection.countedQty,
            wasteQty: projection.wasteQty,
            countedPresentations: entry.presentations?.length && Number(entry.countedLooseInput || 0) === 0
              ? Object.entries(entry.countedPresentationInputs).filter(([, quantity]) => quantity !== "").map(([presentationId, quantity]) => ({ presentationId: Number(presentationId), quantity: Number(quantity) }))
              : undefined,
            wastePresentations: entry.presentations?.length && Number(entry.wasteLooseInput || 0) === 0
              ? Object.entries(entry.wastePresentationInputs).filter(([, quantity]) => quantity !== "").map(([presentationId, quantity]) => ({ presentationId: Number(presentationId), quantity: Number(quantity) }))
              : undefined,
          }
        }),
      })
      setResult(close)
      showToast("Cierre diario registrado correctamente", "success")
    } catch (submitError: unknown) {
      showToast(errorMessage(submitError, "No fue posible registrar el cierre"), "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Vista de éxito / Cierre Registrado
  if (result) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-[#E8DCCB] bg-white p-6 shadow-xs sm:p-8">
          <div className="mb-8 text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-8 w-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2B170F] font-display">¡Cierre Diario Registrado!</h1>
            <p className="text-xs sm:text-sm text-[#6E5545]">
              Jornada: <span className="font-bold text-[#2B170F]">{result.closeDate}</span> · Sucursal: <span className="font-bold text-[#2B170F]">{selectedBranchName}</span>
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Ventas calculadas" value={result.summary.totalSold} tone="blue" />
            <SummaryCard label="Mermas declaradas" value={result.summary.totalWaste} tone="orange" />
            <SummaryCard label="Sobrantes" value={result.summary.totalSurplus} tone="green" />
            <SummaryCard label="Productos cerrados" value={result.summary.productsClosed} tone="gray" />
          </div>

          <div className="mb-8 overflow-x-auto rounded-2xl border border-[#E8DCCB]">
            <table className="w-full min-w-[620px] text-xs">
              <thead className="bg-[#FAF5EE] text-left text-[11px] uppercase text-[#8C522B] font-bold">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-center">Stock Sistema</th>
                  <th className="px-4 py-3 text-center">Conteo Físico</th>
                  <th className="px-4 py-3 text-center">Venta</th>
                  <th className="px-4 py-3 text-center">Merma</th>
                  <th className="px-4 py-3 text-center">Sobrante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCCB]">
                {result.items.map((item) => (
                  <tr key={item.productId} className="hover:bg-[#FAF5EE]/40">
                    <td className="px-4 py-3 font-bold text-[#2B170F]">{item.productName}</td>
                    <td className="px-4 py-3 text-center text-[#6E5545]">{item.systemQty}</td>
                    <td className="px-4 py-3 text-center font-bold text-[#2B170F]">{item.countedQty}</td>
                    <td className="px-4 py-3 text-center font-bold text-sky-700">{item.soldQty}</td>
                    <td className="px-4 py-3 text-center font-bold text-[#D97706]">{item.wasteQty}</td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-700">{item.surplusQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
              <Link href="/admin/cierre-dia/historial">
                <Button variant="outline" className="border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl h-11 text-xs font-bold">
                  <History className="mr-2 h-4 w-4 text-[#D97706]" />Ver historial
                </Button>
              </Link>
            )}
            <Link href="/admin">
              <Button className="bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl h-11 text-xs font-bold shadow-xs">
                <ArrowLeft className="mr-2 h-4 w-4" />Volver al panel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Superior */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/admin" className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[#8C522B] hover:text-[#2B170F] transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />Volver al panel
            </Link>
            <h1 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-bold text-[#2B170F] font-display">
              <ClipboardCheck className="h-7 w-7 text-[#D97706] flex-shrink-0" />
              Cierre del Día
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#6E5545] max-w-2xl leading-relaxed">
              Arqueo físico de inventario al final de la jornada. Cuenta las piezas restantes para deducir automáticamente las ventas en mostrador y mermas.
            </p>
          </div>
          {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
            <Link href="/admin/cierre-dia/historial">
              <Button variant="outline" size="sm" className="border-[#DECDBB] text-[#2B170F] hover:bg-white rounded-xl h-10 text-xs font-bold shadow-xs">
                <History className="mr-2 h-4 w-4 text-[#D97706]" />Historial de Cierres
              </Button>
            </Link>
          )}
        </div>

        {/* Panel de Configuración (Sucursal y Fecha) */}
        <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-stone-500">Sucursal</span>
            <div className="relative">
              <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              {user?.role === "ADMIN" || user?.role === "MANAGER" ? (
                <select
                  value={branchId ?? ""}
                  onChange={(event) => setBranchId(Number(event.target.value) || null)}
                  className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm font-medium text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Seleccionar sucursal</option>
                  {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </select>
              ) : (
                <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 pl-9 text-sm font-medium text-gray-900">
                  {selectedBranchName}
                </div>
              )}
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-stone-500">Fecha operativa</span>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="date"
                value={closeDate}
                onChange={(event) => setCloseDate(event.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm font-medium text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </label>

          <div className="flex items-center text-xs text-amber-800 bg-amber-50/80 rounded-xl p-3 border border-amber-200/80">
            <span><strong>Tip:</strong> Puedes contar por bandejas/tiras completas o unidades sueltas. El sistema recalcula la venta en tiempo real.</span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold text-sm">Error al cargar el cierre</p>
              <p className="text-xs sm:text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-16 text-center shadow-sm">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            <p className="font-medium text-gray-900">Capturando inventario del sistema...</p>
            <p className="text-xs text-stone-500 mt-1">Obteniendo productos y presentaciones registradas</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 sm:p-16 text-center shadow-sm space-y-3">
            <ClipboardCheck className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="text-lg font-bold text-gray-900">No hay productos con inventario para esta sucursal</h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto">
              Registra producción o compras para inicializar las existencias antes de realizar el cierre.
            </p>
          </div>
        ) : (
          <>
            {/* Tarjetas de Totales Generales */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <SummaryCard 
                label="Ventas Calculadas" 
                value={totals.soldQty} 
                tone="blue" 
                icon={<TrendingDown className="h-4 w-4" />} 
              />
              <SummaryCard 
                label="Mermas Totales" 
                value={totals.wasteQty} 
                tone="orange" 
                icon={<AlertTriangle className="h-4 w-4" />} 
              />
              <SummaryCard 
                label="Sobrantes" 
                value={totals.surplusQty} 
                tone="green" 
                icon={<TrendingUp className="h-4 w-4" />} 
              />
            </div>

            {/* Selector de Pestañas Principales (Producidos vs Comprados) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-stone-200 pb-2">
              <div className="flex rounded-xl bg-stone-200/70 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("PRODUCIDO")}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                    activeTab === "PRODUCIDO"
                      ? "bg-white text-primary shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Croissant className="h-4 w-4" />
                  <span>Producidos (Panes)</span>
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    activeTab === "PRODUCIDO" ? "bg-amber-100 text-amber-900" : "bg-stone-300 text-stone-700"
                  }`}>
                    {producedEntries.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("COMPRADO")}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                    activeTab === "COMPRADO"
                      ? "bg-white text-primary shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Comprados (Bebidas/Reventa)</span>
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    activeTab === "COMPRADO" ? "bg-amber-100 text-amber-900" : "bg-stone-300 text-stone-700"
                  }`}>
                    {purchasedEntries.length}
                  </span>
                </button>
              </div>

              {/* Acciones Rápidas de la Pestaña Activa */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={setAllTabToZero}
                  className="text-xs h-9 border-stone-300 hover:bg-stone-100 text-stone-700 font-medium"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  Marcar todo en 0 restante
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copySystemToCounted}
                  className="text-xs h-9 border-stone-300 hover:bg-stone-100 text-stone-700 font-medium"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                  Copiar stock sistema
                </Button>
              </div>
            </div>

            {/* Barra de Búsqueda y Filtros Rápidos */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar ${activeTab === 'PRODUCIDO' ? 'pan dulce, francés o concha...' : 'bebida o producto...'}`}
                  className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus("all")}
                  className={`rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-colors ${
                    filterStatus === "all" ? "bg-stone-900 text-white" : "bg-stone-200/70 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  Todos ({currentTabEntries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("with_sales")}
                  className={`rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-colors ${
                    filterStatus === "with_sales" ? "bg-blue-600 text-white" : "bg-stone-200/70 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  Con Ventas
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("with_waste")}
                  className={`rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-colors ${
                    filterStatus === "with_waste" ? "bg-amber-600 text-white" : "bg-stone-200/70 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  Con Merma
                </button>
              </div>
            </div>

            {/* LISTADO DE PRODUCTOS */}
            {filteredEntries.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">
                No se encontraron productos en esta pestaña con los filtros seleccionados.
              </div>
            ) : (
              <>
                {/* VISTA MÓVIL: Tarjetas Táctiles e Intuitivas */}
                <div className="block lg:hidden space-y-3.5">
                  {filteredEntries.map((entry) => {
                    const projection = projectionMap.get(entry.productId)!
                    const hasValidationIssue = !projection.valid
                    const hasPresentations = (entry.presentations?.length ?? 0) > 0

                    return (
                      <div 
                        key={entry.productId} 
                        className={`rounded-2xl border bg-white p-4 shadow-sm transition-all ${
                          hasValidationIssue ? "border-red-300 bg-red-50/30 ring-1 ring-red-200" : "border-stone-200"
                        }`}
                      >
                        {/* Cabecera del Producto */}
                        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-stone-100">
                          <div>
                            <h4 className="text-base font-bold text-gray-900 leading-snug">{entry.productName}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-stone-500 font-mono">{entry.sku}</span>
                              {entry.categoryName && (
                                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
                                  {entry.categoryName}
                                </span>
                              )}
                              {!entry.isActive && (
                                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                                  Inactivo
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-semibold text-stone-500 block">Stock Sistema</span>
                            <span className="text-base font-bold text-gray-900">{entry.systemQty}</span>
                            {entry.reservedQty > 0 && (
                              <span className="block text-[11px] font-semibold text-amber-600">
                                ({entry.reservedQty} reserv.)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Entradas de Conteo y Merma */}
                        <div className="pt-3 space-y-3">
                          {hasPresentations ? (
                            <div className="bg-stone-50/80 p-3 rounded-xl border border-stone-200/80 space-y-2.5">
                              <PresentationCountFields
                                presentations={entry.presentations ?? []}
                                values={entry.countedPresentationInputs}
                                looseValue={entry.countedLooseInput}
                                unitLabel={entry.stockUnitLabel ?? "piezas"}
                                label="Conteo Físico por Presentación"
                                onChange={(presentationId, value) => updatePresentationEntry(entry.productId, "countedPresentationInputs", presentationId, value)}
                                onLooseChange={(value) => updateLooseEntry(entry.productId, "countedLooseInput", value)}
                              />
                              <div className="pt-2 border-t border-stone-200">
                                <PresentationCountFields
                                  presentations={entry.presentations ?? []}
                                  values={entry.wastePresentationInputs}
                                  looseValue={entry.wasteLooseInput}
                                  unitLabel={entry.stockUnitLabel ?? "piezas"}
                                  label="Merma / Descarte"
                                  onChange={(presentationId, value) => updatePresentationEntry(entry.productId, "wastePresentationInputs", presentationId, value)}
                                  onLooseChange={(value) => updateLooseEntry(entry.productId, "wasteLooseInput", value)}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                  Conteo Físico
                                </label>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => adjustQuickCount(entry.productId, -1)}
                                    className="h-10 w-9 rounded-lg border border-stone-300 bg-stone-50 text-stone-700 font-bold flex items-center justify-center active:bg-stone-200"
                                    aria-label="Restar 1"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={entry.countedInput}
                                    onChange={(e) => updateEntry(entry.productId, "countedInput", e.target.value)}
                                    className={`w-full h-10 rounded-lg border text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary ${
                                      hasValidationIssue ? "border-red-400 bg-red-50 text-red-900" : "border-stone-300"
                                    }`}
                                    aria-label={`Conteo de ${entry.productName}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => adjustQuickCount(entry.productId, +1)}
                                    className="h-10 w-9 rounded-lg border border-stone-300 bg-stone-50 text-stone-700 font-bold flex items-center justify-center active:bg-stone-200"
                                    aria-label="Sumar 1"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                  Merma / Dañado
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={entry.wasteInput}
                                  onChange={(e) => updateEntry(entry.productId, "wasteInput", e.target.value)}
                                  className="w-full h-10 rounded-lg border border-stone-300 text-center font-semibold text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="0"
                                  aria-label={`Merma de ${entry.productName}`}
                                />
                              </div>
                            </div>
                          )}

                          {/* Resultado en Tiempo Real */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-stone-500 font-medium">Venta calculada:</span>
                              <span className="font-bold text-blue-600 text-sm bg-blue-50 px-2 py-0.5 rounded">
                                {projection.soldQty} {entry.stockUnitLabel ?? "piezas"}
                              </span>
                            </div>

                            {projection.surplusQty > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-stone-500 font-medium">Sobrante:</span>
                                <span className="font-bold text-emerald-600 text-sm bg-emerald-50 px-2 py-0.5 rounded">
                                  +{projection.surplusQty}
                                </span>
                              </div>
                            )}

                            {projection.wasteQty > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-stone-500 font-medium">Merma:</span>
                                <span className="font-bold text-amber-600 text-sm bg-amber-50 px-2 py-0.5 rounded">
                                  {projection.wasteQty}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Alertas si hay error */}
                          {hasValidationIssue && (
                            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                              {projection.countedQty < entry.reservedQty
                                ? `El conteo no puede ser menor a las ${entry.reservedQty} unidades reservadas.`
                                : "Verifica que el conteo y la merma sean números válidos."}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* VISTA ESCRITORIO: Tabla Completa */}
                <div className="hidden lg:block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-stone-100/70 text-left text-xs uppercase text-stone-600 font-semibold">
                        <tr>
                          <th className="px-4 py-3.5">Producto</th>
                          <th className="px-3 py-3.5 text-center">Stock Sistema</th>
                          <th className="px-3 py-3.5 text-center">Reservado</th>
                          <th className="px-4 py-3.5 text-center min-w-[200px]">Conteo Físico</th>
                          <th className="px-3 py-3.5 text-center min-w-[120px]">Merma</th>
                          <th className="px-3 py-3.5 text-center">Venta Calculada</th>
                          <th className="px-3 py-3.5 text-center">Sobrante</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredEntries.map((entry) => {
                          const projection = projectionMap.get(entry.productId)!
                          const hasValidationIssue = !projection.valid
                          return (
                            <tr key={entry.productId} className={hasValidationIssue ? "bg-red-50/40" : "hover:bg-stone-50/50"}>
                              <td className="px-4 py-3.5">
                                <p className="font-bold text-gray-900">{entry.productName}</p>
                                <div className="flex items-center gap-2 text-xs text-stone-500">
                                  <span>{entry.sku}</span>
                                  {entry.categoryName && <span>· {entry.categoryName}</span>}
                                  {!entry.isActive && <span className="text-red-600">· Inactivo</span>}
                                </div>
                              </td>
                              <td className="px-3 py-3.5 text-center font-bold text-gray-900">{entry.systemQty}</td>
                              <td className="px-3 py-3.5 text-center text-amber-700 font-semibold">{entry.reservedQty}</td>
                              <td className="px-4 py-3.5">
                                {entry.presentations?.length ? (
                                  <PresentationCountFields
                                    presentations={entry.presentations}
                                    values={entry.countedPresentationInputs}
                                    looseValue={entry.countedLooseInput}
                                    unitLabel={entry.stockUnitLabel ?? "piezas"}
                                    label="Conteo"
                                    onChange={(presentationId, value) => updatePresentationEntry(entry.productId, "countedPresentationInputs", presentationId, value)}
                                    onLooseChange={(value) => updateLooseEntry(entry.productId, "countedLooseInput", value)}
                                  />
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={entry.countedInput}
                                    onChange={(event) => updateEntry(entry.productId, "countedInput", event.target.value)}
                                    className={`w-full max-w-[120px] mx-auto block rounded-lg border px-3 py-2 text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary ${
                                      hasValidationIssue ? "border-red-400 bg-red-50 text-red-900" : "border-stone-300"
                                    }`}
                                    aria-label={`Conteo físico de ${entry.productName}`}
                                  />
                                )}
                              </td>
                              <td className="px-3 py-3.5">
                                {entry.presentations?.length ? (
                                  <PresentationCountFields
                                    presentations={entry.presentations}
                                    values={entry.wastePresentationInputs}
                                    looseValue={entry.wasteLooseInput}
                                    unitLabel={entry.stockUnitLabel ?? "piezas"}
                                    label="Merma"
                                    onChange={(presentationId, value) => updatePresentationEntry(entry.productId, "wastePresentationInputs", presentationId, value)}
                                    onLooseChange={(value) => updateLooseEntry(entry.productId, "wasteLooseInput", value)}
                                  />
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={entry.wasteInput}
                                    onChange={(event) => updateEntry(entry.productId, "wasteInput", event.target.value)}
                                    className={`w-full max-w-[90px] mx-auto block rounded-lg border px-3 py-2 text-center font-medium focus:outline-none focus:ring-2 focus:ring-primary ${
                                      hasValidationIssue ? "border-red-400 bg-red-50" : "border-stone-300"
                                    }`}
                                    aria-label={`Merma de ${entry.productName}`}
                                  />
                                )}
                              </td>
                              <td className="px-3 py-3.5 text-center font-bold text-blue-600">{projection.soldQty}</td>
                              <td className="px-3 py-3.5 text-center font-bold text-emerald-600">{projection.surplusQty}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Nota del Cierre y Confirmación */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-stone-500">Nota u observaciones del cierre (opcional)</span>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={500}
                  placeholder="Ej. Cierre de turno tarde, sobrante en pan francés y merma por conchas rotas"
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-start gap-2 text-xs text-stone-500">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>Al confirmar, el sistema registrará los movimientos de venta no registrada y merma, y ajustará el stock físico oficial.</span>
                </div>

                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || Boolean(invalidEntry)} 
                  size="lg"
                  className="w-full sm:w-auto min-w-[220px] font-bold h-12 shadow-md"
                >
                  {isSubmitting ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Guardando Cierre...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" />Registrar Cierre Diario</>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* BARRA INFERIOR STICKY (Resumen Rápido en Móvil) */}
      {entries.length > 0 && !result && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 p-3 sm:hidden shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="text-stone-500 block">Venta / Merma total:</span>
              <span className="font-bold text-gray-900 text-sm">
                {totals.soldQty} vend. · {totals.wasteQty} merm.
              </span>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || Boolean(invalidEntry)} 
              className="font-bold h-11 px-5"
            >
              {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Guardar Cierre"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: number
  tone: "blue" | "orange" | "green" | "gray"
  icon?: React.ReactNode
}) {
  const tones = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    orange: "bg-amber-50 border-amber-200 text-amber-800",
    green: "bg-emerald-50 border-emerald-200 text-emerald-800",
    gray: "bg-stone-100 border-stone-200 text-stone-800",
  }
  return (
    <div className={`rounded-2xl border p-3 sm:p-4 text-center shadow-sm ${tones[tone]}`}>
      <div className="flex items-center justify-center gap-1.5 text-xl sm:text-2xl font-black">
        {icon}
        {value.toLocaleString("es-GT")}
      </div>
      <p className="mt-0.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">{label}</p>
    </div>
  )
}
