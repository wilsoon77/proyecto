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
    stockUnitLabel?: string
    presentations?: Array<{
      id: number
      name: string
      unitsInStock: number
      price: number | null
      isForSale: boolean
      isForProduction: boolean
      isDefault: boolean
      isActive: boolean
      sortOrder: number
      available?: number
    }>
  }
  branch: {
    id: number
    name: string
    slug: string
  }
  quantity: number
  reserved: number
  available: number
  /** Physical units in expired lots; kept for explicit MERMA handling. */
  expiredQuantity?: number
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
  expiresAt: string | null
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
  expiresAt?: string
  alertAt?: string
}

export interface ExpirationLot {
  id: number
  product: { id: number; name: string; slug: string; origin: 'PRODUCIDO' | 'COMPRADO'; expirationAlertDays?: number[] }
  branch: { id: number; name: string; slug: string }
  sourceType: 'PRODUCCION' | 'COMPRA' | 'TRANSFERENCIA' | 'SOBRANTE' | 'APERTURA'
  initialQuantity: number
  availableQuantity: number
  expiresAt: string | null
  alertAt: string | null
  reminderDays?: number[]
  isCustomAlert?: boolean
  defaultDaysBefore?: number
  effectiveAlertDate?: string | null
  daysUntilAlert?: number | null
  lastNotifiedAt?: string | null
  daysLeft: number | null
  status: 'EXPIRED' | 'EXPIRING_SOON' | 'NO_DATE'
}

export interface ExpirationResponse {
  data: ExpirationLot[]
  summary: { expired: number; expiring: number; noDate: number }
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

export interface OperationalActivityResponse {
  from: string
  to: string
  data: Array<{ date: string; produced: number; sold: number; waste: number }>
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

  async getOperationalActivity(params?: {
    branchSlug?: string
    days?: number
    from?: string
    to?: string
  }): Promise<OperationalActivityResponse> {
    const searchParams = new URLSearchParams()
    if (params?.branchSlug) searchParams.set('branchSlug', params.branchSlug)
    if (params?.days) searchParams.set('days', String(params.days))
    if (params?.from) searchParams.set('from', params.from)
    if (params?.to) searchParams.set('to', params.to)
    const query = searchParams.toString()
    return api.get<OperationalActivityResponse>(`/stock-movements/activity${query ? `?${query}` : ''}`)
  },

  /**
   * Crear movimiento de stock
   */
  async createMovement(data: CreateStockMovementData): Promise<StockMovement> {
    return api.post<StockMovement>('/stock-movements', data)
  },

  /**
   * Transferencia masiva de productos entre sucursales
   */
  async transferBulk(data: {
    fromBranchSlug: string
    toBranchSlug: string
    items: Array<{ productSlug: string; quantity: number }>
    referenceId?: string
    note?: string
  }): Promise<{
    fromBranch: string
    toBranch: string
    transferredCount: number
    items: Array<{ productId: number; productName: string; quantity: number; movementId: number }>
  }> {
    return api.post('/stock-movements/transfer-bulk', data)
  },

  async listExpirations(params?: {
    branch?: string
    status?: 'all' | 'expired' | 'expiring' | 'no-date'
    days?: number
  }): Promise<ExpirationResponse> {
    const searchParams = new URLSearchParams()
    if (params?.branch) searchParams.set('branch', params.branch)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.days !== undefined) searchParams.set('days', String(params.days))
    const query = searchParams.toString()
    return api.get<ExpirationResponse>(`/inventory/expirations${query ? `?${query}` : ''}`)
  },

  async checkExpirations(): Promise<{ scanned: number; warningCount: number; expiredCount: number; checkedAt: string }> {
    return api.post('/inventory/expirations/check')
  },

  /**
   * Modificar alerta o fecha de caducidad de un lote
   */
  async updateLotAlert(lotId: number, data: { alertAt?: string | null; daysBefore?: number; reminderDays?: number[]; expiresAt?: string }): Promise<ExpirationLot> {
    return api.patch<ExpirationLot>(`/inventory/lots/${lotId}/alert`, data)
  },

  /**
   * Reconciliar inventario (conteo físico masivo)
   */
  async reconcile(data: {
    branchSlug: string
    items: Array<{
      productId: number
      actualQuantity: number
      presentationCounts?: Array<{ presentationId: number; quantity: number }>
    }>
    note?: string
  }): Promise<{
    branchName: string
    totalReviewed: number
    totalAdjusted: number
    sobrantes: number
    mermas: number
    sinCambio: number
    details: Array<{
      productId: number
      productName: string
      systemQuantity: number
      actualQuantity: number
      difference: number
      adjustmentType: 'SOBRANTE' | 'MERMA' | 'SIN_CAMBIO'
    }>
  }> {
    return api.post('/stock-movements/reconcile', data)
  }
}

export default inventoryService
