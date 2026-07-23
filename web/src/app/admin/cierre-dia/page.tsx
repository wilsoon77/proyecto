"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ClipboardCheck,
  History,
  Loader2,
  RefreshCw,
  Save,
  Store,
  TrendingDown,
  TrendingUp,
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

interface CloseEntry extends DailyClosePreviewItem {
  countedInput: string
  wasteInput: string
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

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const loadBranches = async () => {
      try {
        if (user.role === "ADMIN") {
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
    setIsLoading(true)
    setError(null)
    setResult(null)

    const loadPreview = async () => {
      try {
        const preview = await dailyCloseService.preview(branchId, closeDate)
        if (cancelled) return
        setSnapshotAt(preview.snapshotAt)
        setEntries(preview.items.map((item) => ({
          ...item,
          countedInput: String(item.countedQty),
          wasteInput: String(item.wasteQty),
        })))
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
    const countedValid = isWholeNumber(entry.countedInput)
    const wasteValid = isWholeNumber(entry.wasteInput)
    const countedQty = countedValid ? Number(entry.countedInput) : 0
    const wasteQty = wasteValid ? Number(entry.wasteInput) : 0
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

  const invalidEntry = entries.find((entry) => !projectionMap.get(entry.productId)?.valid)

  const selectedBranchName = branches.find((branch) => branch.id === branchId)?.name
    || user?.branch?.name
    || "Sucursal"

  const updateEntry = (productId: number, field: "countedInput" | "wasteInput", value: string) => {
    setEntries((current) => current.map((entry) => (
      entry.productId === productId ? { ...entry, [field]: value } : entry
    )))
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
        items: projections.map((projection) => ({
          productId: projection.productId,
          countedQty: projection.countedQty,
          wasteQty: projection.wasteQty,
        })),
      })
      setResult(close)
      showToast("Cierre diario registrado correctamente", "success")
    } catch (submitError: unknown) {
      showToast(errorMessage(submitError, "No fue posible registrar el cierre"), "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Cierre registrado</h1>
              <p className="mt-1 text-gray-500">{result.closeDate} · {selectedBranchName}</p>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard label="Ventas calculadas" value={result.summary.totalSold} tone="blue" />
              <SummaryCard label="Mermas" value={result.summary.totalWaste} tone="orange" />
              <SummaryCard label="Sobrantes" value={result.summary.totalSurplus} tone="green" />
              <SummaryCard label="Productos" value={result.summary.productsClosed} tone="gray" />
            </div>

            <div className="mb-8 overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3 text-center">Sistema</th>
                    <th className="px-4 py-3 text-center">Conteo</th>
                    <th className="px-4 py-3 text-center">Venta</th>
                    <th className="px-4 py-3 text-center">Merma</th>
                    <th className="px-4 py-3 text-center">Sobrante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.items.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{item.systemQty}</td>
                      <td className="px-4 py-3 text-center font-semibold">{item.countedQty}</td>
                      <td className="px-4 py-3 text-center text-blue-700">{item.soldQty}</td>
                      <td className="px-4 py-3 text-center text-orange-700">{item.wasteQty}</td>
                      <td className="px-4 py-3 text-center text-green-700">{item.surplusQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
                <Link href="/admin/cierre-dia/historial">
                  <Button variant="outline"><History className="h-4 w-4" />Ver historial</Button>
                </Link>
              )}
              <Link href="/admin">
                <Button><ArrowLeft className="h-4 w-4" />Volver al panel</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" />Volver al panel
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <ClipboardCheck className="h-7 w-7 text-amber-600" />Cierre del día
            </h1>
            <p className="mt-1 max-w-2xl text-gray-500">
              Registra el conteo físico al final de la jornada. El sistema calcula las ventas que no pasaron por POS o pedidos y mantiene las alertas de inventario.
            </p>
          </div>
          {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
            <Link href="/admin/cierre-dia/historial">
              <Button variant="outline"><History className="h-4 w-4" />Historial</Button>
            </Link>
          )}
        </div>

        <div className="mb-6 grid gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Sucursal</span>
            <div className="relative">
              <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              {user?.role === "ADMIN" ? (
                <select
                  value={branchId ?? ""}
                  onChange={(event) => setBranchId(Number(event.target.value) || null)}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Seleccionar sucursal</option>
                  {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </select>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pl-9 text-gray-700">
                  {selectedBranchName}
                </div>
              )}
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Fecha operativa</span>
            <input
              type="date"
              value={closeDate}
              onChange={(event) => setCloseDate(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </label>

          <div className="flex items-end text-sm text-gray-500">
            <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
              Puedes registrar ventas de mostrador al cierre sin alterar los descuentos de materia prima de producción.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">No se pudo cargar el cierre</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-gray-100 bg-white p-16 text-center shadow-sm">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-amber-600" />
            <p className="text-gray-500">Capturando inventario del sistema...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-16 text-center shadow-sm">
            <ClipboardCheck className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-700">No hay productos con inventario en esta sucursal</p>
            <p className="mt-1 text-sm text-gray-500">Registra producción o crea el inventario inicial antes de cerrar.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <SummaryCard label="Venta no registrada" value={totals.soldQty} tone="blue" icon={<TrendingDown className="h-4 w-4" />} />
              <SummaryCard label="Merma" value={totals.wasteQty} tone="orange" icon={<AlertTriangle className="h-4 w-4" />} />
              <SummaryCard label="Sobrante" value={totals.surplusQty} tone="green" icon={<TrendingUp className="h-4 w-4" />} />
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-3 py-3 text-center">Sistema</th>
                      <th className="px-3 py-3 text-center">Reservado</th>
                      <th className="px-3 py-3 text-center">Conteo físico</th>
                      <th className="px-3 py-3 text-center">Merma</th>
                      <th className="px-3 py-3 text-center">Venta calculada</th>
                      <th className="px-3 py-3 text-center">Sobrante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entries.map((entry) => {
                      const projection = projectionMap.get(entry.productId)!
                      const hasValidationIssue = !projection.valid
                      return (
                        <tr key={entry.productId} className={hasValidationIssue ? "bg-red-50/60" : "hover:bg-gray-50"}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{entry.productName}</p>
                            <p className="text-xs text-gray-400">{entry.sku}{!entry.isActive && " · Inactivo"}</p>
                          </td>
                          <td className="px-3 py-3 text-center font-semibold text-gray-700">{entry.systemQty}</td>
                          <td className="px-3 py-3 text-center text-amber-700">{entry.reservedQty}</td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={entry.countedInput}
                              onChange={(event) => updateEntry(entry.productId, "countedInput", event.target.value)}
                              className={`w-28 rounded-lg border px-3 py-2 text-center font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 ${hasValidationIssue ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                              aria-label={`Conteo físico de ${entry.productName}`}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={entry.wasteInput}
                              onChange={(event) => updateEntry(entry.productId, "wasteInput", event.target.value)}
                              className={`w-24 rounded-lg border px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-amber-500 ${hasValidationIssue ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                              aria-label={`Merma de ${entry.productName}`}
                            />
                          </td>
                          <td className="px-3 py-3 text-center font-semibold text-blue-700">{projection.soldQty}</td>
                          <td className="px-3 py-3 text-center font-semibold text-green-700">{projection.surplusQty}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Nota del cierre (opcional)</span>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={500}
                  placeholder="Ej. Ventas de mostrador y merma del turno de la tarde"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </label>
              <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>El cierre generará movimientos auditables y actualizará el stock a las cantidades físicas capturadas.</span>
                </div>
                <Button onClick={handleSubmit} disabled={isSubmitting || Boolean(invalidEntry)} className="min-w-[190px]">
                  {isSubmitting ? <><RefreshCw className="h-4 w-4 animate-spin" />Guardando...</> : <><Save className="h-4 w-4" />Registrar cierre</>}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
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
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    green: "bg-green-50 text-green-700",
    gray: "bg-gray-100 text-gray-700",
  }
  return (
    <div className={`rounded-xl p-3 text-center ${tones[tone]}`}>
      <div className="flex items-center justify-center gap-1 text-2xl font-bold">
        {icon}
        {value.toLocaleString("es-GT")}
      </div>
      <p className="mt-1 text-xs font-medium">{label}</p>
    </div>
  )
}
