"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, ClipboardCheck, Eye, Loader2, RefreshCw, Store } from "lucide-react"
import { branchesService, dailyCloseService, type ApiBranch, type DailyCloseRecord } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"

function displayDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value)
  return date.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })
}

export default function DailyCloseHistoryPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [branches, setBranches] = useState<ApiBranch[]>([])
  const [branchId, setBranchId] = useState<number | undefined>(undefined)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)
  const [records, setRecords] = useState<DailyCloseRecord[]>([])
  const [total, setTotal] = useState(0)
  const [pageCount, setPageCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const effectiveBranchId = user?.role === "ADMIN"
    ? branchId
    : user?.branch?.id ?? user?.branchId ?? undefined

  useEffect(() => {
    if (!user) return
    if (user.role === "ADMIN") {
      void branchesService.list().then(setBranches).catch((error) => {
        console.error("Error cargando sucursales", error)
        showToast("No fue posible cargar las sucursales", "error")
      })
    }
  }, [user, showToast])

  useEffect(() => {
    if (!user || (user.role !== "ADMIN" && !effectiveBranchId)) return
    let cancelled = false
    void dailyCloseService.list({ branchId: effectiveBranchId, from: from || undefined, to: to || undefined, page, pageSize: 20 })
      .then((response) => {
        if (cancelled) return
        setRecords(response.data)
        setTotal(response.meta.total)
        setPageCount(response.meta.pageCount)
      })
      .catch((error) => {
        console.error("Error cargando historial de cierres", error)
        if (!cancelled) showToast(error instanceof Error ? error.message : "No fue posible cargar el historial", "error")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, effectiveBranchId, from, to, page, showToast])

  if (user && user.role !== "ADMIN" && user.role !== "MANAGER") return null

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/admin/cierre-dia" className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" />Volver al cierre
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <ClipboardCheck className="h-7 w-7 text-amber-600" />Historial de cierres
            </h1>
            <p className="mt-1 text-gray-500">Consulta las ventas calculadas, mermas y sobrantes de cada jornada.</p>
          </div>
          <Link href="/admin/cierre-dia">
            <Button><ClipboardCheck className="h-4 w-4" />Nuevo cierre</Button>
          </Link>
        </div>

        <div className="mb-6 grid gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-3">
          {user?.role === "ADMIN" && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Sucursal</span>
              <div className="relative">
                <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={branchId ?? ""}
                  onChange={(event) => { setBranchId(Number(event.target.value) || undefined); setPage(1) }}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                </select>
              </div>
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Desde</span>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1) }} className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Hasta</span>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1) }} className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </label>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-16 text-center"><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-amber-600" /><p className="text-gray-500">Cargando historial...</p></div>
          ) : records.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <ClipboardCheck className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="font-medium">No hay cierres para los filtros seleccionados</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Sucursal</th>
                      <th className="px-4 py-3">Registró</th>
                      <th className="px-3 py-3 text-center">Ventas</th>
                      <th className="px-3 py-3 text-center">Mermas</th>
                      <th className="px-3 py-3 text-center">Sobrantes</th>
                      <th className="px-4 py-3 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{displayDate(record.closeDate)}</td>
                        <td className="px-4 py-3 text-gray-600">{record.branch.name}</td>
                        <td className="px-4 py-3 text-gray-600">{record.user.firstName} {record.user.lastName}</td>
                        <td className="px-3 py-3 text-center font-semibold text-blue-700">{record.summary.totalSold}</td>
                        <td className="px-3 py-3 text-center font-semibold text-orange-700">{record.summary.totalWaste}</td>
                        <td className="px-3 py-3 text-center font-semibold text-green-700">{record.summary.totalSurplus}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/admin/cierre-dia/${record.id}`} className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900">
                            <Eye className="h-4 w-4" />Ver
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                <span>{total} cierre{total === 1 ? "" : "s"} encontrado{total === 1 ? "" : "s"}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
                  <span>Página {page} de {pageCount || 1}</span>
                  <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}><RefreshCw className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
