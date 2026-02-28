/**
 * Servicios de auditoría - Historial de cambios
 * Solo accesible para usuarios ADMIN
 */

import api from './client'

// Tipos para el servicio de auditoría
export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  entityName?: string | null
  details?: Record<string, unknown> | string | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

export interface AuditListFilters {
  entity?: string
  action?: string
  userId?: string
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface AuditListResponse {
  data: AuditLog[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface AuditStats {
  totalToday: number
  totalWeek: number
  totalMonth: number
  byEntity: Array<{ entity: string; count: number }>
  byAction: Array<{ action: string; count: number }>
  recentActiveUsers: Array<{
    userId: string
    userName: string
    count: number
  }>
}

export interface AuditFilterOptions {
  entities: string[]
  actions: string[]
}

// Construir query string desde filtros
function buildQueryString(filters: AuditListFilters): string {
  const params = new URLSearchParams()
  
  if (filters.entity) params.set('entity', filters.entity)
  if (filters.action) params.set('action', filters.action)
  if (filters.userId) params.set('userId', filters.userId)
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)
  if (filters.search) params.set('search', filters.search)
  if (filters.page !== undefined) params.set('page', String(filters.page))
  if (filters.pageSize !== undefined) params.set('pageSize', String(filters.pageSize))
  
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const auditService = {
  /**
   * Listar registros de auditoría con filtros
   */
  async list(filters: AuditListFilters = {}): Promise<AuditListResponse> {
    const query = buildQueryString(filters)
    return api.get<AuditListResponse>(`/audit${query}`)
  },

  /**
   * Obtener estadísticas de auditoría
   */
  async getStats(): Promise<AuditStats> {
    return api.get<AuditStats>('/audit/stats')
  },

  /**
   * Obtener opciones de filtrado disponibles
   */
  async getFilterOptions(): Promise<AuditFilterOptions> {
    return api.get<AuditFilterOptions>('/audit/filters')
  },

  /**
   * Obtener un registro de auditoría por ID
   */
  async getById(id: string): Promise<AuditLog> {
    return api.get<AuditLog>(`/audit/${id}`)
  },
}
