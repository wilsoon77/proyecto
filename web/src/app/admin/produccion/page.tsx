"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Flame, Plus, Minus, Loader as Loader2, Clock, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { branchesService, productionService } from "@/lib/api"
import type { ApiBranch, Recipe, ProductionLog } from "@/lib/api"

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
        user.role === 'ADMIN' ? branchesService.list() : Promise.resolve([] as ApiBranch[]),
      ])
      setRecipes(recipesData)
      setTodayLogs(logsData)
      setBranches(branchesData)

      const assignedBranchId = user.branch?.id ?? user.branchId ?? null
      setBranchId((current) => user.role === 'ADMIN'
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

  // Auto-set trays to standardTrays when selecting a recipe
  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id)
    setTraysProduced(recipe.standardTrays)
  }

  const handleSubmit = async () => {
    if (!selectedRecipeId || traysProduced <= 0 || isSubmitting) return
    if (!branchId) {
      showToast(
        user?.role === 'ADMIN'
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
        traysProduced,
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Flame className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Producción</h1>
            <p className="text-muted-foreground">Registra los amasijos del día</p>
          </div>
        </div>
      </div>

      {user?.role === 'ADMIN' && (
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <label htmlFor="production-branch" className="block text-sm font-semibold text-foreground mb-2">
            Sucursal donde se horneará
          </label>
          <select
            id="production-branch"
            value={branchId ?? ""}
            onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Selecciona una sucursal...</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-2">
            Las materias primas se descontarán y el producto terminado se agregará en esta sucursal.
          </p>
        </div>
      )}

      {/* ─── PASO 1: Seleccionar Receta ─── */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">1. Selecciona el amasijo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => handleSelectRecipe(recipe)}
              className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${selectedRecipeId === recipe.id
                  ? 'border-primary bg-accent shadow-md ring-2 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/30 hover:shadow-sm'
                }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-foreground text-lg">{recipe.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Producto: <span className="font-medium text-foreground">{recipe.product.name}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Rinde: <span className="font-medium text-foreground">{recipe.standardTrays} latas</span>
                    {recipe.product.unitsPerTray && (
                      <span className="text-primary"> ({recipe.standardTrays * recipe.product.unitsPerTray} uds)</span>
                    )}
                  </p>
                </div>
                <ChefHat className={`h-6 w-6 ${selectedRecipeId === recipe.id ? 'text-primary' : 'text-muted-foreground/40'}`} />
              </div>
              {/* Ingredientes mini */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {recipe.ingredients.map((ing) => (
                  <span key={ing.rawMaterialId} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {ing.rawMaterial.name}: {Number(ing.quantity)} {ing.rawMaterial.baseUnit}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
        {recipes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground bg-cream rounded-xl border-2 border-dashed border-border">
            <ChefHat className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p>No hay recetas configuradas.</p>
            <p className="text-sm">Un Manager o Admin debe crear las recetas primero.</p>
          </div>
        )}
      </div>

      {/* ─── PASO 2: Latas Producidas ─── */}
      {selectedRecipe && (
        <div className="mb-6 bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">2. ¿Cuántas latas salieron?</h2>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setTraysProduced(Math.max(0, traysProduced - 1))}
              className="h-16 w-16 rounded-full bg-muted hover:bg-border flex items-center justify-center transition-colors active:scale-95"
            >
              <Minus className="h-8 w-8 text-muted-foreground" />
            </button>
            <div className="text-center">
              <input
                type="number"
                value={traysProduced}
                onChange={(e) => setTraysProduced(Math.max(0, parseInt(e.target.value) || 0))}
                className="text-5xl font-bold text-primary w-28 text-center bg-transparent border-b-2 border-primary/30 focus:outline-none focus:border-primary"
              />
              <p className="text-sm text-muted-foreground mt-1">latas</p>
              {selectedRecipe.product.unitsPerTray && (
                <p className="text-lg font-medium text-primary mt-2">
                  = {(traysProduced * selectedRecipe.product.unitsPerTray).toLocaleString()} unidades
                </p>
              )}
            </div>
            <button
              onClick={() => setTraysProduced(traysProduced + 1)}
              className="h-16 w-16 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors active:scale-95"
            >
              <Plus className="h-8 w-8 text-primary" />
            </button>
          </div>
          {/* Nota opcional */}
          <div className="mt-4">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota opcional (ej: Amasijo extra de la tarde)"
              className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* ─── PASO 3: Registrar ─── */}
      {selectedRecipe && traysProduced > 0 && (
        <div className="mb-8">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Flame className="h-6 w-6 mr-3" />
                Registrar Horneado
              </>
            )}
          </Button>
        </div>
      )}

      {/* ─── HISTORIAL DE HOY ─── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground/60" />
            <h2 className="font-semibold text-foreground">Producción de hoy</h2>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              <span className="font-bold text-foreground">{todayTotalTrays}</span> latas
            </span>
            <span className="text-primary font-medium">
              {todayTotalUnits.toLocaleString()} uds
            </span>
          </div>
        </div>

        {todayLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground/60">
            <Flame className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p>Aún no se ha registrado producción hoy</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {todayLogs.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-center justify-between hover:bg-cream">
                <div>
                  <p className="font-medium text-foreground">{log.recipe.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.recipe.product.name} • {log.user.firstName} {log.user.lastName} •{' '}
                    {new Date(log.createdAt).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{log.traysProduced} latas</p>
                  <p className="text-xs text-primary font-medium">{log.unitsProduced.toLocaleString()} uds</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
