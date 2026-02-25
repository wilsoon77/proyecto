"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { 
  Package, 
  RefreshCw, 
  Plus, 
  ArrowUpDown,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Warehouse,
  Building2,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Eye
} from "lucide-react"
import { 
  inventoryService, 
  branchesService,
  type InventoryItem
} from "@/lib/api"

interface Branch {
  id: number
  name: string
  slug: string
}

interface InventoryStats {
  totalProducts: number
  totalQuantity: number
  lowStockCount: number
  outOfStockCount: number
  byBranch: {
    branchId: number
    branchName: string
    branchSlug: string
    totalQuantity: number
    lowStockCount: number
  }[]
}

export default function InventarioPage() {
  // Estados principales
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showLowStock, setShowLowStock] = useState(false)
  const [showTable, setShowTable] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [inventoryData, branchesData] = await Promise.all([
          inventoryService.list(),
          branchesService.list()
        ])
        setInventory(inventoryData)
        setBranches(branchesData)
        setError(null)
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Error al cargar los datos del inventario")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Calcular estadísticas
  const stats: InventoryStats = {
    totalProducts: new Set(inventory.map(i => i.product.id)).size,
    totalQuantity: inventory.reduce((sum, i) => sum + i.quantity, 0),
    lowStockCount: inventory.filter(i => i.available > 0 && i.available < 10).length,
    outOfStockCount: inventory.filter(i => i.available === 0).length,
    byBranch: branches.map(branch => {
      const branchInventory = inventory.filter(i => i.branch.id === branch.id)
      return {
        branchId: branch.id,
        branchName: branch.name,
        branchSlug: branch.slug,
        totalQuantity: branchInventory.reduce((sum, i) => sum + i.quantity, 0),
        lowStockCount: branchInventory.filter(i => i.available < 10).length
      }
    })
  }

  // Recargar inventario
  const refreshInventory = useCallback(async () => {
    setIsLoading(true)
    try {
      const inventoryData = await inventoryService.list()
      setInventory(inventoryData)
      setError(null)
    } catch (err) {
      console.error("Error refreshing inventory:", err)
      setError("Error al actualizar el inventario")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Filtrar inventario
  const filteredInventory = inventory.filter(item => {
    if (selectedBranch !== "all" && item.branch.slug !== selectedBranch) {
      return false
    }
    if (showLowStock && item.available >= 10) {
      return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return item.product.name.toLowerCase().includes(query) ||
             item.branch.name.toLowerCase().includes(query)
    }
    return true
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Productos con alertas (stock bajo o agotado)
  const alertProducts = inventory
    .filter(i => i.available < 10)
    .sort((a, b) => a.available - b.available)
    .slice(0, 5)

  if (isLoading && inventory.length === 0) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>)}
          </div>
          <div className="bg-white rounded-xl h-96"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Warehouse className="h-8 w-8 text-amber-600" />
            Inventario
          </h1>
          <p className="text-gray-500 mt-1">Gestión y control de stock por sucursal</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshInventory}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProducts}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Stock Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalQuantity.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Stock Bajo</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.lowStockCount}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Sin Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStockCount}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas + Stock por Sucursal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <Link 
              href="/admin/inventario/movimiento"
              className="flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors group"
            >
              <div className="h-10 w-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-amber-700">Nuevo Movimiento</p>
                <p className="text-sm text-gray-500">Entrada, salida o transferencia</p>
              </div>
            </Link>
            <Link 
              href="/admin/inventario/movimiento?tipo=ENTRADA"
              className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-green-700">Registrar Entrada</p>
                <p className="text-sm text-gray-500">Agregar stock a sucursal</p>
              </div>
            </Link>
            <Link 
              href="/admin/inventario/movimiento?tipo=TRANSFERENCIA"
              className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-blue-700">Transferir Stock</p>
                <p className="text-sm text-gray-500">Entre sucursales</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Stock por Sucursal */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock por Sucursal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.byBranch.map(branch => (
              <div 
                key={branch.branchId}
                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedBranch(branch.branchSlug)
                  setShowTable(true)
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{branch.branchName}</p>
                    <p className="text-sm text-gray-500">{branch.totalQuantity.toLocaleString()} unidades</p>
                  </div>
                  {branch.lowStockCount > 0 && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      {branch.lowStockCount} alertas
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas de Stock */}
      {alertProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas de Stock
            </h3>
            <button
              onClick={() => {
                setShowLowStock(true)
                setShowTable(true)
              }}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Ver todos
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {alertProducts.map(item => (
              <div 
                key={`${item.product.id}-${item.branch.id}`}
                className={`p-3 rounded-lg border ${
                  item.available === 0 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <p className="font-medium text-gray-900 text-sm truncate">{item.product.name}</p>
                <p className="text-xs text-gray-500">{item.branch.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    item.available === 0 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.available === 0 ? 'Agotado' : `${item.available} disp.`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de Inventario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toggle y Filtros */}
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={() => setShowTable(!showTable)}
            className="flex items-center gap-2 text-gray-700 font-medium hover:text-gray-900"
          >
            {showTable ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            <Eye className="h-5 w-5" />
            {showTable ? 'Ocultar detalle completo' : 'Ver detalle completo'}
          </button>
        </div>

        {showTable && (
          <>
            {/* Filtros */}
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <div className="flex flex-wrap items-center gap-4">
                {/* Búsqueda */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>

                {/* Filtro por sucursal */}
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="all">Todas las sucursales</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.slug}>{branch.name}</option>
                  ))}
                </select>

                {/* Toggle stock bajo */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLowStock}
                    onChange={(e) => setShowLowStock(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-600">Solo stock bajo</span>
                </label>

                {/* Contador */}
                <div className="text-sm text-gray-500">
                  {filteredInventory.length} de {inventory.length} registros
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">
                      <div className="flex items-center gap-2">
                        Producto
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Sucursal</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-600 text-sm">Cantidad</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-600 text-sm">Reservado</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-600 text-sm">Disponible</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Actualizado</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-600 text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No se encontraron registros de inventario</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item, index) => {
                      const isLowStock = item.available < 10
                      const isOutOfStock = item.available === 0
                      
                      return (
                        <tr 
                          key={`${item.product.id}-${item.branch.id}`}
                          className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? '' : 'bg-gray-50/50'}`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Package className="h-5 w-5 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{item.product.name}</p>
                                <p className="text-xs text-gray-400">{item.product.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.branch.name}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center font-medium text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="py-4 px-6 text-center text-gray-500">
                            {item.reserved}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${
                              isOutOfStock 
                                ? 'bg-red-100 text-red-800' 
                                : isLowStock 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {item.available}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-500">
                            {formatDate(item.updatedAt)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <Link
                              href={`/admin/inventario/movimiento?producto=${item.product.slug}&sucursal=${item.branch.slug}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-medium text-sm"
                            >
                              <Plus className="h-4 w-4" />
                              Movimiento
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
