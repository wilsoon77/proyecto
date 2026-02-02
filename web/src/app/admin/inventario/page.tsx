"use client"

import { useEffect, useState, useCallback } from "react"
import { 
  Package, 
  Filter, 
  RefreshCw, 
  Plus, 
  ArrowUpDown,
  Search,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Truck,
  Factory,
  AlertCircle,
  Check
} from "lucide-react"
import { 
  inventoryService, 
  branchesService, 
  productsService,
  type InventoryItem,
  type StockMovementType,
  type CreateStockMovementData
} from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

interface Branch {
  id: number
  name: string
  slug: string
}

interface Product {
  id: number
  name: string
  slug: string
}

// Tipos de movimiento con sus configuraciones
const MOVEMENT_TYPES: Record<StockMovementType, {
  label: string
  icon: React.ReactNode
  color: string
  description: string
  requiresFromBranch: boolean
  requiresToBranch: boolean
}> = {
  PRODUCCION: {
    label: "Producción",
    icon: <Factory className="h-4 w-4" />,
    color: "bg-green-100 text-green-800",
    description: "Producto fabricado/producido",
    requiresFromBranch: false,
    requiresToBranch: true
  },
  COMPRA: {
    label: "Compra",
    icon: <Truck className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-800",
    description: "Compra a proveedor",
    requiresFromBranch: false,
    requiresToBranch: true
  },
  VENTA: {
    label: "Venta",
    icon: <TrendingDown className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-800",
    description: "Venta a cliente (reducción de stock)",
    requiresFromBranch: true,
    requiresToBranch: false
  },
  MERMA: {
    label: "Merma",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "bg-orange-100 text-orange-800",
    description: "Producto dañado/caducado",
    requiresFromBranch: true,
    requiresToBranch: false
  },
  PERDIDA_ROBO: {
    label: "Pérdida/Robo",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-red-100 text-red-800",
    description: "Producto perdido o robado",
    requiresFromBranch: true,
    requiresToBranch: false
  },
  TRANSFERENCIA: {
    label: "Transferencia",
    icon: <ArrowRightLeft className="h-4 w-4" />,
    color: "bg-indigo-100 text-indigo-800",
    description: "Mover entre sucursales",
    requiresFromBranch: true,
    requiresToBranch: true
  },
  SOBRANTE: {
    label: "Sobrante",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "bg-teal-100 text-teal-800",
    description: "Ajuste positivo de inventario",
    requiresFromBranch: false,
    requiresToBranch: true
  }
}

