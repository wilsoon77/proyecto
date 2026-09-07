"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Bell,
  BellRing,
  Calendar,
  CalendarClock,
  Check,
  Clock,
  Package,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { branchesService, inventoryService, type ExpirationLot } from "@/lib/api"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminSearchBar, type FilterChip } from "@/components/admin/AdminSearchBar"
import { AdminEntityCard } from "@/components/admin/AdminEntityCard"

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
  const [editReminderDays, setEditReminderDays] = useState<number[]>([3])
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
      setEditReminderDays(lot.reminderDays && lot.reminderDays.length > 0 ? lot.reminderDays : [3])
    } else {
      setIsCustomDateMode(false)
      const initialDays = lot.reminderDays && lot.reminderDays.length > 0
        ? lot.reminderDays
        : (lot.defaultDaysBefore ? [lot.defaultDaysBefore] : [3])
      setEditReminderDays(initialDays)
      setEditCustomAlertAt("")
    }
  }

  // Alternar selección de días de anticipación (selección múltiple)
  const toggleReminderDay = (day: number) => {
    setEditReminderDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) {
          showToast("Debes mantener al menos un día de anticipación seleccionado", "info")
          return prev
        }
        return prev.filter((d) => d !== day)
      } else {
        return [...prev, day].sort((a, b) => b - a)
      }
    })
  }

  // Guardar configuración de alerta
  const handleSaveAlertConfig = async () => {
    if (!selectedLotForEdit) return
    setIsSavingAlert(true)

    try {
      const payload: { alertAt?: string; reminderDays?: number[]; expiresAt?: string } = {}
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
        if (targetExpiresAt && editCustomAlertAt > targetExpiresAt) {
          showToast("La fecha de alerta no puede ser posterior a la fecha de caducidad", "error")
          setIsSavingAlert(false)
          return
        }
        payload.alertAt = editCustomAlertAt
      } else {
        if (editReminderDays.length === 0) {
          showToast("Debes seleccionar al menos un día de anticipación", "error")
          setIsSavingAlert(false)
          return
        }
        payload.reminderDays = [...editReminderDays].sort((a, b) => b - a)
      }

      if (!targetExpiresAt) {
        showToast("Debes registrar la fecha de caducidad antes de configurar la alerta", "error")
        setIsSavingAlert(false)
        return
      }

      const updated = await inventoryService.updateLotAlert(selectedLotForEdit.id, payload)

      // Actualizar estado local inmediatamente
      setLots((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)))
      showToast("Alertas de caducidad actualizadas correctamente", "success")
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

  // Cálculo de todas las fechas resultantes de alerta para vista previa
  const previewAlertDates = useMemo(() => {
    const targetExp = editCustomExpiresAt || selectedLotForEdit?.expiresAt || ""
    if (!targetExp) return []
    if (isCustomDateMode) {
      return editCustomAlertAt ? [{ date: editCustomAlertAt, label: "Fecha personalizada", days: 0 }] : []
    }
    try {
      return editReminderDays.map((days) => {
        const exp = new Date(`${targetExp}T12:00:00`)
        exp.setDate(exp.getDate() - days)
        return {
          date: exp.toISOString().slice(0, 10),
          days,
          label: `${days} ${days === 1 ? "día" : "días"} antes`,
        }
      }).sort((a, b) => a.date.localeCompare(b.date))
    } catch {
      return []
    }
  }, [editCustomAlertAt, editCustomExpiresAt, editReminderDays, isCustomDateMode, selectedLotForEdit?.expiresAt])

  const quickReminderDays = useMemo(() => {
    const configured = selectedLotForEdit?.reminderDays ?? []
    return [...new Set([...configured, 1, 2, 3, 5, 7, 10, 14, 15, 30, 45, 60])].sort((a, b) => a - b)
  }, [selectedLotForEdit])

  // Chips para AdminSearchBar
  const filterChips: FilterChip[] = useMemo(() => {
    return [
      {
        id: "all",
        label: "Todos",
        count: lots.length,
        active: status === "all",
        onClick: () => setStatus("all"),
      },
      {
        id: "expired",
        label: "Vencidos",
        count: summary.expired,
        active: status === "expired",
        onClick: () => setStatus("expired"),
      },
      {
        id: "expiring",
        label: "Próximos a Vencer",
        count: summary.expiring,
        active: status === "expiring",
        onClick: () => setStatus("expiring"),
      },
      {
        id: "no-date",
        label: "Sin Fecha",
        count: summary.noDate,
        active: status === "no-date",
        onClick: () => setStatus("no-date"),
      },
    ]
  }, [lots.length, summary, status])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Header Estandarizado ── */}
      <AdminPageHeader
        title="Caducidades y Alertas"
        description="Control de productos comprados con fecha de vencimiento y recordatorios configurables"
        icon={<CalendarClock className="h-6 w-6 text-[#D97706]" />}
        breadcrumbs={[
          { label: "Inventario", href: "/admin/inventario" },
          { label: "Caducidades" },
        ]}
        primaryAction={{
          label: isChecking ? "Revisando..." : "Revisar Alertas",
          onClick: () => void checkNow(),
          icon: <BellRing className={`h-4 w-4 mr-1.5 ${isChecking ? "animate-bounce" : ""}`} />,
        }}
        secondaryAction={{
          label: "Actualizar",
          onClick: () => void loadData(),
          icon: <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />,
        }}
      />

      {/* ── Tarjetas KPI de Resumen Estandarizadas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-red-700">Vencidos con existencia</p>
          <p className="text-3xl font-bold text-red-600 mt-1.5 font-mono">{summary.expired}</p>
          <p className="text-xs text-red-600/80 mt-1 font-medium">Requieren retiro físico o registrar merma</p>
        </div>
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Próximos a vencer (30 días)</p>
          <p className="text-3xl font-bold text-[#D97706] mt-1.5 font-mono">{summary.expiring}</p>
          <p className="text-xs text-amber-700/80 mt-1 font-medium">Con alerta programada o activa</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E8DCCB] p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8C522B]">Sin fecha registrada</p>
          <p className="text-3xl font-bold text-[#2B170F] mt-1.5 font-mono">{summary.noDate}</p>
          <p className="text-xs text-[#6E5545] mt-1 font-medium">Lotes pendientes de registrar caducidad</p>
        </div>
      </div>

      {/* ── Buscador y Filtros Estandarizados ── */}
      <AdminSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Buscar por producto, sucursal o # lote..."
        chips={filterChips}
        totalCount={lots.length}
        filteredCount={filteredLots.length}
        entityName="lotes"
        isLoading={isLoading}
      >
        {/* Selector de Sucursal */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#8C522B] uppercase tracking-wider hidden sm:inline">
            Sucursal:
          </span>
          <select
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            className="h-10 px-3 text-xs sm:text-sm bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] font-medium focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
          >
            <option value="">Todas las sucursales</option>
            {branches.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </AdminSearchBar>

      {/* ── Contenedor Principal: Tabla Desktop + Tarjetas Móviles ── */}
      {isLoading ? (
        <div className="py-20 text-center text-[#8C522B]">
          <RefreshCw className="h-8 w-8 animate-spin text-[#D97706] mx-auto mb-3" />
          <p className="text-sm font-semibold">Cargando lotes y estado de alertas...</p>
        </div>
      ) : filteredLots.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto mb-4 border border-emerald-200">
            <Check className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#2B170F] mb-1">
            No hay lotes con estos filtros
          </h3>
          <p className="text-xs text-[#6E5545] max-w-md mx-auto">
            Los productos producidos diariamente no generan lote de vencimiento. Los productos comprados aparecerán aquí cuando tengan inventario activo.
          </p>
        </div>
      ) : (
        <>
          {/* ── Vista Móvil: Tarjetas Estandarizadas ── */}
          <div className="md:hidden space-y-4">
            {filteredLots.map((lot) => {
              const isExpired = lot.status === "EXPIRED"
              const hasNotified = Boolean(lot.lastNotifiedAt)

              return (
                <AdminEntityCard
                  key={`m-lot-${lot.id}`}
                  dimmed={isExpired}
                  image={
                    <div className="h-11 w-11 bg-[#FAF0E6] text-[#D97706] rounded-xl flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5" />
                    </div>
                  }
                  title={lot.product.name}
                  subtitle={`Lote #${lot.id} · ${lot.branch.name}`}
                  badges={
                    isExpired ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        <AlertTriangle className="h-3 w-3" /> Vencido
                      </span>
                    ) : hasNotified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <BellRing className="h-3 w-3 text-emerald-600" /> Notificada
                      </span>
                    ) : lot.effectiveAlertDate ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="h-3 w-3 text-amber-600" /> Aviso: {formatDatePretty(lot.effectiveAlertDate)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground">
                        Sin Alerta
                      </span>
                    )
                  }
                  meta={[
                    {
                      label: "Existencia",
                      value: `${lot.availableQuantity} uds`,
                      alert: isExpired,
                      highlight: !isExpired,
                    },
                    {
                      label: "Fecha Caducidad",
                      value: (
                        <div>
                          <span>{formatDatePretty(lot.expiresAt)}</span>
                          {lot.daysLeft !== null && (
                            <span className={`block text-[10px] font-bold mt-0.5 ${
                              lot.daysLeft < 0 ? "text-red-600" : lot.daysLeft <= 3 ? "text-amber-600" : "text-[#8C522B]"
                            }`}>
                              {lot.daysLeft < 0 ? `Venció hace ${Math.abs(lot.daysLeft)}d` : lot.daysLeft === 0 ? "¡Vence hoy!" : `en ${lot.daysLeft} días`}
                            </span>
                          )}
                        </div>
                      ),
                      alert: isExpired || (lot.daysLeft !== null && lot.daysLeft <= 3),
                    },
                  ]}
                  actions={
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditModal(lot)}
                        className="flex-1 h-10 px-3 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] font-bold text-xs"
                      >
                        <SlidersHorizontal className="h-4 w-4 mr-1 text-[#8C522B]" />
                        Ajustar Alerta
                      </Button>
                      {isExpired && (
                        <Link
                          href={`/admin/inventario/movimiento?producto=${lot.product.slug}&sucursal=${lot.branch.slug}&tipo=MERMA&cantidad=${lot.availableQuantity}&lote=${lot.id}&caducidad=${lot.expiresAt || ""}&referencia=${encodeURIComponent(`LOTE-${lot.id}`)}&nota=${encodeURIComponent(`Merma por lote vencido #${lot.id} (${lot.product.name})`)}`}
                          className="flex-1"
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-10 px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-bold text-xs"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Registrar Merma
                          </Button>
                        </Link>
                      )}
                    </>
                  }
                />
              )
            })}
          </div>

          {/* ── Vista Desktop: Tabla Limpia ── */}
          <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-[#E8DCCB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#FAF5EE] border-b border-[#E8DCCB]">
                  <tr>
                    <th className="py-3.5 px-5 text-xs font-bold text-[#8C522B] uppercase tracking-wider">Producto / Lote</th>
                    <th className="py-3.5 px-5 text-xs font-bold text-[#8C522B] uppercase tracking-wider">Sucursal</th>
                    <th className="py-3.5 px-5 text-center text-xs font-bold text-[#8C522B] uppercase tracking-wider">Existencia</th>
                    <th className="py-3.5 px-5 text-left text-xs font-bold text-[#8C522B] uppercase tracking-wider">Fecha Caducidad</th>
                    <th className="py-3.5 px-5 text-left text-xs font-bold text-[#8C522B] uppercase tracking-wider">Estado de Alerta</th>
                    <th className="py-3.5 px-5 text-right text-xs font-bold text-[#8C522B] uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DCCB]/60">
                  {filteredLots.map((lot) => {
                    const isExpired = lot.status === "EXPIRED"
                    const hasNotified = Boolean(lot.lastNotifiedAt)
                    const hasCustomAlert = Boolean(lot.isCustomAlert)

                    return (
                      <tr
                        key={lot.id}
                        className={`hover:bg-[#FAF5EE]/50 transition-colors ${
                          isExpired ? "bg-red-50/30" : ""
                        }`}
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-[#FAF0E6] text-[#D97706] rounded-xl flex items-center justify-center shrink-0">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#2B170F]">{lot.product.name}</p>
                              <p className="text-xs text-[#8C522B] font-mono">
                                Lote #{lot.id} · {lot.sourceType === "COMPRA" ? "Comprado" : lot.sourceType}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-sm font-medium text-[#2B170F]">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#FAF0E6] text-[#D97706] border border-[#E8DCCB]">
                            {lot.branch.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono font-bold text-sm text-[#2B170F]">
                          {lot.availableQuantity} <span className="text-xs font-normal text-[#8C522B]">uds</span>
                        </td>
                        <td className="py-3.5 px-5 text-xs">
                          {lot.expiresAt ? (
                            <div>
                              <span className="font-bold text-[#2B170F]">{formatDatePretty(lot.expiresAt)}</span>
                              {lot.daysLeft !== null && (
                                <span className={`block text-[11px] font-bold mt-0.5 ${
                                  lot.daysLeft < 0 ? "text-red-600" : lot.daysLeft <= 3 ? "text-amber-700" : "text-[#8C522B]"
                                }`}>
                                  {lot.daysLeft < 0 ? `Vencido hace ${Math.abs(lot.daysLeft)}d` : lot.daysLeft === 0 ? "¡Vence hoy!" : `en ${lot.daysLeft} días`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#8C522B] italic">Sin fecha</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-xs">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                              <AlertTriangle className="h-3.5 w-3.5" /> Vencido
                            </span>
                          ) : hasNotified ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <BellRing className="h-3.5 w-3.5 text-emerald-600" /> Notificada
                              </span>
                              <p className="text-[10px] text-[#8C522B] mt-0.5 font-mono">
                                {formatDateTimePretty(lot.lastNotifiedAt)}
                              </p>
                            </div>
                          ) : lot.effectiveAlertDate ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                <Clock className="h-3.5 w-3.5 text-[#D97706]" />
                                Aviso: {formatDatePretty(lot.effectiveAlertDate)}
                              </span>
                              <p className="text-[10px] text-[#8C522B] mt-0.5">
                                {hasCustomAlert ? "Personalizado" : `${lot.defaultDaysBefore ?? 3}d antes`}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-muted-foreground bg-muted">
                              Sin alerta
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditModal(lot)}
                              className="h-9 px-2.5 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] font-bold text-xs"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5 mr-1 text-[#8C522B]" />
                              Ajustar Alerta
                            </Button>

                            {isExpired && (
                              <Link
                                href={`/admin/inventario/movimiento?producto=${lot.product.slug}&sucursal=${lot.branch.slug}&tipo=MERMA&cantidad=${lot.availableQuantity}&lote=${lot.id}&caducidad=${lot.expiresAt || ""}&referencia=${encodeURIComponent(`LOTE-${lot.id}`)}&nota=${encodeURIComponent(`Merma por lote vencido #${lot.id} (${lot.product.name})`)}`}
                              >
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-9 px-2.5 border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Merma
                                </Button>
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
          </div>
        </>
      )}

      {/* ── MODAL PARA AJUSTAR ALERTA DE CADUCIDAD ── */}
      {selectedLotForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-[#E8DCCB] bg-white p-6 shadow-xl space-y-5">
            {/* Header del Modal */}
            <div className="flex items-start justify-between gap-4 border-b border-[#E8DCCB] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#2B170F] flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-[#D97706]" /> Ajustar Alertas de Caducidad
                </h3>
                <p className="text-xs text-[#8C522B] mt-0.5">
                  Lote #{selectedLotForEdit.id} · {selectedLotForEdit.product.name} ({selectedLotForEdit.branch.name})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLotForEdit(null)}
                className="rounded-lg p-1.5 text-[#8C522B] hover:bg-[#FAF5EE] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Información del Lote */}
            <div className="grid grid-cols-2 gap-3 bg-[#FAF5EE] p-3.5 rounded-xl border border-[#DECDBB]/60 text-xs">
              <div>
                <span className="text-[#8C522B] block font-bold uppercase text-[10px] tracking-wider">Existencia</span>
                <span className="font-bold text-[#2B170F] text-sm">{selectedLotForEdit.availableQuantity} unidades</span>
              </div>
              <div>
                <span className="text-[#8C522B] block font-bold uppercase text-[10px] tracking-wider">Fecha de Caducidad</span>
                <span className="font-bold text-[#2B170F] text-sm">
                  {formatDatePretty(editCustomExpiresAt || selectedLotForEdit.expiresAt)}
                </span>
              </div>
            </div>

            {/* Opciones de Modo: Días de anticipación vs Fecha exacta */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8C522B]">
                  Programación de Avisos
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomDateMode(!isCustomDateMode)}
                  className="text-xs font-semibold text-[#D97706] hover:underline"
                >
                  {isCustomDateMode ? "Usar días de anticipación" : "Elegir fecha exacta"}
                </button>
              </div>

              {!isCustomDateMode ? (
                <div className="space-y-3">
                  <p className="text-xs text-[#6E5545]">
                    Selecciona <strong>días de anticipación</strong> para recibir recordatorios:
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {quickReminderDays.map((d) => {
                      const isSelected = editReminderDays.includes(d)
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleReminderDay(d)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                            isSelected
                              ? "bg-[#D97706] text-white border-[#D97706] shadow-xs"
                              : "bg-white border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE]"
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                          {d} {d === 1 ? "día" : "días"}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#2B170F] block">
                    Fecha exacta para enviar notificación:
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C522B]" />
                    <input
                      type="date"
                      value={editCustomAlertAt}
                      onChange={(e) => setEditCustomAlertAt(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] focus:outline-none focus:ring-2 focus:ring-[#D97706]/30"
                    />
                  </div>
                </div>
              )}

              {/* Vista Previa */}
              {previewAlertDates.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 space-y-2 text-xs text-amber-950">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Bell className="h-4 w-4 text-[#D97706] shrink-0" />
                    <span>
                      {previewAlertDates.length === 1
                        ? "1 notificación programada:"
                        : `${previewAlertDates.length} notificaciones programadas:`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                    {previewAlertDates.map((item, idx) => (
                      <div
                        key={item.date + idx}
                        className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-amber-200/60 font-medium"
                      >
                        <span className="text-amber-800 text-[11px]">
                          {isCustomDateMode ? "Alerta:" : `Aviso (${item.label}):`}
                        </span>
                        <strong className="text-amber-950 font-bold">{formatDatePretty(item.date)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Corrección de Caducidad (Opcional) */}
              <div className="pt-2 border-t border-[#E8DCCB] space-y-1.5">
                <label className="text-xs font-medium text-[#6E5545] flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-[#8C522B]" />
                  Corregir fecha de caducidad del lote (opcional):
                </label>
                <input
                  type="date"
                  value={editCustomExpiresAt}
                  onChange={(e) => setEditCustomExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#DECDBB] rounded-xl text-[#2B170F] focus:outline-none focus:ring-2 focus:ring-[#D97706]/30"
                />
              </div>
            </div>

            {/* Footer con Botones */}
            <div className="flex items-center justify-between gap-2 border-t border-[#E8DCCB] pt-4">
              {selectedLotForEdit.isCustomAlert ? (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => void handleRestoreProductAlerts()}
                  disabled={isSavingAlert}
                  className="text-xs h-10 px-3 border-[#DECDBB]"
                >
                  Restaurar
                </Button>
              ) : <span />}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setSelectedLotForEdit(null)}
                  disabled={isSavingAlert}
                  className="h-10 px-4 border-[#DECDBB]"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSaveAlertConfig()}
                  disabled={isSavingAlert}
                  className="h-10 px-5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs"
                >
                  {isSavingAlert && <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />}
                  Guardar Alertas
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
