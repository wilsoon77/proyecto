import api from './client'

export interface RawMaterial {
  id: number
  name: string
  baseUnit: 'LB' | 'ML' | 'UNIT'
  costPerUnit: string | number
  minStock: string | number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RawMaterialInventory {
  id: number
  rawMaterial: {
    id: number
    name: string
    baseUnit: 'LB' | 'ML' | 'UNIT'
    minStock: string | number | null
  }
  branch: {
    id: number
    name: string
  }
  quantity: string | number
  isLow: boolean
}

export interface PurchaseRawMaterialData {
  rawMaterialId: number
  branchId: number
  purchaseQuantity: number
  unitOfPurchase: string
}

export interface PurchaseRawMaterialResult {
  rawMaterial: string
  purchased: string
  converted: string
  message: string
}

export const rawMaterialsService = {
  /** Listar todas las materias primas */
  async list(activeOnly = true): Promise<RawMaterial[]> {
    const params = activeOnly ? '?activeOnly=true' : ''
    return api.get<RawMaterial[]>(`/raw-materials${params}`)
  },

  /** Obtener una materia prima por ID */
  async getById(id: number): Promise<RawMaterial> {
    return api.get<RawMaterial>(`/raw-materials/${id}`)
  },

  /** Crear materia prima */
  async create(data: {
    name: string
    baseUnit: 'LB' | 'ML' | 'UNIT'
    costPerUnit: number
    minStock?: number
  }): Promise<RawMaterial> {
    return api.post<RawMaterial>('/raw-materials', data)
  },

  /** Actualizar materia prima */
  async update(id: number, data: {
    name?: string
    costPerUnit?: number
    minStock?: number
    isActive?: boolean
  }): Promise<RawMaterial> {
    return api.patch<RawMaterial>(`/raw-materials/${id}`, data)
  },

  /** Obtener inventario de materia prima por sucursal */
  async getInventory(branchId?: number): Promise<RawMaterialInventory[]> {
    const params = branchId ? `?branchId=${branchId}` : ''
    return api.get<RawMaterialInventory[]>(`/raw-materials/inventory${params}`)
  },

  /** Registrar compra/ingreso de materia prima */
  async registerPurchase(data: PurchaseRawMaterialData): Promise<PurchaseRawMaterialResult> {
    return api.post<PurchaseRawMaterialResult>('/raw-materials/purchase', data)
  },
}
