"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { Package, RefreshCw, TriangleAlert as AlertTriangle, Warehouse, Building2, ArrowRightLeft, ChevronRight, ClipboardCheck, TrendingUp, TrendingDown } from "lucide-react"
import { 
  inventoryService, 
  branchesService,
  rawMaterialsService,
  type InventoryItem,
  type RawMaterialInventory
} from "@/lib/api"
import { useToast } from "@/components/ui/toast"

interface Branch {
  id: number
  name: string
  slug: string
}

export default function InventarioResumenPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [rawInventory, setRawInventory] = useState<RawMaterialInventory[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { showToast } = useToast()

  // Cargar datos consolidados
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [inventoryData, rawInvData, branchesData] = await Promise.all([
        inventoryService.list(),
        rawMaterialsService.getInventory(),
        branchesService.list()
      ])
      setInventory(inventoryData)
      setRawInventory(rawInvData)
      setBranches(branchesData)
    } catch (err) {
      console.error("Error loading inventory resume:", err)
      setError("Error al cargar los datos del resumen")
      showToast("Error al consolidar datos del inventario", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Estadísticas unificadas
  const stats = useMemo(() => {
    const totalFinishedProducts = new Set(inventory.map(i => i.product.id)).size
    const totalRawMaterials = new Set(rawInventory.map(i => i.rawMaterial.id)).size
    
    const finishedVolume = inventory.reduce((sum, i) => sum + i.quantity, 0)
    const rawVolume = rawInventory.reduce((sum, i) => sum + Number(i.quantity), 0)

    const finishedLow = inventory.filter(i => i.available > 0 && i.available <= 10).length
    const rawLow = rawInventory.filter(i => i.isLow).length

    const finishedOut = inventory.filter(i => i.available === 0).length

    return {
      totalFinishedProducts,
      totalRawMaterials,
      finishedVolume,
      rawVolume,
      totalAlerts: finishedLow + rawLow,
      finishedOut
    }
  }, [inventory, rawInventory])

  // Alertas consolidadas (máximo 6 para mantenerlo limpio)
  const consolidatedAlerts = useMemo(() => {
    const alerts: {
      type: "finished" | "raw"
      id: string
      name: string
      branch: string
      quantity: string
      isOutOfStock: boolean
    }[] = []

    // Productos terminados con stock bajo o agotado
    inventory
      .filter(i => i.available > 0 && i.available <= 10)
      .forEach(i => {
        alerts.push({
          type: "finished",
          id: `f-${i.product.id}-${i.branch.id}`,
          name: i.product.name,
          branch: i.branch.name,
          quantity: `${i.available} disp.`,
          isOutOfStock: i.available === 0
        })
      })

    // Materias primas con stock bajo
    rawInventory
      .filter(i => i.isLow)
      .forEach(i => {
        alerts.push({
          type: "raw",
          id: `r-${i.id}`,
          name: i.rawMaterial.name,
          branch: i.branch.name,
          quantity: `${Number(i.quantity).toFixed(1)} ${i.rawMaterial.baseUnit}`,
          isOutOfStock: Number(i.quantity) <= 0
        })
      })

    return alerts.slice(0, 6)
  }, [inventory, rawInventory])

  if (isLoading && inventory.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-border rounded w-48"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-border rounded-xl"></div>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl h-64"></div>
            <div className="bg-card rounded-xl h-64"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-cream min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <Warehouse className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            Resumen de Inventario
          </h1>
          <p className="text-muted-foreground mt-1">Dashboard consolidado del inventario general de la panadería</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-cream disabled:opacity-50 w-full sm:w-auto justify-center shadow-sm text-sm font-medium transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar Dashboard
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-xl shadow-sm border border-border p-5 transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Productos Activos</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.totalFinishedProducts}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">Existencias: {stats.finishedVolume.toLocaleString()} uds</p>
            </div>
            <div className="h-12 w-12 bg-accent rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-5 transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Insumos de Materia Prima</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.totalRawMaterials}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">Existencias: {stats.rawVolume.toLocaleString(undefined, { maximumFractionDigits: 1 })} uds</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-xl flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-success" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-5 transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Alertas de Stock</p>
              <p className={`text-2xl font-bold mt-1 ${stats.totalAlerts > 0 ? 'text-warning' : 'text-foreground'}`}>
                {stats.totalAlerts}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">Insumos y productos bajos</p>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-5 transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Productos Agotados</p>
              <p className={`text-2xl font-bold mt-1 ${stats.finishedOut > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {stats.finishedOut}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">Requieren producción urgente</p>
            </div>
            <div className="h-12 w-12 bg-destructive/10 rounded-xl flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Navigation Menu */}
      <h2 className="text-lg font-bold text-foreground mb-4">Módulos y Herramientas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link 
          href="/admin/inventario/productos" 
          className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 bg-accent0 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">Productos Terminados</h3>
            <p className="text-sm text-muted-foreground mt-2">Consulta existencias, productos reservados y disponibles de panadería en cada sucursal.</p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
            Ver Productos <ChevronRight className="h-4 w-4" />
          </div>
        </Link>

        <Link 
          href="/admin/inventario/materias-primas" 
          className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-success/20 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 bg-success/100 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <Warehouse className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-foreground text-lg group-hover:text-success transition-colors">Materias Primas</h3>
            <p className="text-sm text-muted-foreground mt-2">Controla el stock de harina, azúcar, mantecas e insumos. Registra nuevas compras del local.</p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm font-bold text-success group-hover:translate-x-1 transition-transform">
            Ver Materias Primas <ChevronRight className="h-4 w-4" />
          </div>
        </Link>

        <Link 
          href="/admin/inventario/movimiento" 
          className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-chart-3/20 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 bg-chart-3/100 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <ArrowRightLeft className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-foreground text-lg group-hover:text-chart-3 transition-colors">Movimientos de Stock</h3>
            <p className="text-sm text-muted-foreground mt-2">Ingresa entradas y salidas manuales de stock, o realiza transferencias ordenadas entre sucursales.</p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm font-bold text-chart-3 group-hover:translate-x-1 transition-transform">
            Ir a Movimientos <ChevronRight className="h-4 w-4" />
          </div>
        </Link>

        <Link 
          href="/admin/inventario/conteo" 
          className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-chart-5/20 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 bg-chart-5/100 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <ClipboardCheck className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-foreground text-lg group-hover:text-chart-5 transition-colors">Conteo Físico</h3>
            <p className="text-sm text-muted-foreground mt-2">Reconcilia el inventario físico real con los datos del sistema. Registra mermas y sobrantes.</p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm font-bold text-chart-5 group-hover:translate-x-1 transition-transform">
            Iniciar Conteo <ChevronRight className="h-4 w-4" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Alertas Consolidadas */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas Recientes
            </h3>
            {consolidatedAlerts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground/60 text-sm">
                <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
                Todo al día. No hay alertas de stock bajo.
              </div>
            ) : (
              <div className="space-y-3">
                {consolidatedAlerts.map(alert => (
                  <div 
                    key={alert.id}
                    className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                      alert.isOutOfStock 
                        ? 'bg-destructive/10 border-destructive/10 text-destructive' 
                        : 'bg-warning/10 border-warning/10 text-warning'
                    }`}
                  >
                    <div>
                      <p className="font-semibold truncate max-w-[180px]">{alert.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">{alert.branch}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      alert.isOutOfStock ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                    }`}>
                      {alert.isOutOfStock ? 'Agotado' : alert.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {consolidatedAlerts.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border text-right">
              <Link 
                href="/admin/inventario/productos?showLowStock=true" 
                className="text-xs font-bold text-primary hover:text-primary"
              >
                Ver todas las alertas
              </Link>
            </div>
          )}
        </div>

        {/* Existencias por Sucursal */}
        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Consolidado por Sucursal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {branches.map(branch => {
              const finishedQty = inventory
                .filter(i => i.branch.id === branch.id)
                .reduce((sum, i) => sum + i.quantity, 0)
              const rawQty = rawInventory
                .filter(i => i.branch.id === branch.id)
                .reduce((sum, i) => sum + Number(i.quantity), 0)

              const finishedAlerts = inventory.filter(i => i.branch.id === branch.id && i.available < 10).length
              const rawAlerts = rawInventory.filter(i => i.branch.id === branch.id && i.isLow).length
              const totalAlerts = finishedAlerts + rawAlerts

              return (
                <div 
                  key={branch.id}
                  className="p-4 bg-cream/50 hover:bg-cream rounded-xl border border-border transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-foreground">{branch.name}</p>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground font-medium">
                        <p>Panadería: <strong className="text-foreground">{finishedQty.toLocaleString()} uds</strong></p>
                        <p>Materia Prima: <strong className="text-foreground">{rawQty.toLocaleString(undefined, { maximumFractionDigits: 1 })} uds</strong></p>
                      </div>
                    </div>
                    {totalAlerts > 0 && (
                      <span className="px-2 py-0.5 bg-warning/10 text-warning rounded-full text-[10px] font-bold">
                        {totalAlerts} alertas
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
