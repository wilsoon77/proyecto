"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Layers, 
  Sparkles, 
  ClipboardList, 
  Loader as Loader2, 
  Trash, 
  Zap,
  PowerOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
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
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { AdminSearchBar } from "@/components/admin/AdminSearchBar"
import { AdminEntityCard } from "@/components/admin/AdminEntityCard"

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
    setFormProductId(products.length > 0 ? products[0].id : "")
    setFormStandardTrays(1)
    setFormIngredients([
      { rawMaterialId: rawMaterials.length > 0 ? rawMaterials[0].id : "", quantity: 1 }
    ])
    setShowFormModal(true)
  }

  // Inicializar formulario para EDITAR
  const handleOpenEditModal = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setFormName(recipe.name)
    setFormProductId(recipe.product.id)
    setFormStandardTrays(recipe.standardTrays)
    setFormIngredients(
      recipe.ingredients.map(ing => ({
        rawMaterialId: ing.rawMaterialId,
        quantity: Number(ing.quantity)
      }))
    )
    setShowFormModal(true)
  }

  // Agregar fila de ingrediente
  const handleAddIngredientLine = () => {
    setFormIngredients(prev => [
      ...prev,
      { rawMaterialId: rawMaterials.length > 0 ? rawMaterials[0].id : "", quantity: 1 }
    ])
  }

  // Actualizar fila de ingrediente
  const handleUpdateIngredientLine = (index: number, field: keyof IngredientFormLine, value: any) => {
    setFormIngredients(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // Eliminar fila de ingrediente
  const handleRemoveIngredientLine = (index: number) => {
    if (formIngredients.length <= 1) {
      showToast("La receta debe tener al menos un ingrediente", "info")
      return
    }
    setFormIngredients(prev => prev.filter((_, i) => i !== index))
  }

  // Enviar formulario (Crear o Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!formName.trim()) {
      showToast("El nombre de la receta es obligatorio", "error")
      return
    }

    if (!formProductId) {
      showToast("Debes vincular la receta a un producto terminado", "error")
      return
    }

    if (formStandardTrays <= 0) {
      showToast("El rendimiento en latas debe ser mayor a 0", "error")
      return
    }

    // Validar ingredientes
    for (const line of formIngredients) {
      if (!line.rawMaterialId) {
        showToast("Selecciona la materia prima para cada ingrediente", "error")
        return
      }
      if (line.quantity <= 0) {
        showToast("La cantidad de cada ingrediente debe ser mayor a 0", "error")
        return
      }
    }

    // Comprobar ingredientes duplicados
    const materialIds = formIngredients.map(i => i.rawMaterialId)
    if (new Set(materialIds).size !== materialIds.length) {
      showToast("No puedes repetir la misma materia prima en la receta", "error")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: formName.trim(),
        productId: Number(formProductId),
        standardTrays: Number(formStandardTrays),
        ingredients: formIngredients.map(line => ({
          rawMaterialId: Number(line.rawMaterialId),
          quantity: Number(line.quantity)
        }))
      }

      if (editingRecipe) {
        await productionService.updateRecipe(editingRecipe.id, payload)
        showToast("Receta actualizada correctamente", "success")
      } else {
        await productionService.createRecipe(payload)
        showToast("Receta creada correctamente", "success")
      }

      setShowFormModal(false)
      loadData()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Error al guardar la receta"
      showToast(msg, "error")
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Header Estandarizado ── */}
      <AdminPageHeader
        title="Recetas y Fórmulas"
        description="Fórmulas dinámicas de panadería, rendimiento de latas e ingredientes estándar"
        icon={<BookOpen className="h-6 w-6 text-[#D97706]" />}
        breadcrumbs={[
          { label: "Producción", href: "/admin/produccion" },
          { label: "Recetas" },
        ]}
        primaryAction={{
          label: "Nueva Receta",
          onClick: handleOpenCreateModal,
          icon: <Plus className="h-4 w-4 mr-1.5" />,
        }}
      />

      {/* ── Tarjetas KPI de Resumen ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E8DCCB] p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 bg-[#FAF0E6] text-[#D97706] rounded-2xl flex items-center justify-center shrink-0 border border-[#E8DCCB]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#8C522B] uppercase tracking-wider">Fórmulas Activas</p>
            <p className="text-2xl font-bold text-[#2B170F] font-mono mt-0.5">
              {recipes.filter(r => r.isActive).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DCCB] p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#8C522B] uppercase tracking-wider">Insumos Utilizados</p>
            <p className="text-2xl font-bold text-[#2B170F] font-mono mt-0.5">
              {new Set(recipes.filter(r => r.isActive).flatMap(r => r.ingredients.map(i => i.rawMaterialId))).size}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DCCB] p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-200">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#8C522B] uppercase tracking-wider">Rendimiento Promedio</p>
            <p className="text-2xl font-bold text-[#2B170F] font-mono mt-0.5">
              {(recipes.filter(r => r.isActive).reduce((sum, r) => sum + r.standardTrays, 0) / (recipes.filter(r => r.isActive).length || 1)).toFixed(1)} latas
            </p>
          </div>
        </div>
      </div>

      {/* ── Buscador Estandarizado ── */}
      <AdminSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Buscar recetas por nombre o producto asociado..."
        totalCount={recipes.filter(r => r.isActive).length}
        filteredCount={filteredRecipes.length}
        entityName="recetas"
        isLoading={isLoading}
      />

      {/* ── Listado de Recetas Grid ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-[#D97706] animate-spin mx-auto" />
            <p className="mt-3 text-xs font-semibold text-[#8C522B]">Cargando fórmulas de producción...</p>
          </div>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-[#E8DCCB] p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF0E6] text-[#D97706] mx-auto mb-4">
            <ClipboardList className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#2B170F] mb-1">
            No se encontraron recetas
          </h3>
          <p className="text-xs text-[#6E5545] mb-6 max-w-sm mx-auto">
            {searchQuery 
              ? "Prueba con otro término de búsqueda." 
              : "Registra fórmulas para que los panaderos puedan calcular insumos automáticamente."}
          </p>
          {!searchQuery && (
            <Button 
              onClick={handleOpenCreateModal}
              className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs text-xs h-11 px-5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Receta
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => (
            <AdminEntityCard
              key={recipe.id}
              image={
                <div className="h-11 w-11 bg-[#FAF0E6] text-[#D97706] rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
              }
              title={recipe.name}
              subtitle={recipe.product.name}
              badges={
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF0E6] text-[#D97706] border border-[#E8DCCB]">
                  <Zap className="h-3 w-3" />
                  {recipe.standardTrays} {recipe.standardTrays === 1 ? "Lata" : "Latas"}
                </span>
              }
              actions={
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditModal(recipe)}
                    className="flex-1 h-10 px-3.5 border-[#DECDBB] text-[#2B170F] hover:bg-[#FAF5EE] font-bold text-xs"
                  >
                    <Edit2 className="h-4 w-4 mr-1.5 text-[#8C522B]" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRecipeToDelete(recipe)}
                    className="h-10 px-3.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-xs"
                  >
                    <PowerOff className="h-4 w-4 mr-1.5" />
                    Desactivar
                  </Button>
                </>
              }
            >
              <div className="pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C522B] mb-1.5 border-b border-[#E8DCCB]/60 pb-1">
                  Ingredientes del Amasijo ({recipe.ingredients.length}):
                </p>
                <ul className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {recipe.ingredients.map((ing) => (
                    <li 
                      key={`${recipe.id}-${ing.rawMaterialId}`} 
                      className="flex items-center justify-between text-xs py-0.5 border-b border-[#E8DCCB]/30 last:border-0"
                    >
                      <span className="text-[#2B170F] font-medium truncate mr-2">{ing.rawMaterial.name}</span>
                      <span className="font-mono font-bold text-[#8C522B] bg-[#FAF5EE] px-2 py-0.5 rounded-md border border-[#DECDBB]/60 text-[11px] shrink-0">
                        {Number(ing.quantity).toFixed(1)} {ing.rawMaterial.baseUnit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </AdminEntityCard>
          ))}
        </div>
      )}

      {/* ── FORM MODAL: Crear/Editar Receta ── */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E8DCCB] max-w-lg w-full max-h-[90vh] flex flex-col relative overflow-hidden">
            <div className="p-6 border-b border-[#E8DCCB] flex items-center justify-between shrink-0 bg-[#FAF5EE]/70">
              <h3 className="text-lg font-bold text-[#2B170F] flex items-center gap-2">
                {editingRecipe ? <Edit2 className="h-5 w-5 text-[#D97706]" /> : <Plus className="h-5 w-5 text-[#D97706]" />}
                {editingRecipe ? "Editar Receta de Amasijo" : "Nueva Receta de Amasijo"}
              </h3>
              <button 
                onClick={() => setShowFormModal(false)}
                className="p-1 text-[#8C522B] hover:text-[#2B170F] rounded-lg hover:bg-[#FAF5EE] transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">
                    Nombre de la Fórmula *
                  </label>
                  <input
                    placeholder="Ej: Fino Navideño, Especial..."
                    className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-10 px-3"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">
                    Rendimiento (Latas) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-10 px-3 font-mono"
                    value={formStandardTrays || ""}
                    onChange={(e) => setFormStandardTrays(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#2B170F] font-bold uppercase tracking-wider block mb-1.5">
                  Producto Terminado Asociado *
                </label>
                <select
                  value={formProductId}
                  onChange={(e) => setFormProductId(Number(e.target.value))}
                  className="w-full border border-[#DECDBB] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-10"
                  required
                >
                  <option value="" disabled>Seleccione producto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>

              {/* Ingredientes dinámicos */}
              <div className="border-t border-[#E8DCCB] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#2B170F]">
                    Ingredientes del Amasijo
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddIngredientLine}
                    className="h-8 border-[#DECDBB] text-[#D97706] hover:bg-[#FAF5EE] font-bold text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Añadir Insumo
                  </Button>
                </div>

                <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                  {formIngredients.map((line, index) => {
                    const selectedMaterial = rawMaterials.find(rm => rm.id === Number(line.rawMaterialId))
                    return (
                      <div key={index} className="flex gap-2.5 items-end bg-[#FAF5EE] p-3 rounded-xl border border-[#DECDBB]/70">
                        <div className="flex-1">
                          <label className="text-[10px] text-[#8C522B] font-bold block mb-1">Insumo</label>
                          <select
                            value={line.rawMaterialId}
                            onChange={(e) => handleUpdateIngredientLine(index, "rawMaterialId", e.target.value ? Number(e.target.value) : "")}
                            className="w-full border border-[#DECDBB] rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-9"
                            required
                          >
                            <option value="" disabled>Seleccione...</option>
                            {rawMaterials.map(rm => (
                              <option key={rm.id} value={rm.id}>{rm.name} ({rm.baseUnit})</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="w-[110px]">
                          <label className="text-[10px] text-[#8C522B] font-bold block mb-1">
                            Cant {selectedMaterial ? `(${selectedMaterial.baseUnit})` : ""}
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full border border-[#DECDBB] rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 bg-white h-9 px-2.5 font-bold font-mono"
                            value={line.quantity || ""}
                            onChange={(e) => handleUpdateIngredientLine(index, "quantity", Number(e.target.value))}
                            required
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientLine(index)}
                          className="h-9 w-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center border border-red-200 shrink-0 hover:bg-red-100 transition-colors"
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
              <div className="flex gap-3 justify-end pt-4 border-t border-[#E8DCCB] shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFormModal(false)}
                  disabled={isSubmitting}
                  className="h-10 px-4 border-[#DECDBB]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="h-10 px-5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl shadow-xs"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Guardar Receta"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog: Desactivar Receta ── */}
      <ConfirmDialog
        isOpen={!!recipeToDelete}
        onCancel={() => setRecipeToDelete(null)}
        onConfirm={handleDeleteRecipe}
        title="Desactivar Receta"
        message={`¿Estás seguro de desactivar la receta "${recipeToDelete?.name}"? Los panaderos no podrán seleccionarla para nuevos registros de producción, pero todo el historial se conservará intacto.`}
        confirmText="Desactivar"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
