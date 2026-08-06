"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, BellRing, CalendarClock, Check, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { branchesService, inventoryService, type ExpirationLot } from "@/lib/api"

type StatusFilter = "all" | "expired" | "expiring" | "no-date"

interface Branch {
  id: number
  name: string
  slug: string
}

function statusText(status: ExpirationLot["status"]) {
  if (status === "EXPIRED") return "Vencido"
  if (status === "NO_DATE") return "Sin fecha"
  return "Próximo a vencer"
}

export default function CaducidadesPage() {
  const { showToast } = useToast()
  const [branches, setBranches] = useState<Branch[]>([])
  const [lots, setLots] = useState<ExpirationLot[]>([])
  const [summary, setSummary] = useState({ expired: 0, expiring: 0, noDate: 0 })
  const [status, setStatus] = useState<StatusFilter>("all")
  const [branch, setBranch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [branchData, expirationData] = await Promise.all([
        branchesService.list(),
        inventoryService.listExpirations({ branch: branch || undefined, status, days: 7 }),
      ])
      setBranches(branchData)
      setLots(expirationData.data)
      setSummary(expirationData.summary)
    } catch (error: any) {
      showToast(error?.message || "No fue posible cargar las caducidades", "error")
    } finally {
      setIsLoading(false)
    }
  }, [branch, showToast, status])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const checkNow = async () => {
    setIsChecking(true)
    try {
      await inventoryService.checkExpirations()
      await loadData()
      showToast("Caducidades revisadas y alertas actualizadas", "success")
    } catch (error: any) {
      showToast(error?.message || "No fue posible revisar las caducidades", "error")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-cream min-h-screen">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <Link href="/admin/inventario" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver al inventario
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <CalendarClock className="h-7 w-7 text-primary" /> Caducidades
          </h1>
          <p className="text-muted-foreground mt-1">Control de productos comprados con fecha de vencimiento.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadData()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> Actualizar
          </Button>
          <Button onClick={() => void checkNow()} disabled={isChecking}>
            <BellRing className="h-4 w-4 mr-2" /> Revisar alertas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-destructive/20 p-5">
          <p className="text-sm text-muted-foreground">Vencidos con existencia</p>
          <p className="text-3xl font-bold text-destructive mt-1">{summary.expired}</p>
        </div>
        <div className="bg-card rounded-xl border border-warning/30 p-5">
          <p className="text-sm text-muted-foreground">Próximos a vencer</p>
          <p className="text-3xl font-bold text-warning mt-1">{summary.expiring}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">Sin fecha registrada</p>
          <p className="text-3xl font-bold text-foreground mt-1">{summary.noDate}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <select value={branch} onChange={(event) => setBranch(event.target.value)} className="px-3 py-2 border border-border rounded-lg bg-card text-sm">
          <option value="">Todas las sucursales</option>
          {branches.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="px-3 py-2 border border-border rounded-lg bg-card text-sm">
          <option value="all">Todos</option>
          <option value="expired">Vencidos</option>
          <option value="expiring">Próximos a vencer</option>
          <option value="no-date">Sin fecha</option>
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Cargando caducidades...</div>
        ) : lots.length === 0 ? (
          <div className="p-10 text-center">
            <Check className="h-10 w-10 text-success mx-auto mb-3" />
            <p className="font-medium text-foreground">No hay lotes para este filtro</p>
            <p className="text-sm text-muted-foreground mt-1">Los productos producidos no aparecen aquí porque no requieren fecha de caducidad.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Sucursal</th>
                  <th className="px-4 py-3 font-semibold">Cantidad</th>
                  <th className="px-4 py-3 font-semibold">Caducidad</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{lot.product.name}</p>
                      <p className="text-xs text-muted-foreground">{lot.sourceType === "COMPRA" ? "Comprado" : lot.sourceType}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{lot.branch.name}</td>
                    <td className="px-4 py-3 font-semibold">{lot.availableQuantity}</td>
                    <td className="px-4 py-3">
                      {lot.expiresAt || "Sin fecha"}
                      {lot.daysLeft !== null && <span className="block text-xs text-muted-foreground">{lot.daysLeft < 0 ? `${Math.abs(lot.daysLeft)} día(s) vencido` : `en ${lot.daysLeft} día(s)`}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${lot.status === "EXPIRED" ? "bg-destructive/10 text-destructive" : lot.status === "NO_DATE" ? "bg-muted text-muted-foreground" : "bg-warning/10 text-warning"}`}>
                        {lot.status === "EXPIRED" && <AlertTriangle className="h-3 w-3" />}
                        {statusText(lot.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {lot.status === "EXPIRED" && (
                        <Link href={`/admin/inventario/movimiento?producto=${lot.product.slug}&sucursal=${lot.branch.slug}&tipo=MERMA`} className="inline-flex items-center gap-1 text-destructive hover:underline text-xs font-semibold">
                          <Trash2 className="h-3.5 w-3.5" /> Registrar merma
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
