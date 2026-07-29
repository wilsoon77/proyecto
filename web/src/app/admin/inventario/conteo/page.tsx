"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ClipboardCheck, Search, RefreshCw, Save, Check, TriangleAlert as AlertTriangle, TrendingUp, TrendingDown, Minus, Store } from "lucide-react"
import {
  inventoryService,
  branchesService,
  type InventoryItem
} from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

interface Branch {
  id: number
  name: string
  slug: string
}

interface CountEntry {
  productId: number
  productName: string
  productSlug: string
  systemQuantity: number
  reserved: number
  actualQuantity: string // string para permitir campo vacío mientras se escribe
  touched: boolean // true si el usuario lo modificó
}

type ReconcileResult = {
  branchName: string
  totalReviewed: number
  totalAdjusted: number
  sobrantes: number
  mermas: number
  sinCambio: number
  details: Array<{
    productId: number
    productName: string
    systemQuantity: number
    actualQuantity: number
    difference: number
    adjustmentType: 'SOBRANTE' | 'MERMA' | 'SIN_CAMBIO'
  }>
}

export default function ConteoPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [branches, setBranches] = useState<Branch[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<ReconcileResult | null>(null)

  // Entradas de conteo
  const [entries, setEntries] = useState<CountEntry[]>([])

  // Cargar datos iniciales
  useEffect(() => {
    const load = async () => {
      try {
        const branchesData = await branchesService.list()
        setBranches(branchesData)
        // Auto-seleccionar sucursal del usuario
        if (user?.branch?.slug) {
          setSelectedBranch(user.branch.slug)
        } else if (branchesData.length > 0 && user?.role === 'ADMIN') {
          setSelectedBranch(branchesData[0].slug)
        }
      } catch (err) {
        console.error("Error cargando datos:", err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [user])

  // Cargar inventario cuando cambia la sucursal
  useEffect(() => {
    if (!selectedBranch) return
    const loadInventory = async () => {
      setIsLoading(true)
      try {
        const data = await inventoryService.list({ branchSlug: selectedBranch })
        setInventory(data)
        // Inicializar entradas con la cantidad del sistema
        setEntries(data.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productSlug: item.product.slug,
          systemQuantity: item.quantity,
          reserved: item.reserved,
          actualQuantity: String(item.quantity),
          touched: false,
        })))
      } catch (err) {
        console.error("Error cargando inventario:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadInventory()
  }, [selectedBranch])

  // Filtrar entradas
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries
    const q = searchQuery.toLowerCase()
    return entries.filter(e => e.productName.toLowerCase().includes(q))
  }, [entries, searchQuery])

  // Estadísticas en tiempo real
  const stats = useMemo(() => {
    const touched = entries.filter(e => e.touched)
    let sobrantes = 0, mermas = 0, sinCambio = 0
    touched.forEach(e => {
      const actual = parseInt(e.actualQuantity) || 0
      const diff = actual - e.systemQuantity
      if (diff > 0) sobrantes++
      else if (diff < 0) mermas++
      else sinCambio++
    })
    return { total: entries.length, touched: touched.length, sobrantes, mermas, sinCambio }
  }, [entries])

  const updateEntry = (productId: number, value: string) => {
    setEntries(prev => prev.map(e =>
      e.productId === productId
        ? { ...e, actualQuantity: value, touched: true }
        : e
    ))
  }

  const handleSubmit = async () => {
    const touchedEntries = entries.filter(e => e.touched)
    if (touchedEntries.length === 0) {
      showToast('No has modificado ningún producto', 'error')
      return
    }

    // Validar que todos los valores sean números
    const invalid = touchedEntries.find(e => isNaN(parseInt(e.actualQuantity)) || parseInt(e.actualQuantity) < 0)
    if (invalid) {
      showToast(`Cantidad inválida para ${invalid.productName}`, 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await inventoryService.reconcile({
        branchSlug: selectedBranch,
        items: touchedEntries.map(e => ({
          productId: e.productId,
          actualQuantity: parseInt(e.actualQuantity),
        })),
        note: note || undefined,
      })
      setResult(res)
      showToast(`Reconciliación completada: ${res.totalAdjusted} ajustes realizados`, 'success')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al reconciliar'
      showToast(Array.isArray(msg) ? msg[0] : msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pantalla de resultado
  if (result) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-cream min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Reconciliación completada</h2>
              <p className="text-muted-foreground mt-1">{result.branchName}</p>
            </div>

            {/* Resumen en cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-chart-3/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-chart-3">{result.totalReviewed}</p>
                <p className="text-xs text-chart-3 font-medium">Revisados</p>
              </div>
              <div className="bg-success/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-success">{result.sobrantes}</p>
                <p className="text-xs text-success font-medium">Sobrantes</p>
              </div>
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary">{result.mermas}</p>
                <p className="text-xs text-primary font-medium">Mermas</p>
              </div>
              <div className="bg-cream rounded-xl p-4 text-center border">
                <p className="text-2xl font-bold text-foreground">{result.sinCambio}</p>
                <p className="text-xs text-muted-foreground font-medium">Sin cambio</p>
              </div>
            </div>

            {/* Detalle de ajustes */}
            {result.details.filter(d => d.adjustmentType !== 'SIN_CAMBIO').length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-3">Detalle de ajustes</h3>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-cream">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Producto</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Sistema</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Conteo</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Diferencia</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.details
                        .filter(d => d.adjustmentType !== 'SIN_CAMBIO')
                        .map(d => (
                          <tr key={d.productId} className="hover:bg-cream">
                            <td className="px-4 py-3 font-medium text-foreground">{d.productName}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{d.systemQuantity}</td>
                            <td className="px-4 py-3 text-center font-medium">{d.actualQuantity}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-bold ${d.difference > 0 ? 'text-success' : 'text-destructive'}`}>
                                {d.difference > 0 ? '+' : ''}{d.difference}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                d.adjustmentType === 'SOBRANTE'
                                  ? 'bg-success/10 text-success'
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                {d.adjustmentType === 'SOBRANTE' ? (
                                  <>
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Sobrante
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown className="h-3.5 w-3.5" />
                                    Merma
                                  </>
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <Link href="/admin/inventario">
                <Button variant="outline" size="lg">Volver al inventario</Button>
              </Link>
              <Button size="lg" onClick={() => { setResult(null); setEntries([]); setSelectedBranch("") }}>
                Nuevo conteo
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-cream min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/inventario"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inventario
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardCheck className="h-7 w-7 text-primary" />
              Conteo de Inventario
            </h1>
            <p className="text-muted-foreground mt-1">Ingresa las cantidades físicas reales y el sistema calculará los ajustes automáticamente</p>
          </div>
        </div>
      </div>

      {/* Controles: Sucursal + Búsqueda */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 min-w-[200px]">
            <Store className="h-5 w-5 text-muted-foreground" />
            <select
              className="flex-1 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-card font-medium"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={user?.role !== 'ADMIN'}
            >
              <option value="" disabled>Seleccionar sucursal</option>
              {branches.map(b => (
                <option key={b.id} value={b.slug}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            {stats.touched} de {stats.total} modificados
          </div>
        </div>
      </div>

      {/* Stats en tiempo real */}
      {stats.touched > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-success/10 rounded-xl p-3 flex items-center gap-3 border border-success/20">
            <TrendingUp className="h-5 w-5 text-success" />
            <div>
              <p className="text-lg font-bold text-success">{stats.sobrantes}</p>
              <p className="text-xs text-success">Sobrantes</p>
            </div>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 flex items-center gap-3 border border-primary/20">
            <TrendingDown className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-primary">{stats.mermas}</p>
              <p className="text-xs text-primary">Mermas</p>
            </div>
          </div>
          <div className="bg-cream rounded-xl p-3 flex items-center gap-3 border border-border">
            <Minus className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.sinCambio}</p>
              <p className="text-xs text-muted-foreground">Sin cambio</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de conteo */}
      {isLoading ? (
        <div className="bg-card rounded-xl shadow-sm border p-12 text-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Cargando inventario...</p>
        </div>
      ) : !selectedBranch ? (
        <div className="bg-card rounded-xl shadow-sm border p-12 text-center">
          <Store className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground/60">Selecciona una sucursal para empezar el conteo</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border p-12 text-center">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground/60">No hay productos en esta sucursal</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredEntries.map(entry => {
              const actual = parseInt(entry.actualQuantity) || 0
              const diff = entry.touched ? actual - entry.systemQuantity : 0
              return (
                <div key={entry.productId} className={`p-4 ${entry.touched && diff !== 0 ? (diff > 0 ? 'bg-success/10/50' : 'bg-primary/10/50') : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground">{entry.productName}</p>
                    {entry.touched && diff !== 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${diff > 0 ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Sistema: <strong>{entry.systemQuantity}</strong>
                      {entry.reserved > 0 && <span className="text-primary ml-1">({entry.reserved} res.)</span>}
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        value={entry.actualQuantity}
                        onChange={(e) => updateEntry(entry.productId, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                          entry.touched && diff !== 0
                            ? diff > 0 ? 'border-success/30 bg-success/10' : 'border-primary/30 bg-primary/10'
                            : 'border-border'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead className="bg-cream border-b">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-muted-foreground text-sm">Producto</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-sm">Stock Sistema</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-sm">Reservado</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-sm w-40">
                    <span className="text-primary">Conteo Físico</span>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-sm">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEntries.map(entry => {
                  const actual = parseInt(entry.actualQuantity) || 0
                  const diff = entry.touched ? actual - entry.systemQuantity : 0
                  return (
                    <tr
                      key={entry.productId}
                      className={`transition-colors ${
                        entry.touched && diff !== 0
                          ? diff > 0 ? 'bg-success/10/50 hover:bg-success/10' : 'bg-primary/10/50 hover:bg-primary/10'
                          : 'hover:bg-cream'
                      }`}
                    >
                      <td className="py-3 px-6">
                        <p className="font-medium text-foreground">{entry.productName}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-foreground">{entry.systemQuantity}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={entry.reserved > 0 ? 'text-primary font-medium' : 'text-muted-foreground/60'}>
                          {entry.reserved}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          value={entry.actualQuantity}
                          onChange={(e) => updateEntry(entry.productId, e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                            entry.touched && diff !== 0
                              ? diff > 0 ? 'border-success/40 bg-success/10 text-success' : 'border-primary/40 bg-primary/10 text-primary'
                              : 'border-border'
                          }`}
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {entry.touched && diff !== 0 ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${
                            diff > 0 ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                          }`}>
                            {diff > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer: Nota + Botón de envío */}
      {entries.length > 0 && (
        <div className="mt-6 bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Nota del conteo (opcional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej: Conteo cierre de día 13/04/2026"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-3">
              <Link href="/admin/inventario">
                <Button variant="outline" size="lg">Cancelar</Button>
              </Link>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting || stats.touched === 0}
                className="min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Conteo ({stats.touched} {stats.touched === 1 ? 'cambio' : 'cambios'})
                  </>
                )}
              </Button>
            </div>
          </div>

          {stats.touched > 0 && (
            <div className="mt-4 p-3 bg-accent rounded-lg border border-primary/20 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-primary">
                Al guardar, se generarán movimientos de tipo <strong>Sobrante</strong> o <strong>Merma</strong> automáticamente
                para los {stats.touched} productos modificados. Esta acción no se puede deshacer.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
