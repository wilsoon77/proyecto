"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ClipboardCheck,
  Search,
  RefreshCw,
  Save,
  Check,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Store
} from "lucide-react"
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
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Reconciliación completada</h2>
              <p className="text-gray-500 mt-1">{result.branchName}</p>
            </div>

            {/* Resumen en cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{result.totalReviewed}</p>
                <p className="text-xs text-blue-600 font-medium">Revisados</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{result.sobrantes}</p>
                <p className="text-xs text-green-600 font-medium">Sobrantes</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-700">{result.mermas}</p>
                <p className="text-xs text-orange-600 font-medium">Mermas</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border">
                <p className="text-2xl font-bold text-gray-700">{result.sinCambio}</p>
                <p className="text-xs text-gray-500 font-medium">Sin cambio</p>
              </div>
            </div>

            {/* Detalle de ajustes */}
            {result.details.filter(d => d.adjustmentType !== 'SIN_CAMBIO').length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Detalle de ajustes</h3>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Sistema</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Conteo</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Diferencia</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Tipo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.details
                        .filter(d => d.adjustmentType !== 'SIN_CAMBIO')
                        .map(d => (
                          <tr key={d.productId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{d.productName}</td>
                            <td className="px-4 py-3 text-center text-gray-500">{d.systemQuantity}</td>
                            <td className="px-4 py-3 text-center font-medium">{d.actualQuantity}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-bold ${d.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {d.difference > 0 ? '+' : ''}{d.difference}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                d.adjustmentType === 'SOBRANTE'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
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
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/inventario"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inventario
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="h-7 w-7 text-amber-600" />
              Conteo de Inventario
            </h1>
            <p className="text-gray-500 mt-1">Ingresa las cantidades físicas reales y el sistema calculará los ajustes automáticamente</p>
          </div>
        </div>
      </div>

      {/* Controles: Sucursal + Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 min-w-[200px]">
            <Store className="h-5 w-5 text-gray-500" />
            <select
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="text-sm text-gray-500">
            {stats.touched} de {stats.total} modificados
          </div>
        </div>
      </div>

      {/* Stats en tiempo real */}
      {stats.touched > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3 border border-green-200">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-lg font-bold text-green-700">{stats.sobrantes}</p>
              <p className="text-xs text-green-600">Sobrantes</p>
            </div>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 flex items-center gap-3 border border-orange-200">
            <TrendingDown className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-lg font-bold text-orange-700">{stats.mermas}</p>
              <p className="text-xs text-orange-600">Mermas</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-200">
            <Minus className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-lg font-bold text-gray-700">{stats.sinCambio}</p>
              <p className="text-xs text-gray-500">Sin cambio</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de conteo */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <RefreshCw className="h-8 w-8 text-amber-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Cargando inventario...</p>
        </div>
      ) : !selectedBranch ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Store className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Selecciona una sucursal para empezar el conteo</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No hay productos en esta sucursal</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredEntries.map(entry => {
              const actual = parseInt(entry.actualQuantity) || 0
              const diff = entry.touched ? actual - entry.systemQuantity : 0
              return (
                <div key={entry.productId} className={`p-4 ${entry.touched && diff !== 0 ? (diff > 0 ? 'bg-green-50/50' : 'bg-orange-50/50') : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{entry.productName}</p>
                    {entry.touched && diff !== 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${diff > 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                      Sistema: <strong>{entry.systemQuantity}</strong>
                      {entry.reserved > 0 && <span className="text-amber-600 ml-1">({entry.reserved} res.)</span>}
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        value={entry.actualQuantity}
                        onChange={(e) => updateEntry(entry.productId, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          entry.touched && diff !== 0
                            ? diff > 0 ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50'
                            : 'border-gray-200'
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
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-600 text-sm">Producto</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">Stock Sistema</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">Reservado</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm w-40">
                    <span className="text-amber-600">Conteo Físico</span>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">Diferencia</th>
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
                          ? diff > 0 ? 'bg-green-50/50 hover:bg-green-50' : 'bg-orange-50/50 hover:bg-orange-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-6">
                        <p className="font-medium text-gray-900">{entry.productName}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-gray-700">{entry.systemQuantity}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={entry.reserved > 0 ? 'text-amber-600 font-medium' : 'text-gray-400'}>
                          {entry.reserved}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          value={entry.actualQuantity}
                          onChange={(e) => updateEntry(entry.productId, e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                            entry.touched && diff !== 0
                              ? diff > 0 ? 'border-green-400 bg-green-50 text-green-800' : 'border-orange-400 bg-orange-50 text-orange-800'
                              : 'border-gray-200'
                          }`}
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {entry.touched && diff !== 0 ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${
                            diff > 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {diff > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
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
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nota del conteo (opcional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej: Conteo cierre de día 13/04/2026"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
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
