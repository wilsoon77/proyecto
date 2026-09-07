"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import type { FormEvent } from "react"
import { 
  Package, 
  RefreshCw, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Warehouse, 
  Edit2, 
  PowerOff,
  CheckCircle2,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { 
  branchesService,
  rawMaterialsService,
  type RawMaterial,
  type RawMaterialInventory
} from "@/lib/api"
import { useToast } from "@/components/ui/toast"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminSearchBar, type FilterChip } from "@/components/admin/AdminSearchBar"
import { AdminEntityCard } from "@/components/admin/AdminEntityCard"

interface Branch {
  id: number
  name: string
  slug: string
}

type ActiveFilter = "all" | "active" | "inactive" | "low_stock"

export default function MateriasPrimasPage() {
  // Estados de carga e inventario
  const [rawInventory, setRawInventory] = useState<RawMaterialInventory[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [rawMaterialCatalog, setRawMaterialCatalog] = useState<RawMaterial[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRawLoading, setIsRawLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all")

  // Paginación
  const ITEMS_PER_PAGE = 10
  const [currentPage, setCurrentPage] = useState(1)

  // Modales
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: number; name: string } | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

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

  // Form de edición de materia prima
  const [editName, setEditName] = useState("")
  const [editCost, setEditCost] = useState<number>(0)
  const [editMinStock, setEditMinStock] = useState<number>(0)
  const [editIsActive, setEditIsActive] = useState(true)
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

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
      setRawMaterialCatalog(listData)
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

  const isRawMaterialActive = useCallback((materialId: number) => {
    return rawMaterialCatalog.find((material) => material.id === materialId)?.isActive ?? true
  }, [rawMaterialCatalog])

  // Filtrar inventario de materias primas
  const filteredRawInventory = useMemo(() => {
    return rawInventory.filter(item => {
      if (selectedBranch !== "all") {
        const branchObj = branches.find(b => b.slug === selectedBranch)
        if (branchObj && item.branch.id !== branchObj.id) return false
      }

      const active = isRawMaterialActive(item.rawMaterial.id)
      if (activeFilter === "active" && !active) return false
      if (activeFilter === "inactive" && active) return false
      if (activeFilter === "low_stock" && (!item.isLow || !active)) return false

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchName = item.rawMaterial.name.toLowerCase().includes(q)
        const matchBranch = item.branch.name.toLowerCase().includes(q)
        if (!matchName && !matchBranch) return false
      }

      return true
    })
  }, [rawInventory, selectedBranch, branches, activeFilter, searchQuery, isRawMaterialActive])

  // Reset de página al filtrar o buscar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedBranch, activeFilter])

  // Paginación
  const totalRawPages = Math.max(1, Math.ceil(filteredRawInventory.length / ITEMS_PER_PAGE))
  const paginatedRawInventory = useMemo(() => {
    return filteredRawInventory.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    )
  }, [filteredRawInventory, currentPage])

  // Contadores para chips
  const lowStockCount = useMemo(() => {
    return rawInventory.filter(item => item.isLow && isRawMaterialActive(item.rawMaterial.id)).length
  }, [rawInventory, isRawMaterialActive])

  const inactiveCount = useMemo(() => {
    return rawInventory.filter(item => !isRawMaterialActive(item.rawMaterial.id)).length
  }, [rawInventory, isRawMaterialActive])

  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [
      {
        id: "all",
        label: "Todos",
        count: rawInventory.length,
        active: activeFilter === "all",
        onClick: () => setActiveFilter("all"),
      },
      {
        id: "active",
        label: "Activos",
        count: rawInventory.length - inactiveCount,
        active: activeFilter === "active",
        onClick: () => setActiveFilter("active"),
      },
    ]

    if (lowStockCount > 0) {
      chips.push({
        id: "low_stock",
        label: "Stock Bajo",
        count: lowStockCount,
        active: activeFilter === "low_stock",
        onClick: () => setActiveFilter("low_stock"),
      })
    }

    if (inactiveCount > 0) {
      chips.push({
        id: "inactive",
        label: "Inactivos",
        count: inactiveCount,
        active: activeFilter === "inactive",
        onClick: () => setActiveFilter("inactive"),
      })
    }

    return chips
  }, [rawInventory.length, inactiveCount, lowStockCount, activeFilter])

  const openEditModal = (materialId: number) => {
    const material = rawMaterialCatalog.find((item) => item.id === materialId)
    if (!material) {
      showToast("No se encontró la materia prima", "error")
      return
    }

    setEditingMaterial(material)
    setEditName(material.name)
    setEditCost(Number(material.costPerUnit))
    setEditMinStock(material.minStock === null ? 0 : Number(material.minStock))
    setEditIsActive(material.isActive)
    setShowEditModal(true)
  }

  const openPurchaseModal = (item?: RawMaterialInventory) => {
    if (item) {
      setPurchaseMaterialId(item.rawMaterial.id)
      setPurchaseBranchId(item.branch.id)
      setPurchaseUnit(item.rawMaterial.baseUnit === "LB" ? "LIBRA" : item.rawMaterial.baseUnit === "ML" ? "LITRO" : "UNIDAD")
    } else {
      if (branches.length > 0) setPurchaseBranchId(branches[0].id)
      if (rawMaterials.length > 0) {
        setPurchaseMaterialId(rawMaterials[0].id)
        setPurchaseUnit(rawMaterials[0].baseUnit === "LB" ? "LIBRA" : rawMaterials[0].baseUnit === "ML" ? "LITRO" : "UNIDAD")
      }
    }
    setPurchaseQuantity(0)
    setShowPurchaseModal(true)
  }

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return

    setIsDeactivating(true)
    try {
      await rawMaterialsService.remove(deactivateTarget.id)
      showToast(`Materia prima "${deactivateTarget.name}" desactivada. Se conserva en recetas e historial.`, "success")
      await loadRawMaterials()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al desactivar materia prima"
      showToast(msg, "error")
    } finally {
      setIsDeactivating(false)
      setDeactivateTarget(null)
    }
  }

  const handleReactivateMaterial = async (materialId: number, materialName: string) => {
    try {
      await rawMaterialsService.update(materialId, { isActive: true })
      showToast(`Materia prima "${materialName}" reactivada con éxito`, "success")
      await loadRawMaterials()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al reactivar materia prima"
      showToast(msg, "error")
    }
  }

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingMaterial || !editName.trim() || editCost < 0 || editMinStock < 0 || isEditSubmitting) return

    setIsEditSubmitting(true)
    try {
      await rawMaterialsService.update(editingMaterial.id, {
        name: editName.trim(),
        costPerUnit: Number(editCost),
        minStock: Number(editMinStock),
        isActive: editIsActive,
      })
      showToast("Materia prima actualizada con éxito", "success")
      setShowEditModal(false)
      setEditingMaterial(null)
      await loadRawMaterials()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar materia prima"
      showToast(msg, "error")
    } finally {
      setIsEditSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Header Estandarizado ── */}
      <AdminPageHeader
        title="Materias Primas"
        description="Control de insumos, harinas, levaduras y registro rápido de compras"
        icon={<Warehouse className="h-6 w-6 text-[#D97706]" />}
        breadcrumbs={[
          { label: "Inventario", href: "/admin/inventario" },
          { label: "Materias Primas" },
        ]}
        primaryAction={{
          label: "Registrar Compra",
          onClick: () => openPurchaseModal(),
          icon: <Plus className="h-4 w-4 mr-1.5" />,
        }}
        secondaryAction={{
          label: "Nuevo Insumo",
          onClick: () => setShowCreateModal(true),
          icon: <Plus className="h-4 w-4 mr-1.5" />,
        }}
      />

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Buscador y Filtros Estandarizados ── */}
      <AdminSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Buscar insumo o sucursal..."
        chips={filterChips}
        totalCount={rawInventory.length}
        filteredCount={filteredRawInventory.length}
        entityName="registros"
        isLoading={isRawLoading}
      >
        {/* Selector de Sucursal */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#8C522B] uppercase tracking-wider hidden sm:inline">
            Sucursal:
          </span>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="h-10 px-3 text-xs sm:text-sm bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-[#2B170F] font-medium focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
          >
            <option value="all">Todas las sucursales</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.slug}>{branch.name}</option>
            ))}
          </select>
        </div>
      </AdminSearchBar>

      {/* ── Contenido ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#D97706] mx-auto" />
            <p className="mt-3 text-xs font-semibold text-[#8C522B]">Cargando inventario de materias primas...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Vista Móvil: Tarjetas Estandarizadas ── */}
          <div className="md:hidden space-y-4">
            {paginatedRawInventory.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706] mx-auto mb-4">
                  <Package className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-[#2B170F] mb-1">
                  No se encontraron materias primas
                </h3>
                <p className="text-xs text-[#6E5545] mb-4 max-w-sm mx-auto">
                  Ajusta la búsqueda o crea tu primer insumo para control de stock.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs text-xs h-11 px-5"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Insumo
                </Button>
              </div>
            ) : (
              paginatedRawInventory.map((item) => {
                const isActive = isRawMaterialActive(item.rawMaterial.id)

                return (
                  <AdminEntityCard
                    key={`m-raw-${item.id}`}
                    dimmed={!isActive}
                    image={
                      <div className="h-11 w-11 bg-[#FAF0E6] text-[#D97706] rounded-xl flex items-center justify-center">
                        <Package className="h-5 w-5" />
                      </div>
                    }
                    title={item.rawMaterial.name}
                    subtitle={item.branch.name}
                    badges={
                      !isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground">
                          Inactivo
                        </span>
                      ) : item.isLow ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />
                          Stock Bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Suficiente
                        </span>
                      )
                    }
                    meta={[
                      {
                        label: "Existencia Actual",
                        value: `${Number(item.quantity).toFixed(2)} ${item.rawMaterial.baseUnit}`,
                        alert: item.isLow && isActive,
                        highlight: !item.isLow && isActive,
                      },
                      {
                        label: "Stock Mínimo",
                        value: item.rawMaterial.minStock 
                          ? `${Number(item.rawMaterial.minStock).toFixed(0)} ${item.rawMaterial.baseUnit}` 
                          : "N/A",
                      },
                    ]}
                    actions={
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(item.rawMaterial.id)}
                          className="flex-1 h-10 px-3 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] font-bold text-xs"
                        >
                          <Edit2 className="h-4 w-4 mr-1 text-[#8C522B]" />
                          Editar
                        </Button>
                        {isActive ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openPurchaseModal(item)}
                              className="flex-1 h-10 px-3 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Compra
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDeactivateTarget({ id: item.rawMaterial.id, name: item.rawMaterial.name })}
                              className="h-10 px-3 border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs"
                            >
                              <PowerOff className="h-4 w-4 mr-1" />
                              Desactivar
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivateMaterial(item.rawMaterial.id, item.rawMaterial.name)}
                            className="flex-1 h-10 px-3 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Reactivar
                          </Button>
                        )}
                      </>
                    }
                  />
                )
              })
            )}
          </div>

          {/* ── Vista Desktop: Tabla Limpia ── */}
          <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-[#E8DCCB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#FAF5EE] border-b border-[#E8DCCB]">
                  <tr>
                    <th className="py-3.5 px-5 text-xs font-bold text-[#8C522B] uppercase tracking-wider">Insumo</th>
                    <th className="py-3.5 px-5 text-xs font-bold text-[#8C522B] uppercase tracking-wider">Sucursal</th>
                    <th className="py-3.5 px-5 text-center text-xs font-bold text-[#8C522B] uppercase tracking-wider">Existencia</th>
                    <th className="py-3.5 px-5 text-center text-xs font-bold text-[#8C522B] uppercase tracking-wider">Stock Mínimo</th>
                    <th className="py-3.5 px-5 text-center text-xs font-bold text-[#8C522B] uppercase tracking-wider">Estado</th>
                    <th className="py-3.5 px-5 text-right text-xs font-bold text-[#8C522B] uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DCCB]/60">
                  {paginatedRawInventory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#8C522B]">
                        <Package className="h-10 w-10 mx-auto mb-2 text-[#DECDBB]" />
                        <p className="text-sm font-semibold">No se encontraron materias primas con los filtros actuales</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRawInventory.map((item, index) => {
                      const isActive = isRawMaterialActive(item.rawMaterial.id)

                      return (
                        <tr
                          key={`raw-${item.id}`}
                          className={`hover:bg-[#FAF5EE]/50 transition-colors ${
                            !isActive ? "bg-[#FAF5EE]/30 opacity-70" : index % 2 === 1 ? "bg-[#FAF5EE]/20" : ""
                          }`}
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-[#FAF0E6] text-[#D97706] rounded-xl flex items-center justify-center shrink-0">
                                <Package className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-[#2B170F]">{item.rawMaterial.name}</p>
                                <p className="text-xs text-[#8C522B] font-mono">Unidad base: {item.rawMaterial.baseUnit}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-sm font-medium text-[#2B170F]">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#FAF0E6] text-[#D97706] border border-[#E8DCCB]">
                              {item.branch.name}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`font-mono text-sm font-bold ${
                              item.isLow && isActive ? "text-red-600" : "text-[#2B170F]"
                            }`}>
                              {Number(item.quantity).toFixed(2)} {item.rawMaterial.baseUnit}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center text-xs text-[#6E5545] font-mono font-medium">
                            {item.rawMaterial.minStock ? `${Number(item.rawMaterial.minStock).toFixed(0)} ${item.rawMaterial.baseUnit}` : "N/A"}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                              !isActive 
                                ? 'bg-muted text-muted-foreground' 
                                : item.isLow 
                                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {!isActive ? (
                                'Inactivo'
                              ) : item.isLow ? (
                                <>
                                  <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />
                                  Stock Bajo
                                </>
                              ) : (
                                'Suficiente'
                              )}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(item.rawMaterial.id)}
                                className="h-9 px-2.5 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] font-bold text-xs"
                              >
                                <Edit2 className="h-3.5 w-3.5 mr-1 text-[#8C522B]" />
                                Editar
                              </Button>
                              {isActive ? (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openPurchaseModal(item)}
                                    className="h-9 px-2.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs"
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Compra
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeactivateTarget({ id: item.rawMaterial.id, name: item.rawMaterial.name })}
                                    className="h-9 px-2.5 border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs"
                                  >
                                    <PowerOff className="h-3.5 w-3.5 mr-1" />
                                    Desactivar
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReactivateMaterial(item.rawMaterial.id, item.rawMaterial.name)}
                                  className="h-9 px-2.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                  Reactivar
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Paginación Estandarizada ── */}
          {totalRawPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl shadow-xs border border-[#E8DCCB] px-6 py-4">
              <p className="text-xs font-semibold text-[#8C522B]">
                Página {currentPage} de {totalRawPages} ({filteredRawInventory.length} registros)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl h-9 px-3 text-xs font-bold"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalRawPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalRawPages, prev + 1))}
                  className="border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] rounded-xl h-9 px-3 text-xs font-bold"
                >
                  Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Confirm Dialog para Desactivar Materia Prima ── */}
      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivateConfirm}
        title="Desactivar Materia Prima"
        message={`¿Estás seguro de desactivar "${deactivateTarget?.name}"? Esta acción ocultará el insumo para nuevas compras pero mantendrá intactas todas las recetas pasadas, existencias e inventarios.`}
        confirmText="Desactivar"
        isLoading={isDeactivating}
        variant="danger"
      />

      {/* ── MODAL 1: Registrar Compra / Entrada Rápida de Insumo ── */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E8DCCB] max-w-md w-full p-6 relative overflow-hidden">
            <h3 className="text-lg font-bold text-[#2B170F] mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Registrar Entrada / Compra de Insumo
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
                <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">Materia Prima *</label>
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
                  className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white"
                  required
                >
                  <option value="" disabled>Seleccione materia prima...</option>
                  {rawMaterials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} (Base: {m.baseUnit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">Cantidad *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-10 px-3"
                    value={purchaseQuantity || ""}
                    onChange={(e) => setPurchaseQuantity(Number(e.target.value))}
                    placeholder="Ej: 50"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">Unidad *</label>
                  <select
                    value={purchaseUnit}
                    onChange={(e) => setPurchaseUnit(e.target.value)}
                    className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-10"
                    required
                  >
                    <option value="LIBRA">Libra (LB)</option>
                    <option value="ARROBA">Arroba (@ = 25 LB)</option>
                    <option value="QUINTAL">Quintal (QQ = 100 LB)</option>
                    <option value="LITRO">Litro (1000 ML)</option>
                    <option value="GALON">Galón (3785 ML)</option>
                    <option value="UNIDAD">Unidad (1 UNIT)</option>
                    <option value="CARTON">Cartón (30 UNIT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">Sucursal Destino *</label>
                <select
                  value={purchaseBranchId}
                  onChange={(e) => setPurchaseBranchId(Number(e.target.value))}
                  className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white"
                  required
                >
                  <option value="" disabled>Seleccione sucursal...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[#E8DCCB]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPurchaseModal(false)}
                  disabled={isPurchaseSubmitting}
                  className="h-10 px-4 border-[#DECDBB]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="h-10 px-5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs"
                  disabled={isPurchaseSubmitting}
                >
                  {isPurchaseSubmitting ? "Registrando..." : "Guardar Entrada"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Crear Nueva Materia Prima ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E8DCCB] max-w-md w-full p-6 relative overflow-hidden">
            <h3 className="text-lg font-bold text-[#2B170F] mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-[#D97706]" />
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
                <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">Nombre del Insumo *</label>
                <input
                  placeholder="Ej: Harina de Trigo Especial, Azúcar Morena..."
                  className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-10 px-3"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">Unidad Base *</label>
                  <select
                    value={newBaseUnit}
                    onChange={(e) => setNewBaseUnit(e.target.value as any)}
                    className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-10"
                    required
                  >
                    <option value="LB">Libra (LB)</option>
                    <option value="ML">Mililitro (ML)</option>
                    <option value="UNIT">Unidad (UNIT)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">Costo Unitario (Q) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-10 px-3"
                    value={newCost || ""}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">Stock de Alerta Mínima *</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-10 px-3"
                  value={newMinStock || ""}
                  onChange={(e) => setNewMinStock(Number(e.target.value))}
                  required
                />
                <p className="text-[11px] text-[#8C522B] mt-1">El sistema alertará cuando la existencia en cualquier sucursal sea menor a este umbral.</p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[#E8DCCB]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreateSubmitting}
                  className="h-10 px-4 border-[#DECDBB]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="h-10 px-5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs"
                  disabled={isCreateSubmitting}
                >
                  {isCreateSubmitting ? "Creando..." : "Crear Insumo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Editar Materia Prima ── */}
      {showEditModal && editingMaterial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E8DCCB] max-w-md w-full p-6 relative overflow-hidden">
            <h3 className="text-lg font-bold text-[#2B170F] mb-4 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-[#D97706]" />
              Editar Materia Prima
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">Nombre del Insumo *</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-10 px-3"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">Unidad Base</label>
                  <input
                    value={editingMaterial.baseUnit}
                    readOnly
                    className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm bg-[#FAF5EE] text-[#6E5545] font-mono h-10 px-3"
                  />
                  <p className="text-[10px] text-[#8C522B] mt-1">Fija para proteger recetas.</p>
                </div>
                <div>
                  <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">Costo Unitario (Q) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={editCost}
                    onChange={(e) => setEditCost(Number(e.target.value))}
                    className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-10 px-3"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">Stock de Alerta Mínima *</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={editMinStock}
                  onChange={(e) => setEditMinStock(Number(e.target.value))}
                  className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-10 px-3"
                  required
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-[#2B170F] cursor-pointer pt-1 font-medium">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#D97706] rounded focus:ring-[#D97706]"
                />
                Insumo Activo para compras y recetas
              </label>

              <div className="flex gap-3 justify-end pt-4 border-t border-[#E8DCCB]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowEditModal(false); setEditingMaterial(null) }}
                  disabled={isEditSubmitting}
                  className="h-10 px-4 border-[#DECDBB]"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="h-10 px-5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs" 
                  disabled={isEditSubmitting}
                >
                  {isEditSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
