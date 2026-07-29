"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { TriangleAlert as AlertTriangle, ArrowUpRight, Factory, TrendingUp } from "lucide-react"
import { analyticsService, forecastService } from "@/lib/api"
import type { ForecastRun } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

function localDate(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function AnalyticsPreview() {
  const { user } = useAuth()
  const [forecast, setForecast] = useState<ForecastRun | null>(null)
  const [coverage, setCoverage] = useState(0)

  useEffect(() => {
    const branchId = user?.role === "ADMIN" ? undefined : user?.branchId || undefined
    Promise.all([
      analyticsService.overview({ branchId, from: localDate(-29), to: localDate() }),
      forecastService.latest(branchId),
    ]).then(([overview, latest]) => {
      setCoverage(overview.dataQuality.coverage)
      const run = Array.isArray(latest) ? latest[0] : latest
      setForecast(run || null)
    }).catch(() => undefined)
  }, [user?.branchId, user?.role])

  const nextDayItems = forecast?.items.filter((item) => item.forecastDate.slice(0, 10) === forecast.periodStart.slice(0, 10)) || []
  const riskCount = nextDayItems.filter((item) => item.rawMaterialRisk?.status === "RISK" || item.rawMaterialRisk?.status === "NO_RECIPE").length

  return (
    <div className="mb-8 rounded-xl border border-primary/10 bg-gradient-to-r from-accent to-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent0 text-white"><TrendingUp className="h-6 w-6" /></div>
          <div>
            <h3 className="font-semibold text-foreground">Analítica y producción recomendada</h3>
            <p className="mt-1 text-sm text-muted-foreground">Cobertura histórica: {Math.round(coverage * 100)}% · {forecast ? `Modelo actualizado ${new Date(forecast.generatedAt).toLocaleDateString("es-GT")}` : "Aún no se ha calculado una predicción"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {forecast && <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm text-foreground"><Factory className="h-4 w-4 text-primary" />{nextDayItems.reduce((sum, item) => sum + item.recommendedProductionQty, 0)} uds mañana</div>}
          {riskCount > 0 && <div className="flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />{riskCount} riesgos</div>}
          <Link href="/admin/reportes" className="inline-flex items-center gap-1 rounded-lg bg-accent0 px-3 py-2 text-sm font-medium text-white hover:bg-primary">Abrir analítica <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  )
}
