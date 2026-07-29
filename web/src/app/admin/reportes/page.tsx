"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TriangleAlert as AlertTriangle, ArrowLeft, ChartBar as BarChart3, CalendarDays, CircleCheck as CheckCircle2, ChevronRight, Factory, RefreshCw, TrendingUp } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { MouseHandlerDataParam } from "recharts"
import { analyticsService, branchesService, forecastService } from "@/lib/api"
import type { AnalyticsOverview, DrilldownResponse, ForecastRun } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

function localDate(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDay(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-GT", { day: "2-digit", month: "short" })
}

export default function ReportsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [branches, setBranches] = useState<Array<{ id: number; name: string; slug: string }>>([])
  const [branchId, setBranchId] = useState<string>(user?.role === "ADMIN" ? "global" : user?.branchId?.toString() || "global")
  const [from, setFrom] = useState(localDate(-29))
  const [to, setTo] = useState(localDate())
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [forecastRuns, setForecastRuns] = useState<ForecastRun[]>([])
  const [drilldown, setDrilldown] = useState<DrilldownResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scopedBranchId = branchId === "global" ? undefined : Number(branchId)
  const isAdmin = user?.role === "ADMIN"

  useEffect(() => {
    branchesService.list().then(setBranches).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!isAdmin && user?.branchId) {
      const assignedBranchId = user.branchId.toString()
      queueMicrotask(() => setBranchId(assignedBranchId))
    }
  }, [isAdmin, user?.branchId])

  const loadAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [summary, latest] = await Promise.all([
        analyticsService.overview({ branchId: scopedBranchId, from, to, granularity: "day" }),
        forecastService.latest(scopedBranchId),
      ])
      setOverview(summary)
      setForecastRuns(Array.isArray(latest) ? latest : latest ? [latest] : [])
    } catch (loadError) {
      console.error(loadError)
      setError("No fue posible cargar la analítica. Verifica la conexión con el servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadAnalytics())
    // Filters are the source of truth for this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, from, to])

  const forecastItems = useMemo(() => forecastRuns.flatMap((run) => run.items), [forecastRuns])
  const forecastSeries = useMemo(() => {
    const map = new Map<string, { date: string; prevista: number; inferior: number; superior: number }>()
    forecastItems.forEach((item) => {
      const date = item.forecastDate.slice(0, 10)
      const existing = map.get(date) || { date, prevista: 0, inferior: 0, superior: 0 }
      existing.prevista += item.predictedQty
      existing.inferior += item.lowerBound
      existing.superior += item.upperBound
      map.set(date, existing)
    })
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
  }, [forecastItems])

  const actualForecastSeries = useMemo(() => {
    const actual = overview?.series.map((point) => ({
      date: point.date,
      real: point.demandQty,
      produccion: point.productionQty,
    })) || []
    return [...actual, ...forecastSeries.map((point) => ({ date: point.date, prevista: point.prevista, inferior: point.inferior, superior: point.superior }))]
  }, [overview?.series, forecastSeries])

  const openDrilldown = async (level: "branch" | "day" | "product" | "source", product?: number | null, nextBranch?: number) => {
    const selectedBranch = nextBranch ?? scopedBranchId
    try {
      const result = await analyticsService.drilldown({
        branchId: selectedBranch,
        productId: product ?? undefined,
        from,
        to,
        level,
        metric: "sales",
        pageSize: 50,
      })
      setDrilldown(result)
      if (nextBranch) {
        setBranchId(String(nextBranch))
        router.replace(`/admin/reportes?branchId=${nextBranch}&from=${from}&to=${to}`)
      }
    } catch (drillError) {
      console.error(drillError)
      setError("No fue posible cargar el detalle seleccionado.")
    }
  }

  const syncAndReload = async () => {
    setIsRunning(true)
    try {
      await analyticsService.sync(from, to, scopedBranchId)
      await loadAnalytics()
    } catch (syncError) {
      console.error(syncError)
      setError("No fue posible sincronizar el historial.")
    } finally {
      setIsRunning(false)
    }
  }

  const runForecast = async () => {
    setIsRunning(true)
    try {
      await forecastService.run(scopedBranchId, 7)
      await loadAnalytics()
    } catch (forecastError) {
      console.error(forecastError)
      setError("No fue posible ejecutar la predicción.")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin" className="hover:text-primary">Dashboard</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Reportes y analítica</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Reportes y predicción de demanda</h1>
          <p className="mt-1 text-sm text-muted-foreground">Historial consolidado de pedidos, POS y cierre del día.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={syncAndReload} disabled={isRunning} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} /> Sincronizar
          </button>
          <button onClick={runForecast} disabled={isRunning} className="inline-flex items-center gap-2 rounded-lg bg-accent0 px-3 py-2 text-sm font-medium text-white hover:bg-primary disabled:opacity-50">
            <TrendingUp className="h-4 w-4" /> Calcular predicción
          </button>
        </div>
      </div>

      {error && <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
        <label className="text-sm text-muted-foreground">
          Sucursal
          <select value={branchId} onChange={(event) => setBranchId(event.target.value)} disabled={!isAdmin} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-foreground disabled:bg-muted">
            {isAdmin && <option value="global">Todas las sucursales</option>}
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          Desde
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-foreground" />
        </label>
        <label className="text-sm text-muted-foreground">
          Hasta
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-foreground" />
        </label>
        <div className="flex items-end text-xs text-muted-foreground">
          <div className="rounded-lg bg-cream p-3">
            Cobertura: <strong>{Math.round((overview?.dataQuality.coverage || 0) * 100)}%</strong>
            <br />Zona horaria: {overview?.timezone || "America/Guatemala"}
          </div>
        </div>
      </div>

      {isLoading && !overview ? (
        <div className="rounded-xl bg-card p-10 text-center text-muted-foreground">Cargando analítica…</div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
            {[
              ["Ingresos", formatCurrency(overview?.kpis.revenue || 0)],
              ["Órdenes", overview?.kpis.orderCount || 0],
              ["Demanda", `${overview?.kpis.totalDemandQty || 0} uds`],
              ["Producción", `${overview?.kpis.productionQty || 0} uds`],
              ["Merma", `${overview?.kpis.wasteQty || 0} uds`],
              ["Stock bajo", overview?.kpis.lowStockAlerts || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><h2 className="font-semibold">Demanda, producción y ventas</h2></div>
                <span className="text-xs text-muted-foreground/60">Click en un día para detalle</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={actualForecastSeries} onClick={(state: MouseHandlerDataParam) => {
                  if (typeof state.activeTooltipIndex === "number" && actualForecastSeries[state.activeTooltipIndex]?.date) openDrilldown("day")
                }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => formatDay(String(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="real" name="Demanda real" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="produccion" name="Producción" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="prevista" name="Predicción" stroke="#16a34a" strokeWidth={3} strokeDasharray="5 5" dot />
                </LineChart>
              </ResponsiveContainer>
            </section>

            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2"><Factory className="h-5 w-5 text-primary" /><h2 className="font-semibold">Predicción próximos días</h2></div>
                <span className="text-xs text-muted-foreground/60">Modelo WMA + día de semana</span>
              </div>
              {forecastSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={forecastSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => formatDay(String(value))} />
                    <Bar dataKey="prevista" name="Unidades previstas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground/60">Aún no hay una predicción válida.</div>
              )}
            </section>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Ventas por sucursal</h2><span className="text-xs text-muted-foreground/60">Click para navegar</span></div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={overview?.salesByBranch || []} layout="vertical" onClick={(state: MouseHandlerDataParam) => {
                  const item = typeof state.activeTooltipIndex === "number" ? overview?.salesByBranch[state.activeTooltipIndex] : undefined
                  if (item?.branchId) openDrilldown("branch", undefined, item.branchId)
                }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(value) => `Q${value}`} />
                  <YAxis type="category" dataKey="branchName" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" name="Ingresos" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Productos con mayor demanda</h2><span className="text-xs text-muted-foreground/60">Click para detalle</span></div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={overview?.topProducts.slice(0, 8) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="totalDemand" name="Demanda" fill="#f59e0b" radius={[0, 4, 4, 0]} onClick={(_data: unknown, index: number) => {
                    const product = overview?.topProducts[index]
                    if (product) openDrilldown("product", product.productId)
                  }} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Producción recomendada</h2><span className="text-xs text-muted-foreground/60">Última ejecución: {forecastRuns[0] ? new Date(forecastRuns[0].generatedAt).toLocaleString("es-GT") : "sin datos"}</span></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b text-xs uppercase text-muted-foreground"><th className="pb-3">Producto</th><th className="pb-3">Fecha</th><th className="pb-3">Previsto</th><th className="pb-3">Producir</th><th className="pb-3">Confianza</th><th className="pb-3">Riesgo</th></tr></thead>
                  <tbody>
                    {forecastItems.slice(0, 15).map((item) => {
                      const risk = item.rawMaterialRisk?.status
                      return <tr key={item.id} className="border-b last:border-0 hover:bg-accent">
                        <td className="py-3"><button className="font-medium text-primary hover:underline" onClick={() => openDrilldown("product", item.productId)}>{item.product.name}</button></td>
                        <td className="py-3 text-muted-foreground">{formatDay(item.forecastDate.slice(0, 10))}</td>
                        <td className="py-3">{Math.round(item.predictedQty)} uds</td>
                        <td className="py-3 font-medium">{item.recommendedProductionQty} uds{item.recommendedTrays ? ` (${item.recommendedTrays} latas)` : ""}</td>
                        <td className="py-3">{Math.round(item.confidence * 100)}%</td>
                        <td className="py-3">{risk === "RISK" || risk === "NO_RECIPE" ? <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle className="h-4 w-4" /> Revisar</span> : <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" /> OK</span>}</td>
                      </tr>
                    })}
                  </tbody>
                </table>
                {forecastItems.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground/60">Genera una predicción para obtener recomendaciones.</div>}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary" /><h2 className="font-semibold">Calidad y fuentes</h2></div>
              <div className="space-y-4 text-sm">
                <div><p className="text-muted-foreground">Datos disponibles</p><p className="text-xl font-bold">{overview?.dataQuality.daysWithData || 0} / {overview?.dataQuality.totalDays || 0} días</p></div>
                <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-success/100" style={{ width: `${Math.round((overview?.dataQuality.coverage || 0) * 100)}%` }} /></div>
                <div className="rounded-lg bg-chart-3/10 p-3 text-chart-3">Pedidos/POS: <strong>{overview?.dataQuality.sources.orders || 0}</strong> uds</div>
                <div className="rounded-lg bg-accent p-3 text-primary">Cierre del día: <strong>{overview?.dataQuality.sources.dailyCloseResidual || 0}</strong> uds residuales</div>
                <Link href="/admin/inventario" className="inline-flex items-center gap-1 text-primary hover:underline">Revisar inventario <ChevronRight className="h-4 w-4" /></Link>
              </div>
            </section>
          </div>

          {overview?.lowStockProducts.length ? <section className="mb-6 rounded-xl border border-destructive/10 bg-card p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /><h2 className="font-semibold">Inventario bajo relacionado con la demanda</h2></div><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">{overview.lowStockProducts.slice(0, 8).map((item) => <Link key={`${item.branchId}-${item.productId}`} href={`/admin/inventario?productId=${item.productId}`} className="rounded-lg border border-border p-3 hover:border-primary/30"><p className="font-medium">{item.productName}</p><p className="text-xs text-muted-foreground">{item.branchName}</p><p className="mt-1 text-destructive">{item.available} uds disponibles</p></Link>)}</div></section> : null}

          {drilldown && <section className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><div className="mb-1 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /><h2 className="font-semibold">Detalle: {drilldown.level === "product" ? "producto" : drilldown.level === "branch" ? "sucursal" : "día"}</h2></div><p className="text-xs text-muted-foreground">{drilldown.range.from} a {drilldown.range.to} · {drilldown.meta.total} registros</p></div><button onClick={() => setDrilldown(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Cerrar</button></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-muted-foreground"><th className="pb-3">Nivel</th><th className="pb-3">Demanda</th><th className="pb-3">Pedidos/POS</th><th className="pb-3">Cierre</th><th className="pb-3">Producción</th><th className="pb-3">Merma</th><th className="pb-3">Fuentes</th></tr></thead><tbody>{drilldown.data.map((row, index) => <tr key={`${row.key}-${index}`} className="border-b last:border-0"><td className="py-3 font-medium">{row.productName || row.branchName || row.date || row.businessDate || row.reference || "—"}</td><td className="py-3">{row.demandQty ?? row.quantity ?? 0}</td><td className="py-3">{row.orderQty ?? "—"}</td><td className="py-3">{row.dailyCloseQty ?? "—"}</td><td className="py-3">{row.productionQty ?? "—"}</td><td className="py-3">{row.wasteQty ?? "—"}</td><td className="py-3">{row.source ? <Link href={row.href || "#"} className="text-primary hover:underline">{row.source}</Link> : row.productId ? <button onClick={() => openDrilldown("source", row.productId)} className="text-primary hover:underline">Ver fuentes</button> : "—"}</td></tr>)}</tbody></table></div></section>}
        </>
      )}
    </div>
  )
}
