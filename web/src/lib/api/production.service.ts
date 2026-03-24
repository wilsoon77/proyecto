import api from './client'

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
    traysProduced: number
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
}
