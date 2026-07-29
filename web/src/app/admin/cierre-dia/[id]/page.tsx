"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ClipboardCheck, Loader as Loader2, Package, ReceiptText } from "lucide-react"
import { dailyCloseService, type DailyCloseDetail } from "@/lib/api"
import { useToast } from "@/components/ui/toast"

function displayDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value)
  return date.toLocaleDateString("es-GT", { day: "2-digit", month: "long", year: "numeric" })
}

export default function DailyCloseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { showToast } = useToast()
  const [close, setClose] = useState<DailyCloseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [id, setId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void params.then(({ id: rawId }) => {
      const parsedId = Number(rawId)
      if (!Number.isInteger(parsedId) || parsedId < 1) {
        if (!cancelled) {
          setIsLoading(false)
          showToast("El cierre solicitado no es válido", "error")
        }
        return
      }
      setId(parsedId)
      return dailyCloseService.getDetail(parsedId)
        .then((data) => {
          if (!cancelled) setClose(data)
        })
        .catch((error) => {
          console.error("Error cargando detalle del cierre", error)
          if (!cancelled) showToast(error?.message || "No fue posible cargar el cierre", "error")
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })
    })
    return () => {
      cancelled = true
    }
  }, [params, showToast])

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin/cierre-dia/historial" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Volver al historial
        </Link>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-16 text-center shadow-sm"><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" /><p className="text-muted-foreground">Cargando cierre...</p></div>
        ) : !close ? (
          <div className="rounded-xl border border-destructive/10 bg-card p-16 text-center shadow-sm"><ClipboardCheck className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" /><p className="font-medium text-foreground">No se encontró el cierre {id ?? ""}</p></div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">Cierre diario #{close.id}</p>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><ClipboardCheck className="h-7 w-7" />{displayDate(close.closeDate)}</h1>
                <p className="mt-2 text-muted-foreground">{close.branch.name} · Registrado por {close.user.firstName} {close.user.lastName}</p>
                {close.note && <p className="mt-3 rounded-lg bg-cream p-3 text-sm text-muted-foreground">{close.note}</p>}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <Metric label="Ventas" value={close.summary.totalSold} className="bg-chart-3/10 text-chart-3" />
                <Metric label="Mermas" value={close.summary.totalWaste} className="bg-primary/10 text-primary" />
                <Metric label="Sobrantes" value={close.summary.totalSurplus} className="bg-success/10 text-success" />
              </div>
            </div>

            <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 font-semibold text-foreground"><Package className="h-4 w-4 text-primary" />Detalle por producto</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-cream text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-3 py-3 text-center">Sistema</th>
                      <th className="px-3 py-3 text-center">Reservado</th>
                      <th className="px-3 py-3 text-center">Conteo</th>
                      <th className="px-3 py-3 text-center">Venta</th>
                      <th className="px-3 py-3 text-center">Merma</th>
                      <th className="px-3 py-3 text-center">Sobrante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {close.items.map((item) => (
                      <tr key={item.id ?? item.productId}>
                        <td className="px-4 py-3 font-medium text-foreground">{item.productName}</td>
                        <td className="px-3 py-3 text-center text-muted-foreground">{item.systemQty}</td>
                        <td className="px-3 py-3 text-center text-primary">{item.reservedQty}</td>
                        <td className="px-3 py-3 text-center font-semibold">{item.countedQty}</td>
                        <td className="px-3 py-3 text-center text-chart-3">{item.soldQty}</td>
                        <td className="px-3 py-3 text-center text-primary">{item.wasteQty}</td>
                        <td className="px-3 py-3 text-center text-success">{item.surplusQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 font-semibold text-foreground"><ReceiptText className="h-4 w-4 text-primary" />Movimientos generados</div>
              <div className="divide-y divide-gray-100">
                {close.stockMovements.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No hubo ajustes de movimiento; el conteo coincidió con el sistema.</p> : close.stockMovements.map((movement) => (
                  <div key={movement.id} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="font-medium text-foreground">{movement.product?.name || `Producto #${movement.productId}`}</p><p className="text-xs text-muted-foreground">{movement.type} · {movement.note || ""}</p></div>
                    <span className="font-semibold text-foreground">{movement.quantity} unidades</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value, className }: { label: string; value: number; className: string }) {
  return <div className={`rounded-lg px-3 py-2 ${className}`}><p className="text-xl font-bold">{value}</p><p className="text-xs">{label}</p></div>
}