export default function InventarioPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"

  // Estados principales
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showLowStock, setShowLowStock] = useState(false)

  // Modal de movimiento
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null)
  const [movementType, setMovementType] = useState<StockMovementType>("PRODUCCION")
  const [movementQuantity, setMovementQuantity] = useState<number>(1)
  const [movementFromBranch, setMovementFromBranch] = useState<string>("")
  const [movementToBranch, setMovementToBranch] = useState<string>("")
  const [movementNote, setMovementNote] = useState("")
  const [movementReference, setMovementReference] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [inventoryData, branchesData, productsData] = await Promise.all([
          inventoryService.list(),
          branchesService.list(),
          productsService.list({ pageSize: 100 })
        ])
        setInventory(inventoryData)
        setBranches(branchesData)
        setProducts(productsData.data || productsData)
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

  // Abrir modal para un item específico
  const openMovementModal = (item?: InventoryItem) => {
    setSelectedInventoryItem(item || null)
    setMovementType("PRODUCCION")
    setMovementQuantity(1)
    setMovementFromBranch(item?.branch.slug || "")
    setMovementToBranch(item?.branch.slug || "")
    setMovementNote("")
    setMovementReference("")
    setSubmitSuccess(false)
    setSubmitError(null)
    setIsModalOpen(true)
  }

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedInventoryItem(null)
    setSubmitSuccess(false)
    setSubmitError(null)
  }

  // Enviar movimiento
  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInventoryItem) return

    const typeConfig = MOVEMENT_TYPES[movementType]
    
    // Validaciones
    if (typeConfig.requiresFromBranch && !movementFromBranch) {
      setSubmitError("Debe seleccionar la sucursal de origen")
      return
    }
    if (typeConfig.requiresToBranch && !movementToBranch) {
      setSubmitError("Debe seleccionar la sucursal de destino")
      return
    }
    if (movementQuantity <= 0) {
      setSubmitError("La cantidad debe ser mayor a 0")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const data: CreateStockMovementData = {
        type: movementType,
        quantity: movementQuantity,
        productSlug: selectedInventoryItem.product.slug,
        note: movementNote || undefined,
        referenceId: movementReference || undefined,
      }

      if (typeConfig.requiresFromBranch) {
        data.fromBranchSlug = movementFromBranch
      }
      if (typeConfig.requiresToBranch) {
        data.toBranchSlug = movementToBranch
      }

      await inventoryService.createMovement(data)
      setSubmitSuccess(true)
      
      // Recargar inventario después de 1 segundo
      setTimeout(async () => {
        await refreshInventory()
        closeModal()
      }, 1500)
    } catch (err: any) {
      console.error("Error creating movement:", err)
      setSubmitError(err.message || "Error al registrar el movimiento")
    } finally {
      setIsSubmitting(false)
    }
  }

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
                        <button
                          onClick={() => openMovementModal(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-medium text-sm"
                        >
                          <Plus className="h-4 w-4" />
                          Movimiento
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Movimiento de Stock */}
      {isModalOpen && selectedInventoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={closeModal}
          />
          
          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Registrar Movimiento</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedInventoryItem.product.name} • {selectedInventoryItem.branch.name}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success/Error state */}
            {submitSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Movimiento registrado!</h3>
                <p className="text-gray-500">El inventario se actualizará en un momento...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitMovement}>
                <div className="p-6 space-y-5">
                  {/* Tipo de movimiento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de movimiento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(MOVEMENT_TYPES) as [StockMovementType, typeof MOVEMENT_TYPES[StockMovementType]][])
                        .filter(([type]) => type !== 'VENTA') // VENTA se registra automáticamente con órdenes
                        .map(([type, config]) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setMovementType(type)
                              // Auto-llenar sucursales según el tipo
                              if (config.requiresFromBranch && !config.requiresToBranch) {
                                setMovementFromBranch(selectedInventoryItem.branch.slug)
                                setMovementToBranch("")
                              } else if (config.requiresToBranch && !config.requiresFromBranch) {
                                setMovementToBranch(selectedInventoryItem.branch.slug)
                                setMovementFromBranch("")
                              } else if (type === 'TRANSFERENCIA') {
                                setMovementFromBranch(selectedInventoryItem.branch.slug)
                                setMovementToBranch("")
                              }
                            }}
                            className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all ${
                              movementType === type 
                                ? 'border-amber-500 bg-amber-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className={`p-1.5 rounded ${config.color}`}>
                              {config.icon}
                            </span>
                            <div>
                              <p className="font-medium text-sm text-gray-900">{config.label}</p>
                              <p className="text-xs text-gray-500">{config.description}</p>
                            </div>
                          </button>
                        ))
                      }
                    </div>
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={movementQuantity}
                      onChange={(e) => setMovementQuantity(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg font-medium"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Stock actual disponible: <span className="font-semibold">{selectedInventoryItem.available}</span>
                    </p>
                  </div>

                  {/* Sucursal origen (si aplica) */}
                  {MOVEMENT_TYPES[movementType].requiresFromBranch && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sucursal origen
                      </label>
                      <select
                        value={movementFromBranch}
                        onChange={(e) => setMovementFromBranch(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      >
                        <option value="">Seleccionar sucursal</option>
                        {branches.map(branch => (
                          <option key={branch.id} value={branch.slug}>{branch.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sucursal destino (si aplica) */}
                  {MOVEMENT_TYPES[movementType].requiresToBranch && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {movementType === 'TRANSFERENCIA' ? 'Sucursal destino' : 'Sucursal'}
                      </label>
                      <select
                        value={movementToBranch}
                        onChange={(e) => setMovementToBranch(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      >
                        <option value="">Seleccionar sucursal</option>
                        {branches
                          .filter(b => movementType !== 'TRANSFERENCIA' || b.slug !== movementFromBranch)
                          .map(branch => (
                            <option key={branch.id} value={branch.slug}>{branch.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  )}

                  {/* Referencia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Referencia (opcional)
                    </label>
                    <input
                      type="text"
                      value={movementReference}
                      onChange={(e) => setMovementReference(e.target.value)}
                      placeholder="Ej: FAC-12345, Lote-A001"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Nota */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nota (opcional)
                    </label>
                    <textarea
                      value={movementNote}
                      onChange={(e) => setMovementNote(e.target.value)}
                      placeholder="Observaciones adicionales..."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>

                  {/* Error */}
                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      {submitError}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Registrar Movimiento
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
