"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft,
  Package, 
  RefreshCw, 
  Plus, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Truck,
  Factory,
  AlertCircle,
  Check,
  Save
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
import { Button } from "@/components/ui/button"

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
  bgColor: string
  description: string
  requiresFromBranch: boolean
  requiresToBranch: boolean
}> = {
  PRODUCCION: {
    label: "Producción",
    icon: <Factory className="h-5 w-5" />,
    color: "text-green-700",
    bgColor: "bg-green-100",
    description: "Producto fabricado o producido internamente",
    requiresFromBranch: false,
    requiresToBranch: true
  },
  COMPRA: {
    label: "Compra",
    icon: <Truck className="h-5 w-5" />,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    description: "Compra a proveedor externo",
    requiresFromBranch: false,
    requiresToBranch: true
  },
  VENTA: {
    label: "Venta",
    icon: <TrendingDown className="h-5 w-5" />,
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    description: "Venta a cliente (reducción de stock)",
    requiresFromBranch: true,
    requiresToBranch: false
  },
  MERMA: {
    label: "Merma",
    icon: <AlertCircle className="h-5 w-5" />,
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    description: "Producto dañado, caducado o defectuoso",
    requiresFromBranch: true,
    requiresToBranch: false
  },
  PERDIDA_ROBO: {
    label: "Pérdida / Robo",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-red-700",
    bgColor: "bg-red-100",
    description: "Producto perdido o robado",
    requiresFromBranch: true,
    requiresToBranch: false
  },
  TRANSFERENCIA: {
    label: "Transferencia",
    icon: <ArrowRightLeft className="h-5 w-5" />,
    color: "text-indigo-700",
    bgColor: "bg-indigo-100",
    description: "Mover stock entre sucursales",
    requiresFromBranch: true,
    requiresToBranch: true
  },
  SOBRANTE: {
    label: "Sobrante",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "text-teal-700",
    bgColor: "bg-teal-100",
    description: "Ajuste positivo de inventario",
    requiresFromBranch: false,
    requiresToBranch: true
  }
}

function MovimientoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productSlug = searchParams.get("producto")
  const branchSlug = searchParams.get("sucursal")
  
  const { user } = useAuth()

  // Estados
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Formulario
  const [selectedProduct, setSelectedProduct] = useState<string>(productSlug || "")
  const [movementType, setMovementType] = useState<StockMovementType>("PRODUCCION")
  const [movementQuantity, setMovementQuantity] = useState<number>(1)
  const [movementFromBranch, setMovementFromBranch] = useState<string>(branchSlug || "")
  const [movementToBranch, setMovementToBranch] = useState<string>(branchSlug || "")
  const [movementNote, setMovementNote] = useState("")
  const [movementReference, setMovementReference] = useState("")
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Stock actual del producto seleccionado en la sucursal
  const currentStock = inventory.find(
    item => item.product.slug === selectedProduct && 
    (item.branch.slug === movementFromBranch || item.branch.slug === movementToBranch)
  )

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [branchesData, productsData, inventoryData] = await Promise.all([
          branchesService.list(),
          productsService.list({ pageSize: 200 }),
          inventoryService.list()
        ])
        setBranches(branchesData)
        setProducts(productsData.data || productsData)
        setInventory(inventoryData)
      } catch (err) {
        console.error("Error loading data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Auto-seleccionar sucursales según el tipo
  useEffect(() => {
    const config = MOVEMENT_TYPES[movementType]
    if (config.requiresFromBranch && !config.requiresToBranch) {
      setMovementToBranch("")
    } else if (config.requiresToBranch && !config.requiresFromBranch) {
      setMovementFromBranch("")
    }
  }, [movementType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const typeConfig = MOVEMENT_TYPES[movementType]
    
    // Validaciones
    if (!selectedProduct) {
      setSubmitError("Debe seleccionar un producto")
      return
    }
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
        productSlug: selectedProduct,
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
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push("/admin/inventario")
      }, 2000)
    } catch (err: any) {
      console.error("Error creating movement:", err)
      setSubmitError(err.message || "Error al registrar el movimiento")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="bg-white rounded-xl h-[600px]"></div>
        </div>
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">¡Movimiento registrado!</h2>
            <p className="text-gray-500 mb-6">El inventario ha sido actualizado correctamente.</p>
            <p className="text-sm text-gray-400">Redirigiendo al inventario...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/inventario"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inventario
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Movimiento de Stock</h1>
        <p className="text-gray-500 mt-1">Complete el formulario para registrar un movimiento de inventario</p>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Producto */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              Producto
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar producto *
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-base"
                  required
                >
                  <option value="">-- Seleccionar producto --</option>
                  {products.map(product => (
                    <option key={product.id} value={product.slug}>{product.name}</option>
                  ))}
                </select>
              </div>

              {currentStock && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Stock actual:</span>{" "}
                    <span className="text-lg font-bold">{currentStock.available}</span> unidades disponibles
                    {currentStock.reserved > 0 && (
                      <span className="text-amber-600"> ({currentStock.reserved} reservadas)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tipo de movimiento */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tipo de movimiento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.entries(MOVEMENT_TYPES) as [StockMovementType, typeof MOVEMENT_TYPES[StockMovementType]][])
                .filter(([type]) => type !== 'VENTA') // VENTA se registra automáticamente con órdenes
                .map(([type, config]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMovementType(type)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      movementType === type 
                        ? 'border-amber-500 bg-amber-50 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`p-2 rounded-lg ${config.bgColor} ${config.color}`}>
                      {config.icon}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{config.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                    </div>
                  </button>
                ))
              }
            </div>
          </div>

          {/* Cantidad y sucursales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Detalles del movimiento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="1"
                  value={movementQuantity}
                  onChange={(e) => setMovementQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg font-semibold"
                  required
                />
              </div>

              {/* Sucursal origen */}
              {MOVEMENT_TYPES[movementType].requiresFromBranch && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sucursal origen *
                  </label>
                  <select
                    value={movementFromBranch}
                    onChange={(e) => setMovementFromBranch(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.slug}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sucursal destino */}
              {MOVEMENT_TYPES[movementType].requiresToBranch && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {movementType === 'TRANSFERENCIA' ? 'Sucursal destino *' : 'Sucursal *'}
                  </label>
                  <select
                    value={movementToBranch}
                    onChange={(e) => setMovementToBranch(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {branches
                      .filter(b => movementType !== 'TRANSFERENCIA' || b.slug !== movementFromBranch)
                      .map(branch => (
                        <option key={branch.id} value={branch.slug}>{branch.name}</option>
                      ))
                    }
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información adicional
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="text-xs text-gray-400 mt-1">Número de factura, orden de compra, etc.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nota (opcional)
                </label>
                <textarea
                  value={movementNote}
                  onChange={(e) => setMovementNote(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link href="/admin/inventario">
              <Button type="button" variant="outline" size="lg">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              size="lg"
              disabled={isSubmitting}
              className="min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Registrando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Registrar Movimiento
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MovimientoPage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="bg-white rounded-xl h-[600px]"></div>
        </div>
      </div>
    }>
      <MovimientoForm />
    </Suspense>
  )
}
