"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Package,
  RefreshCw,
  Warehouse,
} from "lucide-react"
import { inventoryService, rawMaterialsService } from "@/lib/api"
import type { ExpirationLot, RawMaterialInventory } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/components/ui/toast"

const INVENTORY_TOOLS = [
  {
    href: "/admin/inventario/productos",
    title: "Productos terminados",
    description: "Consulta existencias, reservas y disponibilidad por sucursal.",
    icon: Package,
  },
  {
    href: "/admin/inventario/materias-primas",
    title: "Materias primas",
    description: "Registra compras y revisa cantidades contra el mínimo configurado.",
    icon: Warehouse,
  },
  {
    href: "/admin/inventario/caducidades",
    title: "Caducidades",
    description: "Revisa lotes comprados próximos a vencer.",
    icon: CalendarClock,
  },
  {
    href: "/admin/inventario/movimiento",
    title: "Movimientos",
    description: "Registra compras, mermas, ajustes y transferencias.",
    icon: ArrowRightLeft,
  },
  {
    href: "/admin/inventario/conteo",
    title: "Conteo físico",
    description: "Concilia el conteo real al cierre de la jornada.",
    icon: ClipboardCheck,
  },
]

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function InventarioResumenPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [rawInventory, setRawInventory] = useState<RawMaterialInventory[]>([])
  const [expiringLots, setExpiringLots] = useState<ExpirationLot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingExpirations, setIsCheckingExpirations] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const globalScope = user?.role === "ADMIN" || user?.role === "MANAGER"
      const [rawData, expirationData] = await Promise.all([
        rawMaterialsService.getInventory(globalScope ? undefined : user?.branchId ?? undefined),
        inventoryService.listExpirations({
          branch: globalScope ? undefined : user?.branch?.slug,
          status: "expiring",
          days: 7,
        }),
      ])
      setRawInventory(rawData)
      setExpiringLots(expirationData.data)
    } catch (loadError) {
      console.error("Error cargando inventario operativo:", loadError)
      setError("No se pudo cargar el estado del inventario")
      showToast("Error al cargar el inventario", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showToast, user?.role, user?.branch?.slug, user?.branchId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const checkExpirations = async () => {
    setIsCheckingExpirations(true)
    try {
      await inventoryService.checkExpirations()
      await loadData()
      showToast("Caducidades revisadas", "success")
    } catch (checkError) {
      console.error("Error revisando caducidades:", checkError)
      showToast("No se pudieron revisar las caducidades", "error")
    } finally {
      setIsCheckingExpirations(false)
    }
  }

  const lowMaterials = rawInventory.filter((item) => item.isLow)

  if (isLoading && rawInventory.length === 0 && expiringLots.length === 0) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-64 rounded-xl bg-[#FAF5EE] border border-[#E8DCCB]" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-64 rounded-2xl bg-white border border-[#E8DCCB]" />
          <div className="h-64 rounded-2xl bg-white border border-[#E8DCCB]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-display text-2xl font-bold text-[#2B170F] sm:text-3xl">
            <Warehouse className="h-7 w-7 text-[#D97706]" />
            Inventario Operativo
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6E5545]">
            Monitoreo en tiempo real de materias primas, caducidades y existencia de productos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void loadData()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DECDBB] bg-white px-3.5 py-2 text-xs font-bold text-[#2B170F] shadow-xs transition hover:bg-[#FAF5EE] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-[#D97706] ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
          <button
            onClick={() => void checkExpirations()}
            disabled={isCheckingExpirations}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D97706] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#B45309] disabled:opacity-50"
          >
            <CalendarClock className={`h-4 w-4 ${isCheckingExpirations ? "animate-spin" : ""}`} />
            Revisar caducidades
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-bold text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E8DCCB] bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-[#2B170F]">
                <AlertTriangle className="h-4.5 w-4.5 text-[#D97706]" />
                Materias primas bajo mínimo
              </h2>
              <p className="mt-0.5 text-xs text-[#6E5545]">Se alerta al llegar al stock mínimo configurado.</p>
            </div>
            <span className="rounded-full bg-[#FAF0E6] border border-[#ECCDB5] px-2.5 py-0.5 text-xs font-bold text-[#9E4D1A]">
              {lowMaterials.length}
            </span>
          </div>
          {lowMaterials.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              No hay materias primas por debajo del mínimo.
            </div>
          ) : (
            <div className="space-y-2">
              {lowMaterials.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-[#ECCDB5] bg-[#FAF0E6] p-3">
                  <div>
                    <p className="font-bold text-xs text-[#2B170F]">{item.rawMaterial.name}</p>
                    <p className="text-[11px] text-[#8C522B]">{item.branch.name}</p>
                  </div>
                  <span className="text-xs font-bold text-[#9E4D1A]">
                    {Number(item.quantity).toFixed(1)} {item.rawMaterial.baseUnit}
                  </span>
                </div>
              ))}
              {lowMaterials.length > 6 && (
                <p className="pt-2 text-xs text-[#8C522B] font-semibold">Hay {lowMaterials.length - 6} alertas más.</p>
              )}
            </div>
          )}
          <Link href="/admin/inventario/materias-primas" className="mt-4 inline-flex text-xs font-bold text-[#D97706] hover:underline">
            Gestionar materias primas →
          </Link>
        </section>

        <section className="rounded-2xl border border-[#E8DCCB] bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-[#2B170F]">
                <CalendarClock className="h-4.5 w-4.5 text-orange-600" />
                Próximos vencimientos
              </h2>
              <p className="mt-0.5 text-xs text-[#6E5545]">Lotes con caducidad en los próximos 7 días.</p>
            </div>
            <span className="rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-bold text-orange-700">
              {expiringLots.length}
            </span>
          </div>
          {expiringLots.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              No hay lotes próximos a vencer.
            </div>
          ) : (
            <div className="space-y-2">
              {expiringLots.slice(0, 6).map((lot) => (
                <div key={lot.id} className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50/70 p-3">
                  <div>
                    <p className="font-bold text-xs text-[#2B170F]">{lot.product.name}</p>
                    <p className="text-[11px] text-[#6E5545]">{lot.branch.name} · {lot.availableQuantity} disponibles</p>
                  </div>
                  <span className="text-right text-xs font-bold text-orange-800">
                    {lot.expiresAt ? formatDate(lot.expiresAt) : "Sin fecha"}
                    {lot.daysLeft !== null && <span className="block text-[10px] font-normal text-orange-700">{lot.daysLeft} días</span>}
                  </span>
                </div>
              ))}
              {expiringLots.length > 6 && (
                <p className="pt-2 text-xs text-[#8C522B] font-semibold">Hay {expiringLots.length - 6} lotes más.</p>
              )}
            </div>
          )}
          <Link href="/admin/inventario/caducidades" className="mt-4 inline-flex text-xs font-bold text-[#D97706] hover:underline">
            Ver caducidades →
          </Link>
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-base font-bold text-[#2B170F]">Módulos de Inventario</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INVENTORY_TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <Link key={tool.href} href={tool.href} className="group rounded-2xl border border-[#E8DCCB] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D97706] hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF0E6] text-[#D97706] transition-colors group-hover:bg-[#D97706] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-[#DECDBB] transition group-hover:translate-x-1 group-hover:text-[#D97706]">→</span>
                </div>
                <h3 className="font-bold text-xs text-[#2B170F]">{tool.title}</h3>
                <p className="mt-1 text-xs text-[#6E5545]">{tool.description}</p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
