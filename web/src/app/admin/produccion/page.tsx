"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Flame,
  Plus,
  Minus,
  Loader as Loader2,
  Clock,
  ChefHat,
  Search,
  X,
  Check,
  Trash2,
  ListChecks,
  AlertTriangle,
  Store,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { branchesService, productionService } from "@/lib/api"
import type { ApiBranch, Recipe, ProductionLog } from "@/lib/api"
import { productionPresentations } from "@/lib/presentation-quantities"

interface BatchItemState {
  recipeId: number
  traysProduced: number
  productionQuantity?: number
  productionPresentationId?: number
  note?: string
}

export default function ProduccionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [todayLogs, setTodayLogs] = useState<ProductionLog[]>([])
  const [branches, setBranches] = useState<ApiBranch[]>([])
  const [branchId, setBranchId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado de la Tanda Multi-Amasijo
  const [batchItems, setBatchItems] = useState<Record<number, BatchItemState>>({})
  const [batchGlobalNote, setBatchGlobalNote] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "in_batch">("all")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{
    current: number
    total: number
    recipeName?: string
  } | null>(null)

  // Guard: solo BAKER, MANAGER, ADMIN
  useEffect(() => {
    if (user && !["ADMIN", "MANAGER", "BAKER"].includes(user.role)) {
      router.push("/admin")
    }
  }, [user, router])

  const loadData = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const [recipesData, logsData, branchesData] = await Promise.all([
        productionService.getRecipes(),
        productionService.getTodayProduction(),
        user.role === "ADMIN" || user.role === "MANAGER"
          ? branchesService.list()
          : Promise.resolve([] as ApiBranch[]),
      ])
      setRecipes(recipesData)
      setTodayLogs(logsData)
      setBranches(branchesData)

      const assignedBranchId = user.branch?.id ?? user.branchId ?? null
      setBranchId((current) =>
        user.role === "ADMIN" || user.role === "MANAGER"
          ? current ?? assignedBranchId ?? (branchesData.length === 1 ? branchesData[0].id : null)
          : assignedBranchId
      )
    } catch (error) {
      console.error("Error loading data:", error)
      showToast("Error al cargar datos", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showToast, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Helper para presentaciones de producción de cada receta
  const getRecipePresentationData = useCallback((recipe: Recipe) => {
    const selectedProductionPresentation = [...productionPresentations({
      id: recipe.product.id,
      name: recipe.product.name,
      slug: recipe.product.slug,
      description: "",
      price: 0,
      mainImage: "",
      category: "",
      stock: 1,
      isAvailable: true,
      isFeatured: false,
      presentations: recipe.product.presentations,
    })].sort((a, b) => b.unitsInStock - a.unitsInStock)[0]

    const presentationsPerTray =
      selectedProductionPresentation && recipe.product.unitsPerTray
        ? recipe.product.unitsPerTray / selectedProductionPresentation.unitsInStock
        : 0

    const hasPresentation = Boolean(selectedProductionPresentation && presentationsPerTray > 0)
    const unitLabel = selectedProductionPresentation
      ? selectedProductionPresentation.name
      : "latas"

    return {
      presentation: selectedProductionPresentation,
      presentationsPerTray,
      hasPresentation,
      unitLabel,
    }
  }, [])

  // Modificar cantidad de una receta específica en la tanda
  const updateRecipeQuantity = (recipe: Recipe, newQuantity: number) => {
    const { presentation, presentationsPerTray, hasPresentation } = getRecipePresentationData(recipe)
    const validQty = Math.max(0, newQuantity)

    setBatchItems((prev) => {
      const updated = { ...prev }
      if (validQty <= 0) {
        delete updated[recipe.id]
      } else {
        if (hasPresentation) {
          updated[recipe.id] = {
            recipeId: recipe.id,
            productionPresentationId: presentation?.id,
            productionQuantity: validQty,
            traysProduced: presentationsPerTray > 0 ? validQty / presentationsPerTray : 0,
            note: updated[recipe.id]?.note || "",
          }
        } else {
          updated[recipe.id] = {
            recipeId: recipe.id,
            traysProduced: validQty,
            productionQuantity: 0,
            note: updated[recipe.id]?.note || "",
          }
        }
      }
      return updated
    })
  }

  // Agregar o alternar receta en la tanda con su rendimiento estándar
  const handleToggleRecipe = (recipe: Recipe) => {
    if (batchItems[recipe.id]) {
      setBatchItems((prev) => {
        const updated = { ...prev }
        delete updated[recipe.id]
        return updated
      })
    } else {
      const { presentation, presentationsPerTray, hasPresentation } = getRecipePresentationData(recipe)
      const initialTrays = recipe.standardTrays || 1
      const initialQty =
        hasPresentation && presentationsPerTray > 0
          ? initialTrays * presentationsPerTray
          : 0

      setBatchItems((prev) => ({
        ...prev,
        [recipe.id]: {
          recipeId: recipe.id,
          traysProduced: initialTrays,
          productionPresentationId: presentation?.id,
          productionQuantity: hasPresentation ? initialQty : undefined,
          note: "",
        },
      }))
    }
  }

  // Incrementar o decrementar paso
  const handleStepQuantity = (recipe: Recipe, delta: number) => {
    const { presentationsPerTray, hasPresentation } = getRecipePresentationData(recipe)
    const currentItem = batchItems[recipe.id]

    if (!currentItem) {
      if (delta > 0) handleToggleRecipe(recipe)
      return
    }

    if (hasPresentation) {
      const step = presentationsPerTray > 0 ? presentationsPerTray : 1
      const currentQty = currentItem.productionQuantity || 0
      updateRecipeQuantity(recipe, currentQty + delta * step)
    } else {
      const currentTrays = currentItem.traysProduced || 0
      updateRecipeQuantity(recipe, currentTrays + delta)
    }
  }

  // Lista activa de items en la tanda
  const batchList = useMemo(() => {
    return Object.values(batchItems).filter((item) => {
      return (item.productionQuantity ?? item.traysProduced) > 0
    })
  }, [batchItems])

  const totalSelectedRecipes = batchList.length

  const totalTraysCalculated = useMemo(() => {
    return batchList.reduce((sum, item) => sum + (item.traysProduced || 0), 0)
  }, [batchList])

  const totalUnitsCalculated = useMemo(() => {
    return batchList.reduce((sum, item) => {
      const recipe = recipes.find((r) => r.id === item.recipeId)
      if (!recipe) return sum
      const { presentation, hasPresentation } = getRecipePresentationData(recipe)
      if (hasPresentation && presentation && item.productionQuantity) {
        return sum + item.productionQuantity * presentation.unitsInStock
      }
      return sum + (item.traysProduced || 0) * (recipe.product.unitsPerTray || 0)
    }, 0)
  }, [batchList, recipes, getRecipePresentationData])

  // Filtrado de recetas en la vista
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      if (!recipe.isActive) return false

      if (activeFilterTab === "in_batch" && !batchItems[recipe.id]) {
        return false
      }

      if (!searchQuery.trim()) return true

      const query = searchQuery.toLowerCase()
      const matchName = recipe.name.toLowerCase().includes(query)
      const matchProduct = recipe.product.name.toLowerCase().includes(query)
      const matchIngredient = recipe.ingredients.some((ing) =>
        ing.rawMaterial.name.toLowerCase().includes(query)
      )

      return matchName || matchProduct || matchIngredient
    })
  }, [recipes, activeFilterTab, batchItems, searchQuery])

  // Registrar toda la tanda
  const handleRegisterBatch = async () => {
    if (batchList.length === 0 || isSubmitting) return

    if (!branchId) {
      showToast(
        user?.role === "ADMIN" || user?.role === "MANAGER"
          ? "Selecciona la sucursal donde se registrará el horneado"
          : "Tu usuario no tiene una sucursal asignada",
        "error"
      )
      return
    }

    setIsSubmitting(true)
    setBatchProgress({ current: 0, total: batchList.length })

    try {
      const payloadItems = batchList.map((item) => {
        const recipe = recipes.find((r) => r.id === item.recipeId)!
        const { presentation, presentationsPerTray, hasPresentation } = getRecipePresentationData(recipe)

        const itemNoteParts = [batchGlobalNote.trim(), item.note?.trim()].filter(Boolean)
        const combinedNote = itemNoteParts.length > 0 ? itemNoteParts.join(" - ") : undefined

        if (hasPresentation && presentation && item.productionQuantity) {
          return {
            recipeId: item.recipeId,
            branchId,
            productionPresentationId: presentation.id,
            productionQuantity: item.productionQuantity,
            traysProduced: presentationsPerTray > 0 ? item.productionQuantity / presentationsPerTray : undefined,
            note: combinedNote,
          }
        }

        return {
          recipeId: item.recipeId,
          branchId,
          traysProduced: item.traysProduced,
          note: combinedNote,
        }
      })

      const response = await productionService.registerBatch(
        payloadItems,
        (current, total) => {
          const itemBeingProcessed = payloadItems[current - 1]
          const recipeInfo = recipes.find((r) => r.id === itemBeingProcessed.recipeId)
          setBatchProgress({
            current,
            total,
            recipeName: recipeInfo?.name || "Amasijo",
          })
        }
      )

      if (response.failedCount === 0) {
        showToast(
          `Tanda completada: Se registraron ${response.successCount} amasijos con éxito (${totalTraysCalculated.toFixed(1)} latas)`,
          "success"
        )
        setBatchItems({})
        setBatchGlobalNote("")
        setShowReviewModal(false)
      } else if (response.successCount > 0) {
        showToast(
          `Registro parcial: ${response.successCount} registrados, ${response.failedCount} con error.`,
          "error"
        )
        // Mantener solo los que fallaron para que el usuario pueda corregirlos
        const failedIds = new Set(
          response.results.filter((r) => !r.success).map((r) => r.recipeId)
        )
        setBatchItems((prev) => {
          const remaining: Record<number, BatchItemState> = {}
          for (const id of Object.keys(prev).map(Number)) {
            if (failedIds.has(id)) remaining[id] = prev[id]
          }
          return remaining
        })
      } else {
        const firstError = response.results.find((r) => !r.success)?.error || "Error al registrar horneado"
        showToast(firstError, "error")
      }

      // Recargar logs del día
      const logsData = await productionService.getTodayProduction()
      setTodayLogs(logsData)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al procesar la tanda"
      showToast(msg, "error")
    } finally {
      setIsSubmitting(false)
      setBatchProgress(null)
    }
  }

  const todayTotalUnits = todayLogs.reduce((sum, log) => sum + log.unitsProduced, 0)
  const todayTotalTrays = todayLogs.reduce((sum, log) => sum + log.traysProduced, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D97706]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-32">
      {/* ─── Encabezado Estandarizado ─── */}
      <AdminPageHeader
        title="Registro de Horneado"
        description="Selecciona los amasijos producidos, ajusta las latas de cada uno y registra la tanda completa en una sola acción"
        icon={<Flame className="h-6 w-6 text-[#D97706]" />}
        breadcrumbs={[
          { label: "Operación", href: "/admin" },
          { label: "Horneado" },
        ]}
        secondaryAction={{
          label: "Ver Recetas",
          href: "/admin/recetas",
          icon: <ChefHat className="h-4 w-4 mr-1.5" />,
          variant: "outline",
        }}
      />

      {/* ─── Selector de Sucursal (ADMIN / MANAGER) ─── */}
      {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
        <div className="rounded-2xl border border-[#DECDBB] bg-[#FAF5EE] p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <Store className="h-5 w-5 text-[#8C522B]" />
              <label htmlFor="production-branch" className="text-xs font-bold uppercase tracking-wider text-[#2B170F]">
                Sucursal destino:
              </label>
            </div>
            <select
              id="production-branch"
              value={branchId ?? ""}
              onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
              className="w-full sm:w-72 h-11 px-3 text-xs sm:text-sm border border-[#DECDBB] rounded-xl bg-white text-[#2B170F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706] cursor-pointer"
              required
            >
              <option value="">Selecciona una sucursal...</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-[#8C522B] sm:ml-auto">
              Se descontarán materias primas y se sumará el producto terminado en esta sucursal.
            </span>
          </div>
        </div>
      )}

      {/* ─── Buscador y Filtros Rápidos de Fórmulas ─── */}
      <div className="bg-white rounded-2xl border border-[#E8DCCB] p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Buscador */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C522B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por receta, pan o materia prima..."
              className="w-full pl-9 pr-9 h-11 bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-xs sm:text-sm text-[#2B170F] font-medium placeholder:text-[#8C522B]/60 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C522B] hover:text-[#2B170F]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Chips de filtro */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveFilterTab("all")}
              className={`h-11 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
                activeFilterTab === "all"
                  ? "bg-[#D97706] text-white shadow-2xs"
                  : "bg-[#FAF5EE] text-[#6E5545] hover:bg-[#F3E9DC] border border-[#DECDBB]"
              }`}
            >
              Todas ({recipes.filter((r) => r.isActive).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab("in_batch")}
              className={`h-11 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
                activeFilterTab === "in_batch"
                  ? "bg-[#D97706] text-white shadow-2xs"
                  : "bg-[#FAF5EE] text-[#6E5545] hover:bg-[#F3E9DC] border border-[#DECDBB]"
              }`}
            >
              En Tanda ({totalSelectedRecipes})
            </button>
            {totalSelectedRecipes > 0 && (
              <button
                type="button"
                onClick={() => setBatchItems({})}
                className="h-11 px-3 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-all"
                title="Limpiar toda la tanda"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Nota Global de la Tanda */}
        <div className="pt-2 border-t border-[#FAF0E6]">
          <input
            type="text"
            value={batchGlobalNote}
            onChange={(e) => setBatchGlobalNote(e.target.value)}
            placeholder="Nota general para la tanda (opcional, ej: Horneada mañana, turno tarde...)"
            className="w-full px-3.5 h-10 text-xs bg-[#FAF5EE]/70 border border-[#DECDBB]/80 rounded-xl text-[#2B170F] placeholder:text-[#8C522B]/50 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30"
          />
        </div>
      </div>

      {/* ─── Catálogo de Amasijos Disponibles ─── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-[#2B170F] uppercase tracking-wider">
            Amasijos Disponibles para Hornear
          </h2>
          <span className="text-xs text-[#8C522B] font-medium">
            {filteredRecipes.length} fórmula{filteredRecipes.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12 text-[#6E5545] bg-white rounded-2xl border border-dashed border-[#DECDBB] p-6">
            <ChefHat className="h-10 w-10 text-[#DECDBB] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#2B170F]">No se encontraron fórmulas</p>
            <p className="text-xs text-[#6E5545] mt-1">
              {searchQuery
                ? "No hay recetas que coincidan con la búsqueda actual."
                : "No hay recetas marcadas en la tanda actualmente."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => {
              const itemInBatch = batchItems[recipe.id]
              const isInBatch = Boolean(itemInBatch)
              const { presentation, presentationsPerTray, hasPresentation, unitLabel } =
                getRecipePresentationData(recipe)

              // Cantidad actual ingresada
              const currentQuantity = hasPresentation
                ? itemInBatch?.productionQuantity || 0
                : itemInBatch?.traysProduced || 0

              // Piezas calculadas
              const calculatedPieces = hasPresentation && presentation
                ? currentQuantity * presentation.unitsInStock
                : currentQuantity * (recipe.product.unitsPerTray || 0)

              // Latas calculadas
              const calculatedTrays = hasPresentation && presentationsPerTray > 0
                ? currentQuantity / presentationsPerTray
                : currentQuantity

              return (
                <div
                  key={recipe.id}
                  className={`rounded-2xl p-4 sm:p-5 border-2 transition-all flex flex-col justify-between ${
                    isInBatch
                      ? "border-[#D97706] bg-[#FAF0E6]/40 shadow-xs ring-1 ring-[#D97706]/30"
                      : "border-[#E8DCCB] bg-white hover:border-[#DECDBB] hover:shadow-2xs"
                  }`}
                >
                  {/* Encabezado de la Tarjeta */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#2B170F] text-base truncate" title={recipe.name}>
                          {recipe.name}
                        </p>
                        <p className="text-xs text-[#6E5545] truncate mt-0.5">
                          Producto: <strong className="text-[#2B170F]">{recipe.product.name}</strong>
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                          isInBatch
                            ? "bg-[#D97706] text-white shadow-2xs"
                            : "bg-[#FAF5EE] text-[#8C522B] border border-[#DECDBB]"
                        }`}
                      >
                        {isInBatch ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> En Tanda
                          </>
                        ) : (
                          <>Fórmula: {recipe.standardTrays} latas</>
                        )}
                      </span>
                    </div>

                    {/* Rendimiento Base y Razón de Conversión */}
                    <div className="mt-2 text-xs text-[#8C522B] flex flex-wrap gap-x-3 gap-y-1">
                      {recipe.product.unitsPerTray && (
                        <span>
                          Rinde: <strong>{recipe.product.unitsPerTray} uds/lata</strong>
                        </span>
                      )}
                      {hasPresentation && (
                        <span className="text-[#D97706] font-medium">
                          ({presentationsPerTray} {unitLabel.toLowerCase()}/lata)
                        </span>
                      )}
                    </div>

                    {/* Ingredientes de la fórmula */}
                    <div className="mt-3 flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1">
                      {recipe.ingredients.map((ing) => (
                        <span
                          key={ing.rawMaterialId}
                          className="text-[10px] font-semibold bg-[#FAF5EE] text-[#8C522B] border border-[#E8DCCB] px-2 py-0.5 rounded-lg"
                        >
                          {ing.rawMaterial.name}: {Number(ing.quantity)} {ing.rawMaterial.baseUnit}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ─── Control de Cantidad (Independiente por Amasijo) ─── */}
                  <div className="mt-4 pt-3 border-t border-[#E8DCCB]/60">
                    {!isInBatch ? (
                      <Button
                        type="button"
                        onClick={() => handleToggleRecipe(recipe)}
                        variant="outline"
                        className="w-full h-11 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] hover:border-[#D97706] font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <Plus className="h-4 w-4 text-[#D97706]" />
                        Agregar a la Tanda ({recipe.standardTrays} {unitLabel})
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {/* Botón Decrementar */}
                          <button
                            type="button"
                            onClick={() => handleStepQuantity(recipe, -1)}
                            className="h-11 w-11 rounded-xl bg-white hover:bg-[#FAF5EE] border border-[#DECDBB] text-[#2B170F] font-bold flex items-center justify-center active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="h-5 w-5 text-[#8C522B]" />
                          </button>

                          {/* Campo numérico directo */}
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              min="0"
                              value={currentQuantity === 0 ? "" : currentQuantity}
                              onChange={(e) =>
                                updateRecipeQuantity(recipe, parseInt(e.target.value) || 0)
                              }
                              placeholder="0"
                              className="w-full h-11 text-center font-bold text-lg bg-white border-2 border-[#D97706] rounded-xl text-[#2B170F] focus:outline-none shadow-inner"
                            />
                            <span className="text-[10px] font-bold text-[#8C522B] uppercase tracking-wider block text-center mt-0.5">
                              {unitLabel}
                            </span>
                          </div>

                          {/* Botón Incrementar */}
                          <button
                            type="button"
                            onClick={() => handleStepQuantity(recipe, 1)}
                            className="h-11 w-11 rounded-xl bg-[#FAF0E6] hover:bg-[#ECCDB5] border border-[#DECDBB] text-[#D97706] font-bold flex items-center justify-center active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="h-5 w-5" />
                          </button>

                          {/* Botón Quitar de la Tanda */}
                          <button
                            type="button"
                            onClick={() => updateRecipeQuantity(recipe, 0)}
                            className="h-11 w-10 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 flex items-center justify-center active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
                            title="Quitar de la tanda"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Resultado Total en Piezas del Amasijo */}
                        <div className="bg-white/80 rounded-xl px-3 py-1.5 border border-[#DECDBB]/50 flex items-center justify-between text-xs">
                          <span className="text-[#8C522B]">Salida calculada:</span>
                          <span className="font-bold text-[#D97706]">
                            {calculatedPieces.toLocaleString()} piezas ({calculatedTrays.toFixed(1)} latas)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── HISTORIAL DE HOY (COLAPSABLE / RESUMEN) ─── */}
      <div className="bg-white rounded-2xl border border-[#E8DCCB] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8DCCB] bg-[#FAF5EE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#8C522B]" />
            <h2 className="font-bold text-xs sm:text-sm text-[#2B170F]">Producción Registrada Hoy</h2>
          </div>
          <div className="flex gap-3 text-xs font-bold">
            <span className="text-[#6E5545]">
              <span className="text-[#2B170F]">{todayTotalTrays}</span> latas
            </span>
            <span className="text-[#D97706]">
              {todayTotalUnits.toLocaleString()} uds
            </span>
          </div>
        </div>

        {todayLogs.length === 0 ? (
          <div className="p-8 text-center text-[#6E5545]">
            <Flame className="h-8 w-8 mx-auto mb-2 text-[#DECDBB]" />
            <p className="text-xs font-bold text-[#2B170F]">Aún no se ha registrado producción hoy</p>
            <p className="text-[11px] text-[#6E5545] mt-0.5">Los amasijos registrados aparecerán aquí.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8DCCB] max-h-72 overflow-y-auto">
            {todayLogs.map((log) => (
              <div
                key={log.id}
                className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF5EE]/40 transition-colors min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-[#2B170F] truncate">{log.recipe.name}</p>
                  <p className="text-[11px] text-[#6E5545] truncate">
                    {log.recipe.product.name} • {log.user.firstName} {log.user.lastName} •{" "}
                    {new Date(log.createdAt).toLocaleTimeString("es-GT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {log.note ? ` • Nota: ${log.note}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-xs text-[#2B170F]">
                    {log.presentationQuantity && log.presentationName
                      ? `${log.presentationQuantity} ${log.presentationName}`
                      : `${log.traysProduced} latas`}
                  </p>
                  <p className="text-[11px] text-[#D97706] font-bold">
                    {log.unitsProduced.toLocaleString()} uds
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── BARRA FLOTANTE FIJA INFERIOR (RESUMEN DE TANDA) ─── */}
      {totalSelectedRecipes > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-[#D97706] shadow-2xl p-3 sm:p-4 animate-slideUp">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Información en tiempo real */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#FAF0E6] border border-[#DECDBB] text-[#D97706] flex items-center justify-center shrink-0">
                <Flame className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#8C522B] uppercase tracking-wider">
                  Tanda en Preparación:
                </p>
                <p className="text-sm sm:text-base font-bold text-[#2B170F] truncate">
                  <span className="text-[#D97706] font-black">{totalSelectedRecipes}</span> amasijo
                  {totalSelectedRecipes !== 1 ? "s" : ""} ·{" "}
                  <span className="text-[#2B170F]">{totalTraysCalculated.toFixed(1)}</span> latas (
                  {totalUnitsCalculated.toLocaleString()} piezas)
                </p>
              </div>
            </div>

            {/* Acciones principales */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReviewModal(true)}
                className="flex-1 sm:flex-initial h-12 px-4 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] font-bold text-xs rounded-xl shadow-xs"
              >
                <ListChecks className="h-4 w-4 mr-1.5 text-[#8C522B]" />
                Ver Detalle ({totalSelectedRecipes})
              </Button>

              <Button
                type="button"
                onClick={handleRegisterBatch}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial h-12 px-6 bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-sm rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Registrando Tanda...
                  </>
                ) : (
                  <>
                    <Flame className="h-5 w-5 mr-2" />
                    Registrar Tanda Completa
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DETALLE Y REVISIÓN DE TANDA ─── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl max-h-[calc(100dvh-2rem)] flex flex-col rounded-2xl border border-[#E8DCCB] bg-white shadow-2xl overflow-hidden">
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-[#E8DCCB] p-4 sm:p-5 bg-[#FAF5EE]/70 shrink-0">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-[#D97706]" />
                <div>
                  <h3 className="text-base font-bold text-[#2B170F]">Detalle de la Tanda a Registrar</h3>
                  <p className="text-xs text-[#8C522B]">
                    {totalSelectedRecipes} amasijos seleccionados · Total: {totalTraysCalculated.toFixed(1)} latas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 text-[#8C522B] hover:text-[#2B170F] rounded-lg hover:bg-[#FAF5EE]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lista Desglosada */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {batchList.map((item) => {
                const recipe = recipes.find((r) => r.id === item.recipeId)
                if (!recipe) return null
                const { unitLabel } = getRecipePresentationData(recipe)

                return (
                  <div
                    key={item.recipeId}
                    className="p-3.5 rounded-xl border border-[#DECDBB] bg-[#FAF5EE]/50 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs sm:text-sm text-[#2B170F] truncate">{recipe.name}</p>
                      <p className="text-[11px] text-[#6E5545] truncate">
                        Producto: {recipe.product.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-bold text-sm text-[#D97706]">
                          {item.productionQuantity || item.traysProduced} {unitLabel}
                        </span>
                        <span className="block text-[10px] text-[#8C522B]">
                          {(item.traysProduced || 0).toFixed(1)} latas
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateRecipeQuantity(recipe, 0)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        title="Quitar de la tanda"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Nota Global */}
              <div className="pt-2">
                <label className="text-xs font-bold text-[#2B170F] uppercase tracking-wider block mb-1">
                  Nota general para este horneado:
                </label>
                <input
                  type="text"
                  value={batchGlobalNote}
                  onChange={(e) => setBatchGlobalNote(e.target.value)}
                  placeholder="Ej: Amasijos primera horneada mañana..."
                  className="w-full px-3.5 h-10 text-xs bg-white border border-[#DECDBB] rounded-xl text-[#2B170F]"
                />
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="border-t border-[#E8DCCB] p-4 bg-white flex items-center justify-between gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReviewModal(false)}
                className="h-10 px-4 border-[#DECDBB] text-xs font-bold"
              >
                Volver
              </Button>
              <Button
                type="button"
                onClick={handleRegisterBatch}
                disabled={isSubmitting}
                className="h-10 px-5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Flame className="h-4 w-4 mr-1.5" />
                    Confirmar y Registrar ({totalSelectedRecipes})
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL OVERLAY DE PROGRESO DE ENVÍO ─── */}
      {batchProgress && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#DECDBB] text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF0E6] text-[#D97706] flex items-center justify-center mx-auto">
              <Flame className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#2B170F]">Procesando Tanda de Horneado</h3>
              <p className="text-xs text-[#8C522B] mt-1">
                Registrando {batchProgress.current} de {batchProgress.total}
              </p>
              {batchProgress.recipeName && (
                <p className="text-xs font-bold text-[#D97706] mt-0.5 truncate">
                  {batchProgress.recipeName}
                </p>
              )}
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-[#FAF5EE] rounded-full h-2.5 overflow-hidden border border-[#DECDBB]/60">
              <div
                className="bg-[#D97706] h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((batchProgress.current / batchProgress.total) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-[#6E5545]">
              Actualizando existencias y descontando materias primas...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
