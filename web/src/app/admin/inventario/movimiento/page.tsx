"use client"

import { useEffect, useState, Suspense, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package, RefreshCw, Plus, TriangleAlert as AlertTriangle, TrendingUp, TrendingDown, ArrowRightLeft, Truck, Factory, CircleAlert as AlertCircle, Check, Save } from "lucide-react"
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
import { useToast } from "@/components/ui/toast"


interface Branch {
  id: number
  name: string
  slug: string
}

interface Product {
  id: number
  name: string
  slug: string
  category?: string
  categorySlug?: string
  origin?: 'PRODUCIDO' | 'COMPRADO'
  tracksExpiration?: boolean
  expirationAlertDays?: number
}

function getProductUnit(product?: Product | null): string {
  if (!product) return "unidades"
  const category = (product.categorySlug || product.category || "").toLowerCase()
  const name = (product.name || "").toLowerCase()
  const slug = (product.slug || "").toLowerCase()
  if (
    category.includes("bebida") ||
    category.includes("cafeteria") ||
    name.includes("bebida") ||
    name.includes("café") ||
    name.includes("cafe")
  ) {
    if (name.includes("ml") || slug.includes("ml")) {
      const match = name.match(/(\d+)\s*ml/)
      return match ? `${match[1]} ml` : "ml"
    }
    if (name.includes("litro") || name.includes("lt")) {
      return "L"
    }
    return "unidades"
  }
  return "unidades"
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
    color: "text-success",
    bgColor: "bg-success/10",
    description: "Producto fabricado o producido internamente",
    requiresFromBranch: false,
    requiresToBranch: true
  },
  COMPRA: {
    label: "Compra",
    icon: <Truck className="h-5 w-5" />,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
    description: "Compra a proveedor externo",
    requiresFromBranch: false,
    requiresToBranch: true
  },
  VENTA: {
    label: "Venta",
    icon: <TrendingDown className="h-5 w-5" />,
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
    description: "Venta a cliente (reducción de stock)",
    requiresFromBranch: true,
    requiresToBranch: false
  },
  MERMA: {
    label: "Merma",
    icon: <AlertCircle className="h-5 w-5" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
    description: "Producto dañado, caducado o defectuoso",
    requiresFromBranch: true,
    requiresToBranch: false
  },
  PERDIDA_ROBO: {
    label: "Pérdida / Robo",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
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
  const requestedExpirationDate = searchParams.get("caducidad") || ""
  
  const { user } = useAuth()
  const { showToast } = useToast()
  const submitAndKeepOpenRef = useRef(false)

  // Estados
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [productSearch, setProductSearch] = useState("")
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Combobox
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const comboboxRef = useRef<HTMLDivElement>(null)

  // Formulario
  const [selectedProduct, setSelectedProduct] = useState<string>(productSlug || "")
  const [movementType, setMovementType] = useState<StockMovementType>("PRODUCCION")
  const [movementQuantity, setMovementQuantity] = useState<number>(1)
  const [movementFromBranch, setMovementFromBranch] = useState<string>(branchSlug || "")
  const [movementToBranch, setMovementToBranch] = useState<string>(branchSlug || "")
  const [movementNote, setMovementNote] = useState("")
  const [movementReference, setMovementReference] = useState("")
  const [movementExpiresAt, setMovementExpiresAt] = useState(requestedExpirationDate)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const canSelectAnyBranch = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  // Stock actual del producto seleccionado en la sucursal
  const currentStock = inventory.find(
    item => item.product.slug === selectedProduct && 
    (item.branch.slug === movementFromBranch || item.branch.slug === movementToBranch)
  )

  const currentProduct = products.find(p => p.slug === selectedProduct)
  const requiresExpirationDate = movementType === 'COMPRA' &&
    currentProduct?.origin === 'COMPRADO' &&
    currentProduct?.tracksExpiration === true

  const calculatedAlertDate = movementExpiresAt && currentProduct?.expirationAlertDays !== undefined
    ? (() => {
        const date = new Date(`${movementExpiresAt}T00:00:00Z`)
        date.setUTCDate(date.getUTCDate() - Math.max(0, currentProduct.expirationAlertDays || 0))
        return date.toISOString().slice(0, 10)
      })()
    : ""

  useEffect(() => {
    // Mientras el producto aún se carga no debemos borrar la fecha recibida
    // desde el alta del producto.
    if (selectedProduct && currentProduct && !requiresExpirationDate) {
      setMovementExpiresAt("")
    }
  }, [selectedProduct, currentProduct, requiresExpirationDate])

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [branchesData, productsData, inventoryData] = await Promise.all([
          branchesService.list(),
          productsService.list({ pageSize: 20 }),
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

  // click-outside for combobox
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Sync URL productSlug with productSearch on mount
  useEffect(() => {
    if (productSlug) {
      setSelectedProduct(productSlug)
      setProductSearch(productSlug)
    }
  }, [productSlug])

  useEffect(() => {
    const requestedType = searchParams.get("tipo") as StockMovementType | null
    if (requestedType && requestedType in MOVEMENT_TYPES && requestedType !== 'VENTA') {
      setMovementType(requestedType)
    }
  }, [searchParams])

  useEffect(() => {
    if (
      requestedExpirationDate &&
      selectedProduct === productSlug &&
      currentProduct?.origin === 'COMPRADO' &&
      currentProduct.tracksExpiration === true &&
      movementType === 'COMPRA'
    ) {
      setMovementExpiresAt(requestedExpirationDate)
    }
  }, [requestedExpirationDate, productSlug, selectedProduct, currentProduct, movementType])

  useEffect(() => {
    if (productSlug && products.length > 0) {
      const match = products.find(p => p.slug === productSlug)
      if (match) {
        setProductSearch(match.name)
      }
    }
  }, [productSlug, products])

  useEffect(() => {
    const fetchSelectedProductIfNeeded = async () => {
      if (!selectedProduct) return
      const alreadyFetched = products.find(p => p.slug === selectedProduct)
      if (!alreadyFetched) {
        try {
          const productData = await productsService.getBySlug(selectedProduct)
          if (productData) {
            setProducts(prev => {
              if (prev.some(p => p.id === productData.id)) return prev
              return [...prev, productData]
            })
            setProductSearch(productData.name)
          }
        } catch (err) {
          console.error("Error fetching selected product:", err)
        }
      }
    }
    fetchSelectedProductIfNeeded()
  }, [selectedProduct, products])

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product.slug)
    setProductSearch(product.name)
    setIsDropdownOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    handleProductSearchChange(value)
    if (!value) {
      setSelectedProduct("")
    }
    setIsDropdownOpen(true)
  }

  // Búsqueda de productos con debounce
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) return
    setIsSearchingProducts(true)
    try {
      const response = await productsService.list({ search: query, pageSize: 20 })
      setProducts(prev => {
        const existingIds = new Set(prev.map(p => p.id))
        const newProducts = (response.data || response).filter((p: Product) => !existingIds.has(p.id))
        return [...prev, ...newProducts]
      })
    } catch (err) {
      console.error("Error searching products:", err)
    } finally {
      setIsSearchingProducts(false)
    }
  }, [])

  const handleProductSearchChange = useCallback((value: string) => {
    setProductSearch(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => searchProducts(value), 400)
    }
  }, [searchProducts])

  // Auto-seleccionar sucursales según el tipo y rol
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
    if (requiresExpirationDate && !movementExpiresAt) {
      setSubmitError("Debe indicar la fecha de caducidad de este producto comprado")
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
        expiresAt: requiresExpirationDate ? movementExpiresAt : undefined,
        alertAt: requiresExpirationDate ? calculatedAlertDate || undefined : undefined,
      }

      if (typeConfig.requiresFromBranch) {
        data.fromBranchSlug = movementFromBranch
      }
      if (typeConfig.requiresToBranch) {
        data.toBranchSlug = movementToBranch
      }

      await inventoryService.createMovement(data)
      
      if (submitAndKeepOpenRef.current) {
        showToast("Movimiento registrado con éxito", "success")
        setSelectedProduct("")
        setProductSearch("")
        setMovementQuantity(1)
        setMovementNote("")
        setMovementReference("")
        setMovementExpiresAt("")
      } else {
        setSubmitSuccess(true)
        setTimeout(() => {
          router.push("/admin/inventario")
        }, 2000)
      }
    } catch (err) {
      console.error("Error creating movement:", err)
      const message = err instanceof Error ? err.message : "Error al registrar el movimiento"
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-border rounded w-64"></div>
          <div className="bg-card rounded-xl h-[600px]"></div>
        </div>
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">¡Movimiento registrado!</h2>
            <p className="text-muted-foreground mb-6">El inventario ha sido actualizado correctamente.</p>
            <p className="text-sm text-muted-foreground/60">Redirigiendo al inventario...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-cream min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/inventario"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inventario
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Registrar Movimiento de Stock</h1>
        <p className="text-muted-foreground mt-1">Complete el formulario para registrar un movimiento de inventario</p>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Producto */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Producto
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Seleccionar producto *
                </label>
                <div ref={comboboxRef} className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={handleInputChange}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Escribe para buscar un producto..."
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base"
                    required
                  />
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isSearchingProducts && (
                        <div className="px-4 py-2 text-sm text-muted-foreground/60">Buscando productos...</div>
                      )}
                      {products.filter(p => 
                        !productSearch.trim() || 
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.slug.toLowerCase().includes(productSearch.toLowerCase())
                      ).length === 0 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">No se encontraron productos</div>
                      ) : (
                        products
                          .filter(p => 
                            !productSearch.trim() || 
                            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                            p.slug.toLowerCase().includes(productSearch.toLowerCase())
                          )
                          .map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleSelectProduct(product)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-primary transition-colors flex items-center justify-between ${
                                selectedProduct === product.slug ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                              }`}
                            >
                              <span>{product.name}</span>
                              {selectedProduct === product.slug && <Check className="h-4 w-4 text-primary" />}
                            </button>
                          ))
                      )}
                    </div>
                  )}
                </div>
                <input type="hidden" name="selectedProduct" value={selectedProduct} required />
              </div>

              {currentStock && (
                <div className="p-4 bg-accent rounded-lg border border-primary/20">
                  <p className="text-sm text-primary">
                    <span className="font-medium">Stock actual:</span>{" "}
                    <span className="text-lg font-bold">{currentStock.available}</span> {getProductUnit(currentProduct)} disponibles
                    {currentStock.reserved > 0 && (
                      <span className="text-primary"> ({currentStock.reserved} reservadas)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tipo de movimiento */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
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
                        ? 'border-primary bg-accent shadow-sm' 
                        : 'border-border hover:border-input hover:bg-cream'
                    }`}
                  >
                    <span className={`p-2 rounded-lg ${config.bgColor} ${config.color}`}>
                      {config.icon}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{config.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                    </div>
                  </button>
                ))
              }
            </div>
          </div>

          {/* Cantidad y sucursales */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Detalles del movimiento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cantidad *
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    value={movementQuantity}
                    onChange={(e) => setMovementQuantity(parseInt(e.target.value) || 0)}
                    className="w-full pr-24 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg font-semibold"
                    required
                  />
                  <div className="absolute right-3 px-3 py-1 bg-muted text-muted-foreground rounded text-sm font-medium border border-border">
                    {getProductUnit(currentProduct)}
                  </div>
                </div>
              </div>

              {/* Sucursal origen */}
              {MOVEMENT_TYPES[movementType].requiresFromBranch && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sucursal origen *
                  </label>
                  <select
                    value={movementFromBranch}
                    onChange={(e) => setMovementFromBranch(e.target.value)}
                    disabled={!canSelectAnyBranch}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:text-muted-foreground"
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {movementType === 'TRANSFERENCIA' ? 'Sucursal destino *' : 'Sucursal *'}
                  </label>
                  <select
                    value={movementToBranch}
                    onChange={(e) => setMovementToBranch(e.target.value)}
                    disabled={!canSelectAnyBranch}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:text-muted-foreground"
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

              {requiresExpirationDate && (
                <div className="md:col-span-2 rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Caducidad del lote</p>
                      <p className="text-xs text-muted-foreground">Solo se solicita para productos comprados configurados con caducidad.</p>
                    </div>
                    <span className="text-xs font-medium rounded-full bg-primary/10 text-primary px-2 py-1">Compra</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Fecha de caducidad *</label>
                      <input
                        type="date"
                        value={movementExpiresAt}
                        onChange={(e) => setMovementExpiresAt(e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Fecha de alerta</label>
                      <input
                        type="date"
                        value={calculatedAlertDate}
                        readOnly
                        className="w-full px-4 py-3 border border-border rounded-lg bg-muted text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Se calcula con {currentProduct?.expirationAlertDays ?? 3} día(s) de anticipación.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Información adicional
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Referencia (opcional)
                </label>
                <input
                  type="text"
                  value={movementReference}
                  onChange={(e) => setMovementReference(e.target.value)}
                  placeholder="Ej: FAC-12345, Lote-A001"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground/60 mt-1">Número de factura, orden de compra, etc.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nota (opcional)
                </label>
                <textarea
                  value={movementNote}
                  onChange={(e) => setMovementNote(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive flex items-center gap-3">
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
              variant="secondary"
              size="lg"
              disabled={isSubmitting}
              onClick={() => { submitAndKeepOpenRef.current = true }}
            >
              {isSubmitting && submitAndKeepOpenRef.current ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Registrando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar y agregar otro
                </>
              )}
            </Button>
            <Button 
              type="submit" 
              size="lg"
              disabled={isSubmitting}
              onClick={() => { submitAndKeepOpenRef.current = false }}
              className="min-w-[200px]"
            >
              {isSubmitting && !submitAndKeepOpenRef.current ? (
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
          <div className="h-8 bg-border rounded w-64"></div>
          <div className="bg-card rounded-xl h-[600px]"></div>
        </div>
      </div>
    }>
      <MovimientoForm />
    </Suspense>
  )
}
