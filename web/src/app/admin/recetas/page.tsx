"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X,
  AlertTriangle,
  Layers,
  Sparkles,
  ClipboardList,
  Loader2,
  Trash,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { 
  productionService, 
  productsService, 
  rawMaterialsService,
  type Recipe,
  type RawMaterial
} from "@/lib/api"
import type { ApiProduct } from "@/lib/api/types"

interface IngredientFormLine {
  rawMaterialId: number | ""
  quantity: number
}

export default function RecipesAdminPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()

  // Data states
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")

  // Modales
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  
  // Form states
  const [formName, setFormName] = useState("")
  const [formProductId, setFormProductId] = useState<number | "">("")
  const [formStandardTrays, setFormStandardTrays] = useState<number>(1)
  const [formIngredients, setFormIngredients] = useState<IngredientFormLine[]>([])

  // Modal de confirmación de borrado
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)

  // Protección de Rol: redirigir si no es ADMIN o MANAGER
  useEffect(() => {
    if (user && !["ADMIN", "MANAGER"].includes(user.role)) {
      router.push("/admin")
      showToast("Acceso denegado: solo Administradores o Gerentes pueden gestionar recetas", "error")
    }
  }, [user, router, showToast])

  // Cargar datos
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [recipesData, productsRes, rawMaterialsData] = await Promise.all([
        productionService.getRecipes(),
        productsService.list({ page: 1, pageSize: 100 }),
        rawMaterialsService.list(true) // Solo activas
      ])
      setRecipes(recipesData)
      setProducts(productsRes.data || [])
      setRawMaterials(rawMaterialsData)
    } catch (err: any) {
      console.error("Error loading recipes page data:", err)
      showToast("Error al cargar los datos de las recetas y amasijos", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (user && ["ADMIN", "MANAGER"].includes(user.role)) {
      loadData()
    }
  }, [user, loadData])

  // Filtrar recetas
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes.filter(r => r.isActive)
    const query = searchQuery.toLowerCase()
    return recipes.filter(r => 
      r.isActive && 
      (r.name.toLowerCase().includes(query) || 
       r.product.name.toLowerCase().includes(query))
    )
  }, [recipes, searchQuery])

  // Inicializar formulario para CREAR
  const handleOpenCreateModal = () => {
    setEditingRecipe(null)
    setFormName("")
    if (products.length > 0) {
      setFormProductId(products[0].id)
    } else {
      setFormProductId("")
    }
    setFormStandardTrays(1)
    // Agregar un ingrediente inicial vacío
    setFormIngredients([{ rawMaterialId: "", quantity: 1 }])
    setShowFormModal(true)
  }

  // Inicializar formulario para EDITAR
  const handleOpenEditModal = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setFormName(recipe.name)
    setFormProductId(recipe.product.id)
    setFormStandardTrays(recipe.standardTrays)
    
    // Mapear ingredientes existentes
    const mapped = recipe.ingredients.map(ing => ({
      rawMaterialId: ing.rawMaterialId,
      quantity: Number(ing.quantity)
    }))
    setFormIngredients(mapped.length > 0 ? mapped : [{ rawMaterialId: "", quantity: 1 }])
    setShowFormModal(true)
  }

  // Manejar ingredientes dinámicos
  const handleAddIngredientLine = () => {
    setFormIngredients(prev => [...prev, { rawMaterialId: "", quantity: 1 }])
  }

  const handleRemoveIngredientLine = (index: number) => {
    setFormIngredients(prev => {
      const copy = [...prev]
      copy.splice(index, 1)
      return copy.length > 0 ? copy : [{ rawMaterialId: "", quantity: 1 }]
    })
  }

  const handleUpdateIngredientLine = (index: number, field: keyof IngredientFormLine, value: any) => {
    setFormIngredients(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  // Guardar Receta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formProductId || formStandardTrays <= 0 || isSubmitting) return

    // Validar ingredientes
    const validIngredients = formIngredients.filter(ing => ing.rawMaterialId !== "" && ing.quantity > 0)
    if (validIngredients.length === 0) {
      showToast("Debe agregar al menos un ingrediente válido con cantidad mayor a cero", "error")
      return
    }

    // Detectar duplicados de materias primas
    const materialIds = validIngredients.map(ing => ing.rawMaterialId)
    const hasDuplicates = new Set(materialIds).size !== materialIds.length
    if (hasDuplicates) {
      showToast("No puede agregar el mismo insumo/materia prima más de una vez en la receta", "error")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: formName.trim(),
        productId: Number(formProductId),
        standardTrays: Number(formStandardTrays),
        ingredients: validIngredients.map(ing => ({
          rawMaterialId: Number(ing.rawMaterialId),
          quantity: Number(ing.quantity)
        }))
      }

      if (editingRecipe) {
        await productionService.updateRecipe(editingRecipe.id, payload)
        showToast("Receta actualizada con éxito", "success")
      } else {
        await productionService.createRecipe(payload)
        showToast("Receta creada con éxito", "success")
      }

      setShowFormModal(false)
      loadData()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Error al procesar la receta"
      showToast(Array.isArray(msg) ? msg[0] : msg, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Desactivar Receta (Soft delete)
  const handleDeleteRecipe = async () => {
    if (!recipeToDelete || isDeleting) return
    setIsDeleting(true)
    try {
      await productionService.deleteRecipe(recipeToDelete.id)
      showToast(`Receta "${recipeToDelete.name}" desactivada correctamente`, "success")
      setRecipeToDelete(null)
      loadData()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Error al desactivar la receta"
      showToast(msg, "error")
    } finally {
      setIsDeleting(false)
    }
  }

  // UI de Cargando
  if (isLoading && recipes.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-amber-600 animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Cargando recetas y amasijos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600" />
            Recetas y Amasijos
          </h1>
          <p className="text-gray-500 mt-1">Gestión de fórmulas dinámicas de producción para panadería</p>
        </div>
        <Button 
          onClick={handleOpenCreateModal}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold w-full sm:w-auto shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Receta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Fórmulas Registradas</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{recipes.filter(r => r.isActive).length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Layers className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Insumos en Uso</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {new Set(recipes.filter(r => r.isActive).flatMap(r => r.ingredients.map(i => i.rawMaterialId))).size}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Rendimiento Promedio</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {(recipes.filter(r => r.isActive).reduce((sum, r) => sum + r.standardTrays, 0) / (recipes.filter(r => r.isActive).length || 1)).toFixed(1)} latas
            </p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar recetas por nombre o producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>
      </div>

      {/* Listado de Recetas Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No se encontraron recetas registradas</p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="text-amber-600 hover:text-amber-700 font-bold mt-2 text-sm"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <div 
              key={recipe.id} 
              className="bg-white rounded-xl border border-gray-150 shadow-sm hover:shadow-md hover:border-amber-200 transition-all flex flex-col relative overflow-hidden group"
            >
              {/* Badge superior de Latas */}
              <div className="absolute top-3 right-3 bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-500" />{recipe.standardTrays} {recipe.standardTrays === 1 ? "Lata" : "Latas"}</span>
              </div>

              {/* Contenido principal */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-amber-700 transition-colors pr-16 truncate">
                    {recipe.name}
                  </h3>
                  <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mt-1.5">
                    {recipe.product.name}
                  </span>
                </div>

                <div className="flex-1 mt-2">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                    <span>Ingredientes Fijos (Amasijo):</span>
                  </p>
                  <ul className="space-y-2 mt-1 max-h-[160px] overflow-y-auto pr-1">
                    {recipe.ingredients.map((ing) => (
                      <li 
                        key={`${recipe.id}-${ing.rawMaterialId}`} 
                        className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0"
                      >
                        <span className="text-gray-700 font-medium">{ing.rawMaterial.name}</span>
                        <span className="font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 text-xs">
                          {Number(ing.quantity).toFixed(1)} {ing.rawMaterial.baseUnit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Acciones */}
              <div className="border-t border-gray-100 bg-gray-50/50 p-4 flex gap-3 justify-end">
                <button
                  onClick={() => handleOpenEditModal(recipe)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors text-xs font-bold border border-amber-250 shadow-sm"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => setRecipeToDelete(recipe)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-xs font-bold border border-red-200 shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Desactivar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL: Crear/Editar Receta */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full max-h-[90vh] flex flex-col relative overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50/55">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {editingRecipe ? <Edit className="h-5 w-5 text-amber-600" /> : <Plus className="h-5 w-5 text-amber-600" />}
                {editingRecipe ? "Editar Receta de Amasijo" : "Nueva Receta de Amasijo"}
              </h3>
              <button 
                onClick={() => setShowFormModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-bold block mb-1">Nombre de la Receta / Fórmulas</label>
                  <input
                    placeholder="Ej: Fino Navideño, Amasijo Especial..."
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white h-10 px-3"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold block mb-1">Rendimiento de Latas Estándar</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white h-10 px-3"
                    value={formStandardTrays || ""}
                    onChange={(e) => setFormStandardTrays(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-bold block mb-1">Producto Terminado Generado</label>
                <select
                  value={formProductId}
                  onChange={(e) => setFormProductId(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white h-10"
                  required
                >
                  <option value="" disabled>Seleccione producto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>

              {/* Ingredientes dinámicos */}
              <div className="border-t border-gray-150 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-800 font-bold flex items-center gap-1.5">
                    <span>Ingredientes Fijos (Materia Prima)</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddIngredientLine}
                    className="h-8 border-amber-500 text-amber-700 hover:bg-amber-50 font-bold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Añadir Insumo
                  </Button>
                </div>

                <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                  {formIngredients.map((line, index) => {
                    const selectedMaterial = rawMaterials.find(rm => rm.id === Number(line.rawMaterialId))
                    return (
                      <div key={index} className="flex gap-3 items-end bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                        <div className="flex-1">
                          <label className="text-[10px] text-gray-400 font-bold block mb-0.5">Materia Prima / Insumo</label>
                          <select
                            value={line.rawMaterialId}
                            onChange={(e) => handleUpdateIngredientLine(index, "rawMaterialId", e.target.value ? Number(e.target.value) : "")}
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white h-9"
                            required
                          >
                            <option value="" disabled>Seleccione...</option>
                            {rawMaterials.map(rm => (
                              <option key={rm.id} value={rm.id}>{rm.name} ({rm.baseUnit})</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="w-[120px]">
                          <label className="text-[10px] text-gray-400 font-bold block mb-0.5">
                            Cantidad {selectedMaterial ? `(${selectedMaterial.baseUnit})` : ""}
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white h-9 px-2.5 font-bold"
                            value={line.quantity || ""}
                            onChange={(e) => handleUpdateIngredientLine(index, "quantity", Number(e.target.value))}
                            required
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientLine(index)}
                          className="h-9 w-9 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg flex items-center justify-center border border-red-150 flex-shrink-0 transition-colors"
                          title="Eliminar insumo"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFormModal(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Guardar Receta"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: Desactivar Receta */}
      {recipeToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full p-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4 text-red-650">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-gray-900">¿Desactivar esta receta?</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que quieres de-activar la receta de <strong>"{recipeToDelete.name}"</strong>?
              Los panaderos no podrán registrar nuevos horneados utilizando esta receta en el módulo de producción.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setRecipeToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteRecipe}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
                disabled={isDeleting}
              >
                {isDeleting ? "Desactivando..." : "Sí, Desactivar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
