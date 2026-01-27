/**
 * Servicios de órdenes
 */

import api from './client'
import type { 
  ApiOrder, 
  PaginatedResponse, 
  ReserveOrderDto,
  OrderFilters,
  OrderStatus
} from './types'

// Construir query string desde filtros
function buildQueryString(filters: OrderFilters): string {
  const params = new URLSearchParams()
  
  if (filters.branchSlug) params.set('branchSlug', filters.branchSlug)
  if (filters.status) params.set('status', filters.status)
  if (filters.page !== undefined) params.set('page', String(filters.page))
  if (filters.pageSize !== undefined) params.set('pageSize', String(filters.pageSize))
  
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const ordersService = {
  /**
   * Reservar una orden (crear pedido)
   */
  async reserve(data: ReserveOrderDto): Promise<ApiOrder> {
    return api.post<ApiOrder>('/orders/reserve', data)
  },

  /**
   * Listar órdenes (ADMIN/EMPLOYEE)
   */
  async list(filters: OrderFilters = {}): Promise<PaginatedResponse<ApiOrder>> {
    const query = buildQueryString(filters)
    return api.get<PaginatedResponse<ApiOrder>>(`/orders${query}`)
  },

  /**
   * Obtener mis órdenes (usuario autenticado)
   */
  async myOrders(filters: Omit<OrderFilters, 'branchSlug'> = {}): Promise<PaginatedResponse<ApiOrder>> {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.page !== undefined) params.set('page', String(filters.page))
    if (filters.pageSize !== undefined) params.set('pageSize', String(filters.pageSize))
    
    const query = params.toString()
    return api.get<PaginatedResponse<ApiOrder>>(`/orders/my-orders${query ? `?${query}` : ''}`)
  },

  /**
   * Obtener detalle de una orden
   */
  async getById(id: number): Promise<ApiOrder> {
    return api.get<ApiOrder>(`/orders/${id}`)
  },

  /**
   * Cancelar orden
   */
  async cancel(id: number): Promise<ApiOrder> {
    return api.post<ApiOrder>(`/orders/${id}/cancel`)
  },

  /**
   * Confirmar orden (pago recibido)
   */
  async confirm(id: number): Promise<ApiOrder> {
    return api.post<ApiOrder>(`/orders/${id}/confirm`)
  },

  /**
   * Marcar como entregada (pickup)
   */
  async pickup(id: number): Promise<ApiOrder> {
    return api.post<ApiOrder>(`/orders/${id}/pickup`)
  },

  /**
   * Cambiar estado de orden (ADMIN/EMPLOYEE)
   */
  async updateStatus(id: number, status: OrderStatus): Promise<ApiOrder> {
    return api.patch<ApiOrder>(`/orders/${id}/status`, { status })
  },
}

export default ordersService
