"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellRing,
  Calendar,
  CalendarClock,
  Check,
  Clock,
  Package,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { branchesService, inventoryService, type ExpirationLot } from "@/lib/api"

type StatusFilter = "all" | "expired" | "expiring" | "no-date"

interface Branch {
  id: number
  name: string
  slug: string
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string" && message) return message
  }
  return fallback
}

function formatDatePretty(dateStr: string | null | undefined) {
  if (!dateStr) return "Sin fecha"
  try {
    const d = new Date(`${dateStr.slice(0, 10)}T12:00:00`)
    return d.toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function formatDateTimePretty(isoStr: string | null | undefined) {
  if (!isoStr) return "No registrado"
  try {
    const d = new Date(isoStr)
    return d.toLocaleString("es-GT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return isoStr
  }
}

export default function CaducidadesPage() {
  const { showToast } = useToast()
  const [branches, setBranches] = useState<Branch[]>([])
  const [lots, setLots] = useState<ExpirationLot[]>([])
  const [summary, setSummary] = useState({ expired: 0, expiring: 0, noDate: 0 })
  const [status, setStatus] = useState<StatusFilter>("all")
  const [branch, setBranch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

  // Estado del Modal de Ajuste de Alerta
  const [selectedLotForEdit, setSelectedLotForEdit] = useState<ExpirationLot | null>(null)
  const [editDaysBefore, setEditDaysBefore] = useState<number>(3)
  const [editCustomAlertAt, setEditCustomAlertAt] = useState<string>("")
  const [editCustomExpiresAt, setEditCustomExpiresAt] = useState<string>("")
  const [isCustomDateMode, setIsCustomDateMode] = useState<boolean>(false)
  const [isSavingAlert, setIsSavingAlert] = useState<boolean>(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [branchData, expirationData] = await Promise.all([
        branchesService.list(),
        inventoryService.listExpirations({ branch: branch || undefined, status, days: 30 }),
      ])
      setBranches(branchData)
      setLots(expirationData.data)
      setSummary(expirationData.summary)
    } catch (error: unknown) {
      showToast(getErrorMessage(error, "No fue posible cargar las caducidades"), "error")
    } finally {
      setIsLoading(false)
    }
  }, [branch, showToast, status])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const checkNow = async () => {
    setIsChecking(true)
    try {
      await inventoryService.checkExpirations()
      await loadData()
      showToast("Caducidades revisadas y alertas enviadas oportunamente", "success")
    } catch (error: unknown) {
      showToast(getErrorMessage(error, "No fue posible revisar las caducidades"), "error")
    } finally {
      setIsChecking(false)
    }
  }

  // Abrir modal de edición con datos precargados del lote
  const handleOpenEditModal = (lot: ExpirationLot) => {
    setSelectedLotForEdit(lot)
    setEditCustomExpiresAt(lot.expiresAt || "")

    if (lot.isCustomAlert) {
      setIsCustomDateMode(true)
      setEditCustomAlertAt(lot.alertAt || "")
      setEditDaysBefore(3)
    } else {
      setIsCustomDateMode(false)
      setEditDaysBefore(lot.defaultDaysBefore || lot.reminderDays?.[0] || 3)
      setEditCustomAlertAt("")
    }
  }

  // Guardar configuración de alerta
  const handleSaveAlertConfig = async () => {
    if (!selectedLotForEdit) return
    setIsSavingAlert(true)

    try {
      const payload: { alertAt?: string; daysBefore?: number; expiresAt?: string } = {}
      const targetExpiresAt = editCustomExpiresAt || selectedLotForEdit.expiresAt

      if (editCustomExpiresAt && editCustomExpiresAt !== selectedLotForEdit.expiresAt) {
        payload.expiresAt = editCustomExpiresAt
      }

      if (isCustomDateMode) {
        if (!editCustomAlertAt) {
          showToast("Debes seleccionar una fecha para la alerta", "error")
          setIsSavingAlert(false)
          return
        }
        payload.alertAt = editCustomAlertAt
      } else {
        payload.daysBefore = editDaysBefore
      }

      const alertDate = isCustomDateMode ? editCustomAlertAt : previewAlertDate
      if (!targetExpiresAt) {
        showToast("Debes registrar la fecha de caducidad antes de configurar la alerta", "error")
        setIsSavingAlert(false)
        return
      }
      if (alertDate && alertDate > targetExpiresAt) {
        showToast("La fecha de alerta no puede ser posterior a la fecha de caducidad", "error")
        setIsSavingAlert(false)
        return
      }

      const updated = await inventoryService.updateLotAlert(selectedLotForEdit.id, payload)

      // Actualizar estado local inmediatamente
      setLots((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)))
      showToast("Alerta de caducidad actualizada correctamente", "success")
      setSelectedLotForEdit(null)
    } catch (error: unknown) {
      showToast(getErrorMessage(error, "No fue posible actualizar la alerta"), "error")
    } finally {
      setIsSavingAlert(false)
    }
  }

  const handleRestoreProductAlerts = async () => {
    if (!selectedLotForEdit) return
    setIsSavingAlert(true)
    try {
      const updated = await inventoryService.updateLotAlert(selectedLotForEdit.id, { alertAt: null })
      setLots((prev) => prev.map((lot) => (lot.id === updated.id ? { ...lot, ...updated } : lot)))
      showToast("Se restauraron los recordatorios configurados para el producto", "success")
      setSelectedLotForEdit(null)
    } catch (error: unknown) {
      showToast(getErrorMessage(error, "No fue posible restaurar los recordatorios"), "error")
    } finally {
      setIsSavingAlert(false)
    }
  }

  // Filtrado de lotes en base a búsqueda y filtros
  const filteredLots = useMemo(() => {
    if (!searchQuery.trim()) return lots
    const q = searchQuery.toLowerCase()
    return lots.filter(
      (lot) =>
        lot.product.name.toLowerCase().includes(q) ||
        lot.branch.name.toLowerCase().includes(q) ||
        `lote-${lot.id}`.includes(q)
    )
  }, [lots, searchQuery])

  // Cálculo en vivo de la fecha resultante de alerta en el modal
  const targetExpiresAt = editCustomExpiresAt || selectedLotForEdit?.expiresAt || ""
  let previewAlertDate: string | null = null
  if (targetExpiresAt) {
    if (isCustomDateMode) {
      previewAlertDate = editCustomAlertAt || null
    } else {
      try {
        const exp = new Date(`${targetExpiresAt}T12:00:00`)
        exp.setDate(exp.getDate() - editDaysBefore)
        previewAlertDate = exp.toISOString().slice(0, 10)
      } catch {
        previewAlertDate = null
      }
    }
  }

  const quickReminderDays = useMemo(() => {
    const configured = selectedLotForEdit?.reminderDays ?? []
    return [...new Set([...configured, 1, 2, 3, 5, 7, 14, 15, 30])].sort((a, b) => a - b)
  }, [selectedLotForEdit])

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-cream min-h-screen space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/inventario"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inventario
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <CalendarClock className="h-7 w-7 text-primary" /> Caducidades y Alertas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Control de productos comprados con fecha de vencimiento y recordatorios configurables.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void loadData()} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Actualizar
          </Button>
          <Button onClick={() => void checkNow()} disabled={isChecking} className="gap-2">
            <BellRing className={`h-4 w-4 ${isChecking ? "animate-bounce" : ""}`} /> Revisar alertas
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-destructive/20 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vencidos con existencia</p>
          <p className="text-3xl font-bold text-destructive mt-1.5">{summary.expired}</p>
          <p className="text-xs text-destructive/80 mt-1">Requieren retiro o registro de merma</p>
        </div>
        <div className="bg-card rounded-xl border border-warning/30 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Próximos a vencer</p>
          <p className="text-3xl font-bold text-warning mt-1.5">{summary.expiring}</p>
          <p className="text-xs text-warning/80 mt-1">Con alerta activa o programada</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sin fecha registrada</p>
          <p className="text-3xl font-bold text-foreground mt-1.5">{summary.noDate}</p>
          <p className="text-xs text-muted-foreground mt-1">Lotes pendientes de registrar fecha</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Búsqueda por texto */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por producto o lote..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Selector de Sucursal */}
          <select
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">Todas las sucursales</option>
            {branches.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          {/* Selector de Estado */}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="expiring">Próximos a vencer</option>
            <option value="expired">Vencidos</option>
            <option value="no-date">Sin fecha</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground text-right sm:text-left shrink-0">
          {filteredLots.length} {filteredLots.length === 1 ? "lote encontrado" : "lotes encontrados"}
        </div>
      </div>

      {/* Contenedor Principal: Tabla Desktop + Tarjetas Móviles */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            Cargando lotes y estado de alertas...
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="p-12 text-center">
            <Check className="h-10 w-10 text-success mx-auto mb-3" />
            <p className="font-semibold text-foreground text-base">No hay lotes que coincidan con los filtros</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Los productos producidos no requieren fecha de caducidad. Los productos comprados aparecerán aquí cuando tengan existencias activas.
            </p>
          </div>
        ) : (
          <>
            {/* VISTA TABLA (Pantallas Medianas y Grandes: sm+) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left border-b border-border">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold text-foreground">Producto / Lote</th>
                    <th className="px-4 py-3.5 font-semibold text-foreground">Sucursal</th>
                    <th className="px-4 py-3.5 font-semibold text-foreground text-right">Existencia</th>
                    <th className="px-4 py-3.5 font-semibold text-foreground">Fecha Caducidad</th>
                    <th className="px-4 py-3.5 font-semibold text-foreground">Estado de Alerta</th>
                    <th className="px-4 py-3.5 font-semibold text-foreground text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLots.map((lot) => {
                    const isExpired = lot.status === "EXPIRED"
                    const hasNotified = Boolean(lot.lastNotifiedAt)
                    const hasCustomAlert = Boolean(lot.isCustomAlert)

                    return (
                      <tr key={lot.id} className="hover:bg-muted/30 transition-colors">
                        {/* Producto / Lote */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary shrink-0" />
                            <div>
                              <p className="font-semibold text-foreground">{lot.product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Lote #{lot.id} · {lot.sourceType === "COMPRA" ? "Comprado" : lot.sourceType}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Sucursal */}
                        <td className="px-4 py-3.5 text-muted-foreground font-medium">
                          {lot.branch.name}
                        </td>

                        {/* Existencia */}
                        <td className="px-4 py-3.5 text-right font-bold text-foreground">
                          {lot.availableQuantity} <span className="text-xs font-normal text-muted-foreground">uds</span>
                        </td>

                        {/* Fecha Caducidad */}
                        <td className="px-4 py-3.5">
                          {lot.expiresAt ? (
                            <div>
                              <span className="font-medium text-foreground">{formatDatePretty(lot.expiresAt)}</span>
                              {lot.daysLeft !== null && (
                                <span
                                  className={`block text-xs font-semibold mt-0.5 ${
                                    lot.daysLeft < 0
                                      ? "text-destructive"
                                      : lot.daysLeft <= 3
                                      ? "text-warning"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {lot.daysLeft < 0
                                    ? `Vencido hace ${Math.abs(lot.daysLeft)} día(s)`
                                    : lot.daysLeft === 0
                                    ? "¡Vence hoy!"
                                    : `en ${lot.daysLeft} día(s)`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Sin fecha registrada</span>
                          )}
                        </td>

                        {/* Estado de Alerta */}
                        <td className="px-4 py-3.5">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-destructive/10 text-destructive">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Vencido
                            </span>
                          ) : hasNotified ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <BellRing className="h-3.5 w-3.5 text-emerald-600" />
                                Alerta Notificada
                              </span>
                              <p className="text-[11px] text-muted-foreground">
                                Última: {formatDateTimePretty(lot.lastNotifiedAt)}
                              </p>
                            </div>
                          ) : lot.effectiveAlertDate ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                <Clock className="h-3.5 w-3.5 text-amber-600" />
                                Próxima alerta: {formatDatePretty(lot.effectiveAlertDate)}
                              </span>
                              <p className="text-[11px] text-muted-foreground">
                                {hasCustomAlert
                                  ? "Fecha personalizada"
                                  : `${lot.defaultDaysBefore ?? 3} días antes de vencer`}
                                {lot.daysUntilAlert !== null && lot.daysUntilAlert !== undefined && (
                                  <span> ({lot.daysUntilAlert > 0 ? `en ${lot.daysUntilAlert}d` : "hoy"})</span>
                                )}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs text-muted-foreground bg-muted">
                              Sin alerta
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(lot)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
                              title="Configurar cuándo recibir la alerta"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                              Ajustar alerta
                            </button>

                            {isExpired && (
                              <Link
                                href={`/admin/inventario/movimiento?producto=${lot.product.slug}&sucursal=${lot.branch.slug}&tipo=MERMA`}
                                className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 border border-destructive/20 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Merma
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* VISTA TARJETAS MÓVILES (Pantallas Pequeñas: < sm) */}
            <div className="sm:hidden divide-y divide-border">
              {filteredLots.map((lot) => {
                const isExpired = lot.status === "EXPIRED"
                const hasNotified = Boolean(lot.lastNotifiedAt)
                return (
                  <div key={lot.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{lot.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Lote #{lot.id} · {lot.branch.name}
                        </p>
                      </div>
                      <span className="font-bold text-sm bg-muted px-2.5 py-1 rounded-md text-foreground">
                        {lot.availableQuantity} uds
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-lg border border-border/60">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Caducidad</span>
                        <span className="font-medium text-foreground">{formatDatePretty(lot.expiresAt)}</span>
                        {lot.daysLeft !== null && (
                          <span
                            className={`block text-[11px] font-semibold ${
                              lot.daysLeft < 0 ? "text-destructive" : lot.daysLeft <= 3 ? "text-warning" : "text-muted-foreground"
                            }`}
                          >
                            {lot.daysLeft < 0 ? `Vencido (${Math.abs(lot.daysLeft)}d)` : `en ${lot.daysLeft} días`}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Alerta</span>
                        {isExpired ? (
                          <span className="text-destructive font-semibold">Vencido</span>
                        ) : hasNotified ? (
                          <span className="text-emerald-700 font-semibold">Notificada</span>
                        ) : lot.effectiveAlertDate ? (
                          <span className="text-amber-800 font-semibold">
                            {formatDatePretty(lot.effectiveAlertDate)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Sin alerta</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(lot)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                        Ajustar alerta
                      </button>

                      {isExpired && (
                        <Link
                          href={`/admin/inventario/movimiento?producto=${lot.product.slug}&sucursal=${lot.branch.slug}&tipo=MERMA`}
                          className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Registrar merma
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* MODAL PARA AJUSTAR ALERTA DE CADUCIDAD */}
      {selectedLotForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5 animate-in zoom-in-95">
            {/* Header del Modal */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" /> Ajustar Alerta de Caducidad
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lote #{selectedLotForEdit.id} · {selectedLotForEdit.product.name} ({selectedLotForEdit.branch.name})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLotForEdit(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Información del Lote */}
            <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl border border-border/80 text-xs">
              <div>
                <span className="text-muted-foreground block font-medium">Existencia Actual</span>
                <span className="font-bold text-foreground text-sm">{selectedLotForEdit.availableQuantity} unidades</span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">Fecha de Caducidad</span>
                <span className="font-bold text-foreground text-sm">
                  {formatDatePretty(editCustomExpiresAt || selectedLotForEdit.expiresAt)}
                </span>
              </div>
            </div>

            {/* Opciones de Modo: Días de anticipación vs Fecha exacta */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Programación de la Alerta
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomDateMode(!isCustomDateMode)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {isCustomDateMode ? "Usar días de anticipación" : "Elegir fecha exacta en calendario"}
                </button>
              </div>

              {!isCustomDateMode ? (
                /* Modo 1: Botones Rápidos de Días de Anticipación */
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    ¿Con cuántos días de anticipación antes del vencimiento deseas recibir la alerta?
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {quickReminderDays.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setEditDaysBefore(d)}
                        className={`py-2 px-2 rounded-lg text-xs font-semibold border transition ${
                          editDaysBefore === d
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {d} {d === 1 ? "día" : "días"}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Modo 2: Fecha Específica */
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground block">
                    Fecha exacta en que se enviará la notificación:
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="date"
                      value={editCustomAlertAt}
                      onChange={(e) => setEditCustomAlertAt(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* Vista Previa de la Fecha Resultante */}
              {previewAlertDate && (
                <div className="rounded-lg bg-amber-50/80 border border-amber-200 p-3 text-xs flex items-center gap-2.5 text-amber-950">
                  <Bell className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    La alerta se notificará el: <strong>{formatDatePretty(previewAlertDate)}</strong>
                  </span>
                </div>
              )}

              {/* Corrección de Caducidad (Opcional) */}
              <div className="pt-2 border-t border-border space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                  Corregir fecha de caducidad del lote (opcional):
                </label>
                <input
                  type="date"
                  value={editCustomExpiresAt}
                  onChange={(e) => setEditCustomExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Footer con Botones */}
            <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
              {selectedLotForEdit.isCustomAlert ? (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => void handleRestoreProductAlerts()}
                  disabled={isSavingAlert}
                  className="text-xs"
                >
                  Restaurar recordatorios
                </Button>
              ) : <span />}
              <div className="flex items-center gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setSelectedLotForEdit(null)}
                disabled={isSavingAlert}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void handleSaveAlertConfig()}
                disabled={isSavingAlert}
                className="gap-2 font-semibold"
              >
                {isSavingAlert && <RefreshCw className="h-4 w-4 animate-spin" />}
                Guardar alerta
              </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
