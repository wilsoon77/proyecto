"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { 
  Package, 
  RefreshCw, 
  Plus, 
  Search,
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Warehouse
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  inventoryService, 
  branchesService,
  type InventoryItem
} from "@/lib/api"
import { formatDateString } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"

interface Branch {
  id: number
  name: string
  slug: string
}

export default function ProductosInventarioPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showLowStock, setShowLowStock] = useState(false)

  // Paginación
  const ITEMS_PER_PAGE = 10
  const [currentPage, setCurrentPage] = useState(1)

  const { showToast } = useToast()

  // Cargar datos
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [inventoryData, branchesData] = await Promise.all([
        inventoryService.list(),
        branchesService.list()
      ])
      setInventory(inventoryData)
      setBranches(branchesData)
      setError(null)
    } catch (err) {
      console.error("Error loading finished products:", err)
      setError("Error al cargar el inventario de productos")
      showToast("Error al cargar los datos del inventario", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtrar inventario
  const filteredInventory = useMemo(() => inventory.filter(item => {
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
  }), [inventory, selectedBranch, showLowStock, searchQuery])

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedBranch, searchQuery, showLowStock])

  // Paginación del inventario
  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE)
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const formatDate = (dateStr: string) => formatDateString(dateStr, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/admin/inventario" className="hover:text-amber-600 transition-colors flex items-center gap-1">
            <Warehouse className="h-3.5 w-3.5" />
            Inventario
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Productos</span>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600" />
              Productos Terminados
            </h1>
            <p className="text-gray-500 mt-1">Detalle de existencias de pan y repostería por sucursal</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 w-full sm:w-auto justify-center shadow-sm text-sm font-medium"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <Link
              href="/admin/inventario/movimiento"
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors w-full sm:w-auto justify-center shadow-sm text-sm font-bold"
            >
              <Plus className="h-4 w-4" />
              Nuevo Movimiento
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Tabla e info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filtros */}
        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            {/* Búsqueda */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
              />
            </div>

            {/* Filtro por sucursal */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
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
              <span className="text-sm text-gray-600">
                Solo stock bajo
              </span>
            </label>

            {/* Contador */}
            <div className="text-sm text-gray-500 ml-auto font-medium">
              {filteredInventory.length} de {inventory.length} registros
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-gray-400">
            <RefreshCw className="h-10 w-10 animate-spin text-amber-600 mx-auto mb-3" />
            <p>Cargando inventario de productos...</p>
          </div>
        ) : (
          <>
            {/* Vista Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginatedInventory.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No se encontraron registros de inventario</p>
                </div>
              ) : (
                paginatedInventory.map((item) => {
                  const isLowStock = item.available < 10
                  const isOutOfStock = item.available === 0
                  return (
                    <div key={`m-${item.product.id}-${item.branch.id}`} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              {item.branch.name}
                            </span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${
                          isOutOfStock 
                            ? 'bg-red-100 text-red-800' 
                            : isLowStock 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {item.available} disp.
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>Cant: <strong className="text-gray-900">{item.quantity}</strong></span>
                          <span>Res: <strong className="text-gray-900">{item.reserved}</strong></span>
                        </div>
                        <Link
                          href={`/admin/inventario/movimiento?producto=${item.product.slug}&sucursal=${item.branch.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-medium text-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Movimiento
                        </Link>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Vista Desktop Tabla */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Producto</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Sucursal</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-600 text-sm">Cantidad</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-600 text-sm hidden lg:table-cell">Reservado</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-600 text-sm">Disponible</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm hidden xl:table-cell">Actualizado</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-600 text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No se encontraron registros de inventario</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedInventory.map((item, index) => {
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
                          <td className="py-4 px-6 text-center text-gray-500 hidden lg:table-cell">
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
                          <td className="py-4 px-6 text-sm text-gray-500 hidden xl:table-cell">
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

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages} ({filteredInventory.length} registros)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
