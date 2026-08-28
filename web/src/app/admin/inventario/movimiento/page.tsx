"use client"

import { useEffect, useState, Suspense, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Package, 
  RefreshCw, 
  Plus, 
  TriangleAlert as AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  Truck, 
  Factory, 
  CircleAlert as AlertCircle, 
  Save,
  Search,
  X,
  Store,
  ShoppingBag,
  Croissant,
  Minus,
  Send
} from "lucide-react"
import { 
  inventoryService, 
  branchesService, 
  productsService,
  type ApiProduct,
  type InventoryItem,
  type StockMovementType,
  type CreateStockMovementData
} from "@/lib/api"
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
  expirationAlertDays?: number[]
}

// Tipos de movimiento individuales con sus configuraciones
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
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
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
    color: "text-rose-700",
    bgColor: "bg-rose-100",
    description: "Venta a cliente (reducción de stock)",
    requiresFromBranch: true,
    requiresToBranch: false
  },
  MERMA: {
    label: "Merma",
    icon: <AlertCircle className="h-5 w-5" />,
    color: "text-amber-700",
    bgColor: "bg-amber-100",
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

function subtractDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return ""
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

function MovimientoForm() {
  const searchParams = useSearchParams()
  const productSlug = searchParams.get("producto")
  const branchSlug = searchParams.get("sucursal")
  const requestedExpirationDate = searchParams.get("caducidad") || ""
  const requestedTypeParam = searchParams.get("tipo")
  const requestedMovementType = requestedTypeParam && Object.prototype.hasOwnProperty.call(MOVEMENT_TYPES, requestedTypeParam)
    ? requestedTypeParam as StockMovementType
    : null
  
  const { showToast } = useToast()

  // Modo de operación: Transferencia Multiproducto vs Movimiento Individual
  const [mainMode, setMainMode] = useState<"TRANSFER_BULK" | "INDIVIDUAL">(
    requestedMovementType && requestedMovementType !== "TRANSFERENCIA" ? "INDIVIDUAL" : "TRANSFER_BULK",
  )

  // Estados generales
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sourceInventory, setSourceInventory] = useState<InventoryItem[]>([])
  const [targetInventory, setTargetInventory] = useState<InventoryItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ----------------------------------------------------
  // ESTADOS PARA TRANSFERENCIA MULTIPRODUCTO
  // ----------------------------------------------------
  const [transferFromBranch, setTransferFromBranch] = useState<string>(branchSlug || "")
  const [transferToBranch, setTransferToBranch] = useState<string>("")
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, number>>({})
  const [transferSearch, setTransferSearch] = useState("")
  const [transferOriginFilter, setTransferOriginFilter] = useState<"ALL" | "PRODUCIDO" | "COMPRADO">("ALL")
  const [transferNote, setTransferNote] = useState("")
  const [transferReference, setTransferReference] = useState("")

  // ----------------------------------------------------
  // ESTADOS PARA MOVIMIENTO INDIVIDUAL
  // ----------------------------------------------------
  const [selectedProduct, setSelectedProduct] = useState<string>(productSlug || "")
  const [movementType, setMovementType] = useState<StockMovementType>(requestedMovementType ?? "PRODUCCION")
  const [movementQuantity, setMovementQuantity] = useState<number>(1)
  const [movementFromBranch, setMovementFromBranch] = useState<string>(branchSlug || "")
  const [movementToBranch, setMovementToBranch] = useState<string>(branchSlug || "")
  const [movementNote, setMovementNote] = useState("")
  const [movementReference, setMovementReference] = useState("")
  const [movementExpiresAt, setMovementExpiresAt] = useState(requestedExpirationDate)

  const selectedProductData = products.find((product) => product.slug === selectedProduct)
  const requiresExpirationDate = movementType === "COMPRA"
    && selectedProductData?.origin === "COMPRADO"
    && selectedProductData.tracksExpiration === true
  const configuredReminderDays = selectedProductData?.expirationAlertDays?.length
    ? selectedProductData.expirationAlertDays
    : [3]
  const calculatedAlertDate = movementExpiresAt
    ? subtractDays(movementExpiresAt, Math.max(...configuredReminderDays))
    : ""

  // Cargar datos maestros
  const loadData = useCallback(async () => {
    try {
      const loadAllAdminProducts = async () => {
        const pageSize = 100
        const firstPage = await productsService.listAdmin({ status: "all", page: 1, pageSize })
        if (firstPage.meta.pageCount <= 1) return firstPage.data

        const remainingPages = await Promise.all(
          Array.from({ length: firstPage.meta.pageCount - 1 }, (_, index) =>
            productsService.listAdmin({ status: "all", page: index + 2, pageSize }),
          ),
        )
        return [firstPage.data, ...remainingPages.map((page) => page.data)].flat()
      }

      const [branchesData, productsData] = await Promise.all([
        branchesService.list(),
        loadAllAdminProducts(),
      ])

      setBranches(branchesData)
      const mappedProducts: Product[] = productsData.map((p: ApiProduct) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        categorySlug: p.categorySlug,
        origin: p.origin ?? 'PRODUCIDO',
        tracksExpiration: p.tracksExpiration,
        expirationAlertDays: p.expirationAlertDays,
      }))
      setProducts(mappedProducts)

      if (branchesData.length > 0) {
        const defaultFrom = branchSlug || branchesData[0].slug
        const defaultTo = branchesData.length > 1 ? branchesData[1].slug : branchesData[0].slug
        setTransferFromBranch(defaultFrom)
        setTransferToBranch(defaultTo)
        setMovementFromBranch(defaultFrom)
        setMovementToBranch(defaultTo)
      }
    } catch (error) {
      console.error("Error cargando datos maestros:", error)
      showToast("Error cargando datos para movimientos", "error")
    }
  }, [branchSlug, showToast])

  useEffect(() => {
    // This effect intentionally starts the async master-data load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  // Cargar inventarios cuando cambian las sucursales de origen o destino
  useEffect(() => {
    if (!transferFromBranch) return
    let active = true

    inventoryService.list({ branchSlug: transferFromBranch })
      .then(res => {
        if (active) setSourceInventory(res)
      })
      .catch(err => console.error("Error cargando inventario origen:", err))

    return () => { active = false }
  }, [transferFromBranch])

  useEffect(() => {
    if (!transferToBranch) return
    let active = true

    inventoryService.list({ branchSlug: transferToBranch })
      .then(res => {
        if (active) setTargetInventory(res)
      })
      .catch(err => console.error("Error cargando inventario destino:", err))

    return () => { active = false }
  }, [transferToBranch])

  // Intercambiar origen y destino
  const swapBranches = () => {
    const prevFrom = transferFromBranch
    const prevTo = transferToBranch
    setTransferFromBranch(prevTo)
    setTransferToBranch(prevFrom)
    setSelectedItemsMap({}) // Reiniciar cantidades para evitar exceder el nuevo stock
    showToast("Sucursales intercambiadas", "info")
  }

  // Lista de items disponibles en origen combinados con productos
  const availableTransferItems = useMemo(() => {
    return products.map(product => {
      const invItem = sourceInventory.find(i => i.product.slug === product.slug)
      const targetInvItem = targetInventory.find(i => i.product.slug === product.slug)
      const currentSourceStock = invItem?.quantity ?? 0
      const currentSourceReserved = invItem?.reserved ?? 0
      const maxAvailable = Math.max(0, invItem?.available ?? currentSourceStock - currentSourceReserved)
      const currentTargetStock = targetInvItem?.quantity ?? 0

      return {
        product,
        currentSourceStock,
        currentSourceReserved,
        currentSourceExpired: invItem?.expiredQuantity ?? 0,
        maxAvailable,
        currentTargetStock,
        selectedQty: selectedItemsMap[product.slug] || 0
      }
    })
  }, [products, sourceInventory, targetInventory, selectedItemsMap])

  // Filtrado de items para transferencia
  const filteredTransferItems = useMemo(() => {
    return availableTransferItems.filter(({ product }) => {
      // Filtro de origen
      if (transferOriginFilter === "PRODUCIDO" && product.origin !== "PRODUCIDO") return false
      if (transferOriginFilter === "COMPRADO" && product.origin !== "COMPRADO") return false

      // Filtro de búsqueda
      if (!transferSearch.trim()) return true
      const query = transferSearch.toLowerCase()
      return (
        product.name.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query) ||
        (product.category && product.category.toLowerCase().includes(query))
      )
    })
  }, [availableTransferItems, transferOriginFilter, transferSearch])

  // Métricas de transferencia seleccionada
  const selectedTransferList = useMemo(() => {
    return Object.entries(selectedItemsMap)
      .filter(([, qty]) => qty > 0)
      .map(([slug, qty]) => {
        const item = availableTransferItems.find(i => i.product.slug === slug)
        return {
          slug,
          name: item?.product.name || slug,
          quantity: qty,
          maxAvailable: item?.maxAvailable ?? 0,
          origin: item?.product.origin,
          categoryName: item?.product.category
        }
      })
  }, [selectedItemsMap, availableTransferItems])

  const totalPiecesToTransfer = useMemo(() => {
    return selectedTransferList.reduce((sum, item) => sum + item.quantity, 0)
  }, [selectedTransferList])

  // Manejo de cantidades en transferencia
  const updateTransferItemQty = (slug: string, qty: number, max: number) => {
    const validQty = Math.max(0, Math.min(qty, max))
    setSelectedItemsMap(prev => {
      const next = { ...prev }
      if (validQty <= 0) {
        delete next[slug]
      } else {
        next[slug] = validQty
      }
      return next
    })
  }

  const handleTransferSubmit = async () => {
    if (!transferFromBranch || !transferToBranch) {
      showToast("Selecciona sucursal de origen y destino", "error")
      return
    }
    if (transferFromBranch === transferToBranch) {
      showToast("La sucursal de origen y destino deben ser distintas", "error")
      return
    }
    if (selectedTransferList.length === 0) {
      showToast("Selecciona al menos un producto con cantidad a transferir", "error")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        fromBranchSlug: transferFromBranch,
        toBranchSlug: transferToBranch,
        items: selectedTransferList.map(item => ({
          productSlug: item.slug,
          quantity: item.quantity
        })),
        referenceId: transferReference.trim() || undefined,
        note: transferNote.trim() || undefined
      }

      const result = await inventoryService.transferBulk(payload)
      showToast(`¡Transferencia completada! Se movieron ${result.transferredCount} productos (${totalPiecesToTransfer} piezas) con éxito`, "success")
      
      // Limpiar selección y refrescar inventarios
      setSelectedItemsMap({})
      setTransferNote("")
      setTransferReference("")

      const [resSource, resTarget] = await Promise.all([
        inventoryService.list({ branchSlug: transferFromBranch }),
        inventoryService.list({ branchSlug: transferToBranch })
      ])
      setSourceInventory(resSource)
      setTargetInventory(resTarget)
    } catch (err: unknown) {
      console.error("Error en transferencia masiva:", err)
      showToast(err instanceof Error ? err.message : "Error al realizar la transferencia entre sucursales", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejo de movimiento individual
  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) {
      showToast("Selecciona un producto", "error")
      return
    }
    if (movementQuantity <= 0) {
      showToast("La cantidad debe ser mayor a 0", "error")
      return
    }
    if (requiresExpirationDate && !movementExpiresAt) {
      showToast("Indica la fecha de caducidad del lote comprado", "error")
      return
    }

    setIsSubmitting(true)
    try {
      const data: CreateStockMovementData = {
        type: movementType,
        quantity: movementQuantity,
        productSlug: selectedProduct,
        fromBranchSlug: MOVEMENT_TYPES[movementType].requiresFromBranch ? movementFromBranch : undefined,
        toBranchSlug: MOVEMENT_TYPES[movementType].requiresToBranch ? movementToBranch : undefined,
        referenceId: movementReference.trim() || undefined,
        note: movementNote.trim() || undefined,
        expiresAt: requiresExpirationDate ? movementExpiresAt : undefined,
        alertAt: requiresExpirationDate ? calculatedAlertDate || undefined : undefined,
      }

      await inventoryService.createMovement(data)
      showToast("Movimiento registrado correctamente", "success")
      setMovementQuantity(1)
      setMovementNote("")
      setMovementReference("")
    } catch (err: unknown) {
      console.error("Error en movimiento:", err)
      showToast(err instanceof Error ? err.message : "Error al registrar movimiento", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const fromBranchName = branches.find(b => b.slug === transferFromBranch)?.name || "Origen"
  const toBranchName = branches.find(b => b.slug === transferToBranch)?.name || "Destino"

  return (
    <div className="min-h-screen bg-stone-50 pb-32 sm:pb-20 p-3 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Encabezado Superior */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/admin/inventario" className="mb-2 inline-flex items-center gap-1 text-xs sm:text-sm text-stone-500 hover:text-stone-900 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />Volver al Inventario
            </Link>
            <h1 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-extrabold text-gray-900 font-serif">
              <ArrowRightLeft className="h-7 w-7 text-primary flex-shrink-0" />
              Movimientos & Transferencias
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
              Transfiere múltiples productos entre sucursales en un solo envío o registra ajustes puntuales de inventario.
            </p>
          </div>
        </div>

        {/* Pestañas de Modo (Transferencia Masiva vs Movimiento Individual) */}
        <div className="flex rounded-2xl bg-stone-200/80 p-1 max-w-md">
          <button
            type="button"
            onClick={() => setMainMode("TRANSFER_BULK")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
              mainMode === "TRANSFER_BULK"
                ? "bg-white text-primary shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>Transferencia Masiva</span>
          </button>
          <button
            type="button"
            onClick={() => setMainMode("INDIVIDUAL")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
              mainMode === "INDIVIDUAL"
                ? "bg-white text-primary shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Movimiento Único</span>
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* MODO 1: TRANSFERENCIA MASIVA ENTRE SUCURSALES                   */}
        {/* ---------------------------------------------------------------- */}
        {mainMode === "TRANSFER_BULK" && (
          <div className="space-y-6">
            {/* Panel de Selección de Sucursales (Origen y Destino) */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-4">
                {/* Sucursal Origen */}
                <div className="w-full flex-1 space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                    1. Sucursal de Origen (De donde sale el producto)
                  </label>
                  <div className="relative">
                    <Store className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <select
                      value={transferFromBranch}
                      onChange={(e) => {
                        setTransferFromBranch(e.target.value)
                        setSelectedItemsMap({})
                      }}
                      className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.slug} disabled={b.slug === transferToBranch}>
                          {b.name} (Origen)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botón de Intercambio Rápido */}
                <button
                  type="button"
                  onClick={swapBranches}
                  className="mt-2 md:mt-6 h-11 w-11 rounded-full border border-stone-200 bg-stone-50 text-stone-700 hover:bg-amber-50 hover:text-primary hover:border-amber-300 transition-colors flex items-center justify-center shadow-sm flex-shrink-0"
                  title="Intercambiar origen y destino"
                  aria-label="Intercambiar sucursales"
                >
                  <ArrowRightLeft className="h-5 w-5" />
                </button>

                {/* Sucursal Destino */}
                <div className="w-full flex-1 space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                    2. Sucursal de Destino (Hacia donde va)
                  </label>
                  <div className="relative">
                    <Store className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <select
                      value={transferToBranch}
                      onChange={(e) => setTransferToBranch(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.slug} disabled={b.slug === transferFromBranch}>
                          {b.name} (Destino)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros de Productos y Búsqueda */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Buscador */}
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  placeholder="Buscar pan, galleta, bebida o SKU a transferir..."
                  className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {transferSearch && (
                  <button 
                    onClick={() => setTransferSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filtro por Tipo */}
              <div className="flex items-center gap-1.5 bg-stone-200/70 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTransferOriginFilter("ALL")}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    transferOriginFilter === "ALL" ? "bg-white text-gray-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Todos ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTransferOriginFilter("PRODUCIDO")}
                  className={`rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1 ${
                    transferOriginFilter === "PRODUCIDO" ? "bg-white text-primary shadow-sm" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Croissant className="h-3.5 w-3.5" />
                  Producidos
                </button>
                <button
                  type="button"
                  onClick={() => setTransferOriginFilter("COMPRADO")}
                  className={`rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1 ${
                    transferOriginFilter === "COMPRADO" ? "bg-white text-primary shadow-sm" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Comprados
                </button>
              </div>
            </div>

            {/* Grid Principal: Lista de Productos y Panel de Resumen */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Columna Izquierda / Lista de Selección (lg:col-span-8) */}
              <div className="lg:col-span-8 space-y-3">
                {filteredTransferItems.length === 0 ? (
                  <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-stone-500">
                    No se encontraron productos con los criterios de búsqueda.
                  </div>
                ) : (
                  filteredTransferItems.map(({ product, currentSourceReserved, currentSourceExpired, maxAvailable, currentTargetStock, selectedQty }) => {
                    const isSelected = selectedQty > 0
                    const hasStock = maxAvailable > 0

                    return (
                      <div
                        key={product.slug}
                        className={`rounded-2xl border p-4 transition-all ${
                          isSelected 
                            ? "border-amber-400 bg-amber-50/40 ring-1 ring-amber-300 shadow-sm" 
                            : "border-stone-200 bg-white hover:border-stone-300"
                        } ${!hasStock && !isSelected ? "opacity-60" : ""}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Información del Producto */}
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-gray-900">{product.name}</h3>
                              {product.origin === 'PRODUCIDO' ? (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 flex items-center gap-1">
                                  <Croissant className="h-3 w-3" /> Panadería
                                </span>
                              ) : (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 flex items-center gap-1">
                                  <ShoppingBag className="h-3 w-3" /> Reventa
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                              <span className="font-mono">{product.slug}</span>
                              {product.category && <span>· {product.category}</span>}
                            </div>

                            {/* Comparativa de Stock Origen vs Destino */}
                            <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="text-stone-500 font-medium">{fromBranchName}:</span>
                                <span className={`font-bold ${hasStock ? "text-gray-900" : "text-red-600"}`}>
                                  {maxAvailable} disp.
                                </span>
                                {currentSourceReserved > 0 && (
                                  <span className="text-[11px] text-amber-600">({currentSourceReserved} resv.)</span>
                                )}
                                {currentSourceExpired > 0 && (
                                  <span className="text-[11px] text-red-600">· {currentSourceExpired} vencidas</span>
                                )}
                              </div>
                              <span className="text-stone-300">|</span>
                              <div className="flex items-center gap-1">
                                <span className="text-stone-500 font-medium">{toBranchName}:</span>
                                <span className="font-bold text-stone-700">{currentTargetStock} actual</span>
                              </div>
                            </div>
                          </div>

                          {/* Controles de Cantidad a Transferir */}
                          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                            {hasStock ? (
                              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                                <button
                                  type="button"
                                  onClick={() => updateTransferItemQty(product.slug, selectedQty - 1, maxAvailable)}
                                  disabled={selectedQty <= 0}
                                  className="h-10 w-9 rounded-lg border border-stone-300 bg-stone-50 text-stone-700 font-bold flex items-center justify-center disabled:opacity-30 active:bg-stone-200"
                                  aria-label="Restar 1"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>

                                <input
                                  type="number"
                                  min="0"
                                  max={maxAvailable}
                                  value={selectedQty > 0 ? selectedQty : ""}
                                  placeholder="0"
                                  onChange={(e) => updateTransferItemQty(product.slug, parseInt(e.target.value, 10) || 0, maxAvailable)}
                                  className={`h-10 w-16 sm:w-20 rounded-lg border text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary ${
                                    isSelected ? "border-amber-400 bg-white text-amber-900" : "border-stone-300"
                                  }`}
                                  aria-label={`Cantidad a transferir de ${product.name}`}
                                />

                                <button
                                  type="button"
                                  onClick={() => updateTransferItemQty(product.slug, selectedQty + 1, maxAvailable)}
                                  disabled={selectedQty >= maxAvailable}
                                  className="h-10 w-9 rounded-lg border border-stone-300 bg-stone-50 text-stone-700 font-bold flex items-center justify-center disabled:opacity-30 active:bg-stone-200"
                                  aria-label="Sumar 1"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => updateTransferItemQty(product.slug, maxAvailable, maxAvailable)}
                                  className="h-10 px-2 rounded-lg border border-stone-300 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-700 font-bold text-xs transition-colors"
                                  title="Transferir todo el disponible"
                                >
                                  MAX
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-3 py-1.5 rounded-lg">
                                Sin stock disponible
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Proyección en vivo si hay cantidad asignada */}
                        {isSelected && (
                          <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-900 font-medium">
                            <span>Se moverán <strong>{selectedQty} unidades</strong></span>
                            <span className="text-stone-500 text-[11px]">
                              Nuevo stock: {fromBranchName} ({maxAvailable - selectedQty}) ➔ {toBranchName} ({currentTargetStock + selectedQty})
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Columna Derecha / Resumen de Transferencia (lg:col-span-4) */}
              <div className="lg:col-span-4 sticky top-20 space-y-4">
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      Resumen del Envío
                    </h3>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                      {selectedTransferList.length} productos
                    </span>
                  </div>

                  {/* Trayectoria */}
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Desde:</span>
                      <strong className="text-gray-900">{fromBranchName}</strong>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Hacia:</span>
                      <strong className="text-primary">{toBranchName}</strong>
                    </div>
                    <div className="pt-1.5 border-t border-stone-200 flex items-center justify-between font-bold text-sm text-gray-900">
                      <span>Total Piezas:</span>
                      <span className="text-primary text-base">{totalPiecesToTransfer}</span>
                    </div>
                  </div>

                  {/* Lista de Items Seleccionados */}
                  {selectedTransferList.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-stone-100">
                      {selectedTransferList.map(item => (
                        <div key={item.slug} className="pt-1.5 flex items-center justify-between text-xs">
                          <div className="truncate pr-2">
                            <p className="font-medium text-gray-900 truncate">{item.name}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {item.quantity} pzas
                            </span>
                            <button
                              type="button"
                              onClick={() => updateTransferItemQty(item.slug, 0, item.maxAvailable)}
                              className="text-stone-400 hover:text-red-600 p-0.5"
                              title="Quitar de la lista"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-stone-400">
                      Selecciona cantidades en los productos de la izquierda para agregarlos al envío.
                    </div>
                  )}

                  {/* Campos Opcionales */}
                  <div className="space-y-3 pt-2 border-t border-stone-100">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-stone-600">No. Guía o Referencia (opcional)</span>
                      <input
                        type="text"
                        value={transferReference}
                        onChange={(e) => setTransferReference(e.target.value)}
                        placeholder="Ej. ENVIO-14-TARDE"
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-stone-600">Nota / Motivo del traslado</span>
                      <input
                        type="text"
                        value={transferNote}
                        onChange={(e) => setTransferNote(e.target.value)}
                        placeholder="Ej. Reposición de pan francés para café de la tarde"
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </label>
                  </div>

                  {/* Botón de Confirmación */}
                  <Button
                    type="button"
                    onClick={handleTransferSubmit}
                    disabled={isSubmitting || selectedTransferList.length === 0}
                    className="w-full h-12 font-bold text-sm shadow-md"
                  >
                    {isSubmitting ? (
                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Procesando Transferencia...</>
                    ) : (
                      <><Send className="mr-2 h-4 w-4" />Confirmar Transferencia ({selectedTransferList.length})</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* MODO 2: MOVIMIENTO INDIVIDUAL / AJUSTES PUNTUALES               */}
        {/* ---------------------------------------------------------------- */}
        {mainMode === "INDIVIDUAL" && (
          <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8 shadow-sm max-w-3xl mx-auto space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900 font-serif">Registrar Movimiento Individual</h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Para registrar compras a proveedores, producción interna directa, mermas o pérdidas puntuales.
              </p>
            </div>

            <form onSubmit={handleIndividualSubmit} className="space-y-5">
              {/* Tipo de Movimiento */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Tipo de Movimiento
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(MOVEMENT_TYPES) as StockMovementType[]).map((type) => {
                    const config = MOVEMENT_TYPES[type]
                    const isSelected = movementType === type
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMovementType(type)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "border-primary bg-amber-50/60 ring-2 ring-primary/20 text-primary font-bold"
                            : "border-stone-200 hover:border-stone-300 text-stone-700"
                        }`}
                      >
                        <div className={`mb-1 p-2 rounded-lg ${config.bgColor} ${config.color}`}>
                          {config.icon}
                        </div>
                        <span className="text-xs font-semibold">{config.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Selector de Producto */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                  Producto
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white py-3 px-4 text-sm font-semibold text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona un producto...</option>
                  {products.map(p => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} ({p.origin === 'PRODUCIDO' ? 'Panadería' : 'Reventa'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                  Cantidad ({products.find(p => p.slug === selectedProduct)?.origin === 'PRODUCIDO' ? 'piezas' : 'unidades'})
                </label>
                <input
                  type="number"
                  min="1"
                  value={movementQuantity}
                  onChange={(e) => setMovementQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 text-base font-bold text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Sucursal Origen / Destino según tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOVEMENT_TYPES[movementType].requiresFromBranch && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                      Sucursal Origen
                    </label>
                    <select
                      value={movementFromBranch}
                      onChange={(e) => setMovementFromBranch(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white py-2.5 px-3 text-sm font-semibold text-gray-900"
                    >
                      {branches.map(b => <option key={b.id} value={b.slug}>{b.name}</option>)}
                    </select>
                  </div>
                )}

                {MOVEMENT_TYPES[movementType].requiresToBranch && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                      Sucursal Destino
                    </label>
                    <select
                      value={movementToBranch}
                      onChange={(e) => setMovementToBranch(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white py-2.5 px-3 text-sm font-semibold text-gray-900"
                    >
                      {branches.map(b => <option key={b.id} value={b.slug}>{b.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {requiresExpirationDate && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-blue-800 mb-1.5">
                    Fecha de caducidad del lote *
                  </label>
                  <input
                    type="date"
                    value={movementExpiresAt}
                    onChange={(event) => setMovementExpiresAt(event.target.value)}
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <p className="mt-2 text-xs text-blue-800">
                    Se bloqueará la venta cuando el lote esté vencido y se conservará para registrar una merma.
                    {calculatedAlertDate && (
                      <> El primer recordatorio se generará el <strong>{calculatedAlertDate}</strong>; los demás se revisan automáticamente.</>
                    )}
                  </p>
                </div>
              )}

              {/* Referencia y Nota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    No. Referencia / Factura
                  </label>
                  <input
                    type="text"
                    value={movementReference}
                    onChange={(e) => setMovementReference(e.target.value)}
                    placeholder="Ej. FAC-98234"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Nota / Observación
                  </label>
                  <input
                    type="text"
                    value={movementNote}
                    onChange={(e) => setMovementNote(e.target.value)}
                    placeholder="Ej. Ajuste de stock"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Botón Registrar */}
              <Button
                type="submit"
                disabled={isSubmitting || !selectedProduct}
                className="w-full h-12 font-bold text-sm shadow-md"
              >
                {isSubmitting ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Guardando Movimiento...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />Registrar Movimiento</>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* BARRA FLOTANTE STICKY PARA MÓVIL (Transferencia Masiva) */}
      {mainMode === "TRANSFER_BULK" && selectedTransferList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 p-3 sm:hidden shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="text-stone-500 block">Envío a {toBranchName}:</span>
              <span className="font-bold text-gray-900 text-sm">
                {selectedTransferList.length} prod. ({totalPiecesToTransfer} pzas)
              </span>
            </div>
            <Button
              type="button"
              onClick={handleTransferSubmit}
              disabled={isSubmitting}
              className="font-bold h-11 px-5 shadow"
            >
              {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Transferir Ahora"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MovimientoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 p-8 flex items-center justify-center">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-stone-600 font-medium">Cargando módulo de movimientos...</p>
        </div>
      </div>
    }>
      <MovimientoForm />
    </Suspense>
  )
}
