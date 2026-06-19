"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Flame, Plus, Minus, Loader2, Clock, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { productionService } from "@/lib/api"
import type { Recipe, ProductionLog } from "@/lib/api"

export default function ProduccionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [todayLogs, setTodayLogs] = useState<ProductionLog[]>([])
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
    setIsLoading(true)
    try {
      const [recipesData, logsData] = await Promise.all([
        productionService.getRecipes(),
        productionService.getTodayProduction(),
      ])
      setRecipes(recipesData)
      setTodayLogs(logsData)
    } catch (error) {
      console.error('Error loading data:', error)
      showToast('Error al cargar datos', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

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

    setIsSubmitting(true)
    try {
      const result = await productionService.registerProduction({
        recipeId: selectedRecipeId,
        traysProduced,
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
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Error al registrar producción'
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
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Flame className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Producción</h1>
            <p className="text-gray-500">Registra los amasijos del día</p>
          </div>
        </div>
      </div>

      {/* ─── PASO 1: Seleccionar Receta ─── */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Selecciona el amasijo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => handleSelectRecipe(recipe)}
              className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${selectedRecipeId === recipe.id
                  ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-200'
                  : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-sm'
                }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-lg">{recipe.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Producto: <span className="font-medium text-gray-700">{recipe.product.name}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Rinde: <span className="font-medium text-gray-700">{recipe.standardTrays} latas</span>
                    {recipe.product.unitsPerTray && (
                      <span className="text-amber-600"> ({recipe.standardTrays * recipe.product.unitsPerTray} uds)</span>
                    )}
                  </p>
                </div>
                <ChefHat className={`h-6 w-6 ${selectedRecipeId === recipe.id ? 'text-amber-600' : 'text-gray-300'}`} />
              </div>
              {/* Ingredientes mini */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {recipe.ingredients.map((ing) => (
                  <span key={ing.rawMaterialId} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {ing.rawMaterial.name}: {Number(ing.quantity)} {ing.rawMaterial.baseUnit}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
        {recipes.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <ChefHat className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p>No hay recetas configuradas.</p>
            <p className="text-sm">Un Manager o Admin debe crear las recetas primero.</p>
          </div>
        )}
      </div>

      {/* ─── PASO 2: Latas Producidas ─── */}
      {selectedRecipe && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">2. ¿Cuántas latas salieron?</h2>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setTraysProduced(Math.max(0, traysProduced - 1))}
              className="h-16 w-16 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors active:scale-95"
            >
              <Minus className="h-8 w-8 text-gray-600" />
            </button>
            <div className="text-center">
              <input
                type="number"
                value={traysProduced}
                onChange={(e) => setTraysProduced(Math.max(0, parseInt(e.target.value) || 0))}
                className="text-5xl font-bold text-amber-600 w-28 text-center bg-transparent border-b-2 border-amber-300 focus:outline-none focus:border-amber-500"
              />
              <p className="text-sm text-gray-500 mt-1">latas</p>
              {selectedRecipe.product.unitsPerTray && (
                <p className="text-lg font-medium text-amber-700 mt-2">
                  = {(traysProduced * selectedRecipe.product.unitsPerTray).toLocaleString()} unidades
                </p>
              )}
            </div>
            <button
              onClick={() => setTraysProduced(traysProduced + 1)}
              className="h-16 w-16 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors active:scale-95"
            >
              <Plus className="h-8 w-8 text-amber-600" />
            </button>
          </div>
          {/* Nota opcional */}
          <div className="mt-4">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota opcional (ej: Amasijo extra de la tarde)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            className="w-full h-16 text-xl font-bold bg-amber-600 hover:bg-amber-700 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-800">Producción de hoy</h2>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-gray-500">
              <span className="font-bold text-gray-900">{todayTotalTrays}</span> latas
            </span>
            <span className="text-amber-600 font-medium">
              {todayTotalUnits.toLocaleString()} uds
            </span>
          </div>
        </div>

        {todayLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Flame className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Aún no se ha registrado producción hoy</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {todayLogs.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{log.recipe.name}</p>
                  <p className="text-xs text-gray-500">
                    {log.recipe.product.name} • {log.user.firstName} {log.user.lastName} •{' '}
                    {new Date(log.createdAt).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{log.traysProduced} latas</p>
                  <p className="text-xs text-amber-600 font-medium">{log.unitsProduced.toLocaleString()} uds</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
