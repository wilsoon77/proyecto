"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Flame, Plus, Minus, Loader as Loader2, Clock, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { branchesService, productionService } from "@/lib/api"
import type { ApiBranch, Recipe, ProductionLog } from "@/lib/api"
import { productionPresentations } from "@/lib/presentation-quantities"

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

  // Form state
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [traysProduced, setTraysProduced] = useState(0)
  const [productionQuantity, setProductionQuantity] = useState(0)
  const [note, setNote] = useState("")

  // Guard: solo BAKER, MANAGER, ADMIN
  useEffect(() => {
    if (user && !['ADMIN', 'MANAGER', 'BAKER'].includes(user.role)) {
      router.push('/admin')
    }
  }, [user, router])

  const loadData = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const [recipesData, logsData, branchesData] = await Promise.all([
        productionService.getRecipes(),
        productionService.getTodayProduction(),
        user.role === 'ADMIN' || user.role === 'MANAGER' ? branchesService.list() : Promise.resolve([] as ApiBranch[]),
      ])
      setRecipes(recipesData)
      setTodayLogs(logsData)
      setBranches(branchesData)

      const assignedBranchId = user.branch?.id ?? user.branchId ?? null
      setBranchId((current) => user.role === 'ADMIN' || user.role === 'MANAGER'
        ? current ?? assignedBranchId ?? (branchesData.length === 1 ? branchesData[0].id : null)
        : assignedBranchId
      )
    } catch (error) {
      console.error('Error loading data:', error)
      showToast('Error al cargar datos', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId)
  const selectedProductionPresentation = selectedRecipe
    ? [...productionPresentations({
        id: selectedRecipe.product.id,
        name: selectedRecipe.product.name,
        slug: selectedRecipe.product.slug,
        description: '',
        price: 0,
        mainImage: '',
        category: '',
        stock: 1,
        isAvailable: true,
        isFeatured: false,
        presentations: selectedRecipe.product.presentations,
      })].sort((a, b) => b.unitsInStock - a.unitsInStock)[0]
    : undefined
  const presentationsPerTray = selectedProductionPresentation && selectedRecipe?.product.unitsPerTray
    ? selectedRecipe.product.unitsPerTray / selectedProductionPresentation.unitsInStock
    : 0

  // Auto-set trays to standardTrays when selecting a recipe
  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id)
    setTraysProduced(recipe.standardTrays)
    const productionPresentation = [...(recipe.product.presentations ?? [])]
      .filter((presentation) => presentation.isActive && presentation.isForProduction)
      .sort((a, b) => b.unitsInStock - a.unitsInStock)[0]
    setProductionQuantity(productionPresentation && recipe.product.unitsPerTray
      ? recipe.standardTrays * recipe.product.unitsPerTray / productionPresentation.unitsInStock
      : 0)
  }

  const handleSubmit = async () => {
    if (!selectedRecipeId || (selectedProductionPresentation ? productionQuantity <= 0 : traysProduced <= 0) || isSubmitting) return
    if (!branchId) {
      showToast(
        user?.role === 'ADMIN' || user?.role === 'MANAGER'
          ? 'Selecciona la sucursal donde se registrará el horneado'
          : 'Tu usuario no tiene una sucursal asignada',
        'error'
      )
      return
    }

    setIsSubmitting(true)
    try {
      const result = await productionService.registerProduction({
        recipeId: selectedRecipeId,
        traysProduced: selectedProductionPresentation && presentationsPerTray > 0 ? productionQuantity / presentationsPerTray : traysProduced,
        productionPresentationId: selectedProductionPresentation?.id,
        productionQuantity: selectedProductionPresentation ? productionQuantity : undefined,
        branchId,
        note: note.trim() || undefined,
      })

      showToast(
        `🔥 ${result.message}`,
        'success'
      )

      // Reset and reload
      setSelectedRecipeId(null)
      setTraysProduced(0)
      setProductionQuantity(0)
      setNote("")
      const logsData = await productionService.getTodayProduction()
      setTodayLogs(logsData)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al registrar producción'
      showToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-[#FAF0E6] text-[#D97706] flex items-center justify-center flex-shrink-0">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2B170F] font-display">Registro de Horneado</h1>
            <p className="text-xs sm:text-sm text-[#6E5545]">Control de amasijos y producción por turno</p>
          </div>
        </div>
      </div>

      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <div className="rounded-2xl border border-[#ECCDB5] bg-[#FAF0E6] p-4 shadow-xs">
          <label htmlFor="production-branch" className="block text-xs font-bold text-[#2B170F] mb-1.5">
            Sucursal donde se horneará
          </label>
          <select
            id="production-branch"
            value={branchId ?? ""}
            onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#DECDBB] rounded-xl bg-white text-[#2B170F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            required
          >
            <option value="">Selecciona una sucursal...</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          <p className="text-[11px] text-[#8C522B] mt-1.5">
            Las materias primas se descontarán y el producto horneado se sumará al inventario de esta sucursal.
          </p>
        </div>
      )}

      {/* ─── PASO 1: Seleccionar Receta ─── */}
      <div>
        <h2 className="text-sm font-bold text-[#2B170F] mb-3">1. Selecciona el amasijo a preparar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => handleSelectRecipe(recipe)}
              className={`text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 ${selectedRecipeId === recipe.id
                  ? 'border-[#D97706] bg-[#FAF0E6] shadow-xs'
                  : 'border-[#E8DCCB] bg-white hover:border-[#DECDBB] hover:shadow-xs'
                }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-[#2B170F] text-base sm:text-lg">{recipe.name}</p>
                  <p className="text-xs text-[#6E5545] mt-0.5">
                    Producto: <span className="font-bold text-[#2B170F]">{recipe.product.name}</span>
                  </p>
                  <p className="text-xs text-[#6E5545] mt-0.5">
                    Rinde: <span className="font-bold text-[#2B170F]">{recipe.standardTrays} latas</span>
                    {recipe.product.unitsPerTray && (
                      <span className="text-[#D97706] font-bold"> ({recipe.standardTrays * recipe.product.unitsPerTray} uds)</span>
                    )}
                  </p>
                </div>
                <ChefHat className={`h-6 w-6 flex-shrink-0 ${selectedRecipeId === recipe.id ? 'text-[#D97706]' : 'text-[#DECDBB]'}`} />
              </div>
              {/* Ingredientes mini */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {recipe.ingredients.map((ing) => (
                  <span key={ing.rawMaterialId} className="text-[11px] font-semibold bg-[#FAF5EE] text-[#8C522B] border border-[#E8DCCB] px-2 py-0.5 rounded-lg">
                    {ing.rawMaterial.name}: {Number(ing.quantity)} {ing.rawMaterial.baseUnit}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
        {recipes.length === 0 && (
          <div className="text-center py-8 text-[#6E5545] bg-white rounded-2xl border border-dashed border-[#DECDBB]">
            <ChefHat className="h-10 w-10 text-[#DECDBB] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#2B170F]">No hay recetas configuradas</p>
            <p className="text-[11px] text-[#6E5545] mt-0.5">Un administrador debe configurar las fórmulas de recetas primero.</p>
          </div>
        )}
      </div>

      {/* ─── PASO 2: Latas Producidas ─── */}
      {selectedRecipe && (
        <div className="bg-white rounded-2xl border border-[#E8DCCB] p-6 shadow-xs">
          <p className="mb-1 text-xs font-bold text-[#D97706] uppercase tracking-wider">
            Registro por: {selectedProductionPresentation?.name ?? 'latas'}
          </p>
          <h2 className="text-base font-bold text-[#2B170F] mb-4">2. ¿Cuántas {selectedProductionPresentation?.name.toLowerCase() ?? 'latas'} salieron?</h2>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => selectedProductionPresentation
                ? setProductionQuantity(Math.max(0, productionQuantity - presentationsPerTray))
                : setTraysProduced(Math.max(0, traysProduced - 1))}
              className="h-14 w-14 rounded-2xl bg-[#FAF5EE] hover:bg-[#F3E9DC] border border-[#DECDBB] flex items-center justify-center transition-all active:scale-95 text-[#2B170F]"
            >
              <Minus className="h-6 w-6" />
            </button>
            <div className="text-center">
              <input
                type="number"
                value={selectedProductionPresentation ? productionQuantity : traysProduced}
                step={selectedProductionPresentation ? presentationsPerTray : 1}
                onChange={(e) => selectedProductionPresentation
                  ? setProductionQuantity(Math.max(0, parseInt(e.target.value) || 0))
                  : setTraysProduced(Math.max(0, parseInt(e.target.value) || 0))}
                className="text-4xl sm:text-5xl font-display font-bold text-[#2B170F] w-28 text-center bg-transparent border-b-2 border-[#D97706] focus:outline-none"
              />
              <p className="text-xs font-bold text-[#8C522B] mt-1">{selectedProductionPresentation?.name ?? 'latas'}</p>
              {selectedRecipe.product.unitsPerTray && (
                <p className="text-base font-bold text-[#D97706] mt-2">
                  = {(selectedProductionPresentation
                    ? productionQuantity * selectedProductionPresentation.unitsInStock
                    : traysProduced * selectedRecipe.product.unitsPerTray).toLocaleString()} {selectedRecipe.product.stockUnitLabel ?? 'unidades'}
                </p>
              )}
              {selectedProductionPresentation && presentationsPerTray > 0 && (
                <p className="text-[11px] text-[#6E5545] mt-1">
                  {presentationsPerTray} {selectedProductionPresentation.name.toLowerCase()} por lata
                </p>
              )}
            </div>
            <button
              onClick={() => selectedProductionPresentation
                ? setProductionQuantity(productionQuantity + presentationsPerTray)
                : setTraysProduced(traysProduced + 1)}
              className="h-14 w-14 rounded-2xl bg-[#FAF0E6] hover:bg-[#ECCDB5] border border-[#DECDBB] text-[#D97706] flex items-center justify-center transition-all active:scale-95"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
          {/* Nota opcional */}
          <div className="mt-6">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota opcional (ej: Horneada extra de la tarde)"
              className="w-full px-4 py-2.5 bg-[#FAF5EE] border border-[#DECDBB] rounded-xl text-xs sm:text-sm text-[#2B170F] placeholder:text-[#8C522B]/60 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706]"
            />
          </div>
        </div>
      )}

      {/* ─── PASO 3: Registrar ─── */}
      {selectedRecipe && (selectedProductionPresentation ? productionQuantity > 0 : traysProduced > 0) && (
        <div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-14 text-base font-bold bg-[#D97706] hover:bg-[#B45309] text-white rounded-2xl shadow-xs active:scale-[0.98] transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Registrando horneado...
              </>
            ) : (
              <>
                <Flame className="h-5 w-5 mr-2" />
                Registrar Horneado
              </>
            )}
          </Button>
        </div>
      )}

      {/* ─── HISTORIAL DE HOY ─── */}
      <div className="bg-white rounded-2xl border border-[#E8DCCB] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8DCCB] bg-[#FAF5EE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#8C522B]" />
            <h2 className="font-bold text-xs sm:text-sm text-[#2B170F]">Producción del Día</h2>
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
          <div className="divide-y divide-[#E8DCCB]">
            {todayLogs.map((log) => (
              <div key={log.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#FAF5EE]/40 transition-colors">
                <div>
                  <p className="font-bold text-xs text-[#2B170F]">{log.recipe.name}</p>
                  <p className="text-[11px] text-[#6E5545]">
                    {log.recipe.product.name} • {log.user.firstName} {log.user.lastName} •{' '}
                    {new Date(log.createdAt).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xs text-[#2B170F]">{log.presentationQuantity && log.presentationName ? `${log.presentationQuantity} ${log.presentationName}` : `${log.traysProduced} latas`}</p>
                  <p className="text-[11px] text-[#D97706] font-bold">{log.unitsProduced.toLocaleString()} uds</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
