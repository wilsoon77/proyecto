/**
 * Servicio de Inventario
 * Gestión de stock por producto y sucursal
 */

import { api } from './client'

// Tipos de movimiento de stock
export type StockMovementType = 
  | 'PRODUCCION' 
  | 'COMPRA' 
  | 'VENTA' 
  | 'MERMA' 
  | 'PERDIDA_ROBO' 
  | 'TRANSFERENCIA' 
  | 'SOBRANTE'

export interface InventoryItem {
  product: {
    id: number
    name: string
    slug: string
  }
  branch: {
    id: number
    name: string
    slug: string
  }
  quantity: number
  reserved: number
  available: number
  updatedAt: string
}

export interface StockMovement {
  id: number
  type: StockMovementType
  quantity: number
  productId: number
  productName: string
  fromBranchId: number | null
  fromBranchName: string | null
  toBranchId: number | null
  toBranchName: string | null
  referenceId: string | null
  note: string | null
  createdAt: string
  createdBy: string | null
}

export interface CreateStockMovementData {
  type: StockMovementType
  quantity: number
  productSlug: string
  fromBranchSlug?: string
  toBranchSlug?: string
  referenceId?: string
  note?: string
}

export interface StockMovementsListResponse {
  data: StockMovement[]
  meta: {
    total: number
    pageCount: number
    page: number
    pageSize: number
  }
}

export const inventoryService = {
  /**
   * Listar inventario con filtros opcionales
   */
  async list(params?: { productSlug?: string; branchSlug?: string }): Promise<InventoryItem[]> {
    const searchParams = new URLSearchParams()
    if (params?.productSlug) searchParams.set('product', params.productSlug)
    if (params?.branchSlug) searchParams.set('branch', params.branchSlug)
    
    const queryString = searchParams.toString()
    const url = `/inventory${queryString ? `?${queryString}` : ''}`
    
    return api.get<InventoryItem[]>(url)
  },

  /**
   * Listar movimientos de stock
   */
  async listMovements(params?: {
    productSlug?: string
    branchSlug?: string
    type?: StockMovementType
    from?: string
    to?: string
    page?: number
    pageSize?: number
  }): Promise<StockMovementsListResponse> {
    const searchParams = new URLSearchParams()
    if (params?.productSlug) searchParams.set('productSlug', params.productSlug)
    if (params?.branchSlug) searchParams.set('branchSlug', params.branchSlug)
    if (params?.type) searchParams.set('type', params.type)
    if (params?.from) searchParams.set('from', params.from)
    if (params?.to) searchParams.set('to', params.to)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString())
    
    const queryString = searchParams.toString()
    const url = `/stock-movements${queryString ? `?${queryString}` : ''}`
    
    return api.get<StockMovementsListResponse>(url)
  },

  /**
   * Crear movimiento de stock
   */
  async createMovement(data: CreateStockMovementData): Promise<StockMovement> {
    return api.post<StockMovement>('/stock-movements', data)
  }
}

export default inventoryService
