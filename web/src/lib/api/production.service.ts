import api from './client'
import type { ApiProductPresentation } from './types'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Recipe {
  id: number
  name: string
  standardTrays: number
  isActive: boolean
  product: {
    id: number
    name: string
    slug: string
    unitsPerTray: number | null
    stockUnitLabel?: string
    presentations?: ApiProductPresentation[]
  }
  ingredients: {
    rawMaterialId: number
    quantity: string | number
    rawMaterial: {
      id: number
      name: string
      baseUnit: string
    }
  }[]
}

export interface ProductionLog {
  id: number
  traysProduced: number
  unitsProduced: number
  presentationId?: number | null
  presentationName?: string | null
  presentationQuantity?: number | null
  presentationUnits?: number | null
  note: string | null
  createdAt: string
  recipe: {
    id: number
    name: string
    product: {
      id: number
      name: string
      slug?: string
    }
  }
  user: {
    firstName: string
    lastName: string
  }
  branch: {
    id: number
    name: string
  }
}

export interface ProductionResult {
  id: number
  recipeName: string
  productName: string
  traysProduced: number
  unitsProduced: number
  productionPresentationId?: number
  productionPresentationName?: string
  productionQuantity?: number
  message: string
}

// ─────────────────────────────────────────────
// API Calls
// ─────────────────────────────────────────────

export const productionService = {
  /** Listar recetas activas */
  async getRecipes(): Promise<Recipe[]> {
    return api.get<Recipe[]>('/recipes')
  },

  /** Registrar un horneado */
  async registerProduction(data: {
    recipeId: number
    traysProduced?: number
    productionPresentationId?: number
    productionQuantity?: number
    branchId?: number
    note?: string
  }): Promise<ProductionResult> {
    return api.post<ProductionResult>('/production', data)
  },

  /** Producción de hoy */
  async getTodayProduction(branchId?: number): Promise<ProductionLog[]> {
    const params = branchId ? `?branchId=${branchId}` : ''
    return api.get<ProductionLog[]>(`/production/today${params}`)
  },

  /** Crear una receta (Amasijo) - ADMIN/MANAGER */
  async createRecipe(data: {
    productId: number
    name: string
    standardTrays: number
    ingredients: Array<{
      rawMaterialId: number
      quantity: number
    }>
  }): Promise<Recipe> {
    return api.post<Recipe>('/recipes', data)
  },

  /** Actualizar una receta - ADMIN/MANAGER */
  async updateRecipe(id: number, data: {
    name?: string
    standardTrays?: number
    isActive?: boolean
    ingredients?: Array<{
      rawMaterialId: number
      quantity: number
    }>
  }): Promise<Recipe> {
    return api.patch<Recipe>(`/recipes/${id}`, data)
  },

  /** Eliminar/Desactivar receta (soft delete) - ADMIN/MANAGER */
  async deleteRecipe(id: number): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/recipes/${id}`)
  },
}
