"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { 
  Package, 
  Filter, 
  RefreshCw, 
  Plus, 
  ArrowUpDown,
  Search,
  AlertTriangle
} from "lucide-react"
import { 
  inventoryService, 
  branchesService,
  type InventoryItem
} from "@/lib/api"
import { Button } from "@/components/ui/button"

interface Branch {
  id: number
  name: string
  slug: string
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
    // Filtro por sucursal
    if (selectedBranch !== "all" && item.branch.slug !== selectedBranch) {
      return false
    }
    // Filtro de stock bajo (< 10)
    if (showLowStock && item.available >= 10) {
      return false
    }
    // Filtro por búsqueda
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

  if (isLoading && inventory.length === 0) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="bg-white rounded-xl h-96"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-500 mt-1">Gestión de stock por sucursal</p>
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
          <Link href="/admin/inventario/movimiento">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Movimiento
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Búsqueda */}
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

          {/* Filtro por sucursal */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Todas las sucursales</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.slug}>{branch.name}</option>
              ))}
            </select>
          </div>

          {/* Toggle stock bajo */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
            />
            <span className="text-sm text-gray-600">Solo stock bajo (&lt;10)</span>
          </label>

          {/* Contador */}
          <div className="text-sm text-gray-500">
            {filteredInventory.length} de {inventory.length} registros
          </div>
        </div>
      </div>

      {/* Tabla de inventario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
      </div>
    </div>
  )
}
