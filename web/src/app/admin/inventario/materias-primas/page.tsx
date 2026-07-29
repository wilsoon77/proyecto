"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { Package, RefreshCw, Plus, Search, TriangleAlert as AlertTriangle, Building2, ChevronLeft, ChevronRight, Warehouse, Loader as Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  branchesService,
  rawMaterialsService,
  type RawMaterial,
  type RawMaterialInventory
} from "@/lib/api"
import { useToast } from "@/components/ui/toast"

interface Branch {
  id: number
  name: string
  slug: string
}

export default function MateriasPrimasPage() {
  // Estados de carga e inventario
  const [rawInventory, setRawInventory] = useState<RawMaterialInventory[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRawLoading, setIsRawLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showLowStock, setShowLowStock] = useState(false)

  // Paginación
  const ITEMS_PER_PAGE = 10
  const [currentPage, setCurrentPage] = useState(1)

  // Modales
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form de Compra/Ingreso
  const [purchaseMaterialId, setPurchaseMaterialId] = useState<number | "">("")
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(0)
  const [purchaseUnit, setPurchaseUnit] = useState<string>("LIBRA")
  const [purchaseBranchId, setPurchaseBranchId] = useState<number | "">("")
  const [isPurchaseSubmitting, setIsPurchaseSubmitting] = useState(false)

  // Form de Nueva Materia Prima
  const [newName, setNewName] = useState("")
  const [newBaseUnit, setNewBaseUnit] = useState<"LB" | "ML" | "UNIT">("LB")
  const [newCost, setNewCost] = useState<number>(0)
  const [newMinStock, setNewMinStock] = useState<number>(10)
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false)

  const { showToast } = useToast()

  // Cargar sucursales en mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const branchesData = await branchesService.list()
        setBranches(branchesData)
      } catch (err) {
        console.error("Error loading branches:", err)
        setError("Error al cargar sucursales")
      }
    }
    loadBranches()
  }, [])

  // Cargar inventario y lista de insumos
  const loadRawMaterials = useCallback(async () => {
    setIsRawLoading(true)
    setError(null)
    try {
      const selectedBranchId = selectedBranch !== "all" 
        ? branches.find(b => b.slug === selectedBranch)?.id 
        : undefined
      const [invData, listData] = await Promise.all([
        rawMaterialsService.getInventory(selectedBranchId),
        rawMaterialsService.list(false)
      ])
      setRawInventory(invData)
      setRawMaterials(listData.filter(r => r.isActive))
    } catch (err) {
      console.error("Error loading raw materials:", err)
      setError("Error al cargar inventario de materias primas")
      showToast("Error al cargar materias primas", "error")
    } finally {
      setIsRawLoading(false)
      setIsLoading(false)
    }
  }, [selectedBranch, branches, showToast])

  useEffect(() => {
    if (branches.length > 0) {
      loadRawMaterials()
    }
  }, [branches, loadRawMaterials])

  // Filtrar inventario de materias primas
  const filteredRawInventory = useMemo(() => {
    return rawInventory.filter(item => {
      if (selectedBranch !== "all") {
        const branchObj = branches.find(b => b.slug === selectedBranch)
        if (!branchObj || item.branch.id !== branchObj.id) {
          return false
        }
      }
      if (showLowStock && !item.isLow) {
        return false
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return item.rawMaterial.name.toLowerCase().includes(query) ||
               item.branch.name.toLowerCase().includes(query)
      }
      return true
    })
  }, [rawInventory, selectedBranch, showLowStock, searchQuery, branches])

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedBranch, searchQuery, showLowStock])

  // Paginación
  const totalRawPages = Math.ceil(filteredRawInventory.length / ITEMS_PER_PAGE)
  const paginatedRawInventory = filteredRawInventory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-cream min-h-screen">
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/admin/inventario" className="hover:text-primary transition-colors flex items-center gap-1">
            <Warehouse className="h-3.5 w-3.5" />
            Inventario
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Materias Primas</span>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <Warehouse className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              Materias Primas
            </h1>
            <p className="text-muted-foreground mt-1">Control de insumos, harinas, levaduras y compras registradas</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadRawMaterials}
              disabled={isRawLoading}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-cream disabled:opacity-50 w-full sm:w-auto justify-center shadow-sm text-sm font-medium"
            >
              <RefreshCw className={`h-4 w-4 ${isRawLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={() => {
                if (branches.length > 0) setPurchaseBranchId(branches[0].id)
                if (rawMaterials.length > 0) setPurchaseMaterialId(rawMaterials[0].id)
                setPurchaseQuantity(0)
                setShowPurchaseModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-success/90 text-white rounded-lg transition-colors w-full sm:w-auto justify-center shadow-sm text-sm font-bold animate-pulse-subtle"
            >
              <Plus className="h-4 w-4" />
              Registrar Compra
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-chart-3 hover:bg-chart-3/90 text-white rounded-lg transition-colors w-full sm:w-auto justify-center shadow-sm text-sm font-bold"
            >
              <Plus className="h-4 w-4" />
              Nuevo Insumo
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Tabla e info */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Filtros */}
        <div className="p-4 bg-cream/50 border-b border-border">
          <div className="flex flex-wrap items-center gap-4">
            {/* Búsqueda */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Buscar insumo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card text-sm"
              />
            </div>

            {/* Filtro por sucursal */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-card text-sm"
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
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">
                Solo alertas de stock mínimo
              </span>
            </label>

            {/* Contador */}
            <div className="text-sm text-muted-foreground ml-auto font-medium">
              {filteredRawInventory.length} de {rawInventory.length} registros
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground/60">
            <RefreshCw className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
            <p>Cargando inventario de materias primas...</p>
          </div>
        ) : (
          <>
            {/* Vista Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginatedRawInventory.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground/60">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p>No se encontraron registros de materia prima</p>
                </div>
              ) : (
                paginatedRawInventory.map((item) => (
                  <div key={`m-raw-${item.id}`} className="p-4 hover:bg-cream">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.rawMaterial.name}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-chart-3/10 text-chart-3 mt-1">
                            {item.branch.name}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${
                        item.isLow ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                      }`}>
                        {Number(item.quantity).toFixed(1)} {item.rawMaterial.baseUnit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3 border-t border-border pt-2 text-xs">
                      <span className="text-muted-foreground">
                        Mínimo: <strong className="text-foreground">{item.rawMaterial.minStock ? `${Number(item.rawMaterial.minStock).toFixed(0)} ${item.rawMaterial.baseUnit}` : "N/A"}</strong>
                      </span>
                      <button
                        onClick={() => {
                          setPurchaseMaterialId(item.rawMaterial.id)
                          setPurchaseBranchId(item.branch.id)
                          setPurchaseUnit(item.rawMaterial.baseUnit === "LB" ? "LIBRA" : item.rawMaterial.baseUnit === "ML" ? "LITRO" : "UNIDAD")
                          setPurchaseQuantity(0)
                          setShowPurchaseModal(true)
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success rounded-lg hover:bg-success/10 transition-colors font-medium text-xs shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Ingresar Compra
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Vista Desktop Tabla */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead className="bg-cream border-b border-border">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-muted-foreground text-sm">Insumo</th>
                    <th className="text-left py-4 px-6 font-semibold text-muted-foreground text-sm">Sucursal</th>
                    <th className="text-center py-4 px-6 font-semibold text-muted-foreground text-sm">Existencia</th>
                    <th className="text-center py-4 px-6 font-semibold text-muted-foreground text-sm hidden lg:table-cell">Alerta Mínima</th>
                    <th className="text-center py-4 px-6 font-semibold text-muted-foreground text-sm">Estado</th>
                    <th className="text-center py-4 px-6 font-semibold text-muted-foreground text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRawInventory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground/60">
                        <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                        <p>No se encontraron registros de materias primas</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRawInventory.map((item, index) => (
                      <tr 
                        key={`raw-${item.id}`}
                        className={`border-b border-border hover:bg-cream ${index % 2 === 0 ? '' : 'bg-cream/50'}`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{item.rawMaterial.name}</p>
                              <p className="text-xs text-muted-foreground/60">Unidad de medida: {item.rawMaterial.baseUnit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-chart-3/10 text-chart-3">
                            {item.branch.name}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-foreground">
                          {Number(item.quantity).toFixed(2)} {item.rawMaterial.baseUnit}
                        </td>
                        <td className="py-4 px-6 text-center text-muted-foreground hidden lg:table-cell font-medium">
                          {item.rawMaterial.minStock ? `${Number(item.rawMaterial.minStock).toFixed(0)} ${item.rawMaterial.baseUnit}` : "N/A"}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.isLow ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                          }`}>
                            {item.isLow ? 'Stock Bajo' : 'Suficiente'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => {
                              setPurchaseMaterialId(item.rawMaterial.id)
                              setPurchaseBranchId(item.branch.id)
                              setPurchaseUnit(item.rawMaterial.baseUnit === "LB" ? "LIBRA" : item.rawMaterial.baseUnit === "ML" ? "LITRO" : "UNIDAD")
                              setPurchaseQuantity(0)
                              setShowPurchaseModal(true)
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success rounded-lg hover:bg-success/10 transition-colors font-medium text-sm shadow-sm"
                          >
                            <Plus className="h-4 w-4" />
                            Ingresar Compra
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalRawPages > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalRawPages} ({filteredRawInventory.length} registros)
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
                    disabled={currentPage >= totalRawPages}
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

      {/* MODAL 1: Registrar Compra de Materia Prima */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-card rounded-2xl shadow-xl border border-border max-w-md w-full p-6 relative overflow-hidden">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-success" />
              Registrar Compra / Entrada de Insumo
            </h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!purchaseMaterialId || !purchaseBranchId || purchaseQuantity <= 0 || isPurchaseSubmitting) return
              
              setIsPurchaseSubmitting(true)
              try {
                const res = await rawMaterialsService.registerPurchase({
                  rawMaterialId: Number(purchaseMaterialId),
                  branchId: Number(purchaseBranchId),
                  purchaseQuantity: Number(purchaseQuantity),
                  unitOfPurchase: purchaseUnit
                })
                showToast(res.message, "success")
                setShowPurchaseModal(false)
                setPurchaseQuantity(0)
                loadRawMaterials()
              } catch (err: any) {
                const msg = err.response?.data?.message || err.message || "Error al registrar la compra"
                showToast(msg, "error")
              } finally {
                setIsPurchaseSubmitting(false)
              }
            }} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-bold block mb-1">Materia Prima</label>
                <select
                  value={purchaseMaterialId}
                  onChange={(e) => {
                    const id = Number(e.target.value)
                    setPurchaseMaterialId(id)
                    const m = rawMaterials.find(x => x.id === id)
                    if (m) {
                      setPurchaseUnit(m.baseUnit === "LB" ? "LIBRA" : m.baseUnit === "ML" ? "LITRO" : "UNIDAD")
                    }
                  }}
                  className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                  required
                >
                  <option value="" disabled>Seleccione materia prima...</option>
                  {rawMaterials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} (Base: {m.baseUnit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground font-bold block mb-1">Cantidad Comprada</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="w-full border border-border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card h-10 px-3"
                    value={purchaseQuantity || ""}
                    onChange={(e) => setPurchaseQuantity(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-bold block mb-1">Unidad de Compra</label>
                  <select
                    value={purchaseUnit}
                    onChange={(e) => setPurchaseUnit(e.target.value)}
                    className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card h-10"
                    required
                  >
                    {/* Sólidos */}
                    <option value="LIBRA">Libra (LB)</option>
                    <option value="ARROBA">Arroba (@ = 25 LB)</option>
                    <option value="QUINTAL">Quintal (QQ = 100 LB)</option>
                    {/* Líquidos */}
                    <option value="LITRO">Litro (1000 ML)</option>
                    <option value="GALON">Galón (3785 ML)</option>
                    {/* Discretos */}
                    <option value="UNIDAD">Unidad (1 UNIT)</option>
                    <option value="CARTON">Cartón (30 UNIT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-bold block mb-1">Sucursal de Destino</label>
                <select
                  value={purchaseBranchId}
                  onChange={(e) => setPurchaseBranchId(Number(e.target.value))}
                  className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                  required
                >
                  <option value="" disabled>Seleccione sucursal...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPurchaseModal(false)}
                  disabled={isPurchaseSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-success hover:bg-success/90 text-white font-bold"
                  disabled={isPurchaseSubmitting}
                >
                  {isPurchaseSubmitting ? "Registrando..." : "Registrar Compra"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Crear Nueva Materia Prima */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-card rounded-2xl shadow-xl border border-border max-w-md w-full p-6 relative overflow-hidden">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-chart-3" />
              Nueva Materia Prima
            </h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!newName.trim() || newCost < 0 || isCreateSubmitting) return
              
              setIsCreateSubmitting(true)
              try {
                await rawMaterialsService.create({
                  name: newName.trim(),
                  baseUnit: newBaseUnit,
                  costPerUnit: Number(newCost),
                  minStock: Number(newMinStock)
                })
                showToast("Materia prima creada con éxito", "success")
                setShowCreateModal(false)
                setNewName("")
                setNewCost(0)
                setNewMinStock(10)
                loadRawMaterials()
              } catch (err: any) {
                const msg = err.response?.data?.message || err.message || "Error al crear materia prima"
                showToast(msg, "error")
              } finally {
                setIsCreateSubmitting(false)
              }
            }} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-bold block mb-1">Nombre del Insumo</label>
                <input
                  placeholder="Ej: Harina de Trigo, Levadura Seca, Azúcar..."
                  className="w-full border border-border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card h-10 px-3"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground font-bold block mb-1">Unidad Base</label>
                  <select
                    value={newBaseUnit}
                    onChange={(e) => setNewBaseUnit(e.target.value as any)}
                    className="w-full border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card h-10"
                    required
                  >
                    <option value="LB">Libra (LB)</option>
                    <option value="ML">Mililitro (ML)</option>
                    <option value="UNIT">Unidad (UNIT)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-bold block mb-1">Costo Unitario Promedio (Q)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    className="w-full border border-border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card h-10 px-3"
                    value={newCost || ""}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-bold block mb-1">Stock de Alerta Mínima</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full border border-border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card h-10 px-3"
                  value={newMinStock || ""}
                  onChange={(e) => setNewMinStock(Number(e.target.value))}
                  required
                />
                <p className="text-[10px] text-muted-foreground/60 mt-1">El sistema emitirá una alerta si el stock baja de esta cantidad en la sucursal.</p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreateSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-chart-3 hover:bg-chart-3/90 text-white font-bold"
                  disabled={isCreateSubmitting}
                >
                  {isCreateSubmitting ? "Creando..." : "Crear Insumo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
