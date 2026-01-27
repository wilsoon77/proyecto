/**
 * Servicios de productos
 */

import api from './client'
import type { 
  ApiProduct, 
  PaginatedResponse, 
  ProductFilters,
  CreateProductDto,
  UpdateProductDto
} from './types'

// Construir query string desde filtros
function buildQueryString(filters: ProductFilters): string {
  const params = new URLSearchParams()
  
  if (filters.search) params.set('search', filters.search)
  if (filters.category) params.set('category', filters.category)
  if (filters.min !== undefined) params.set('min', String(filters.min))
  if (filters.max !== undefined) params.set('max', String(filters.max))
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.branch) params.set('branch', filters.branch)
  if (filters.page !== undefined) params.set('page', String(filters.page))
  if (filters.pageSize !== undefined) params.set('pageSize', String(filters.pageSize))
  
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const productsService = {
  /**
   * Listar productos con filtros y paginación
   */
  async list(filters: ProductFilters = {}): Promise<PaginatedResponse<ApiProduct>> {
    const query = buildQueryString(filters)
    return api.get<PaginatedResponse<ApiProduct>>(`/products${query}`, { skipAuth: true })
  },

  /**
   * Obtener productos destacados
   */
  async featured(limit: number = 10): Promise<ApiProduct[]> {
    return api.get<ApiProduct[]>(`/products/featured?limit=${limit}`, { skipAuth: true })
  },

  /**
   * Obtener un producto por slug
   */
  async getBySlug(slug: string): Promise<ApiProduct> {
    return api.get<ApiProduct>(`/products/${slug}`, { skipAuth: true })
  },

  /**
   * Crear producto (ADMIN)
   */
  async create(data: CreateProductDto): Promise<ApiProduct> {
    return api.post<ApiProduct>('/products', data)
  },

  /**
   * Actualizar producto (ADMIN)
   */
  async update(slug: string, data: UpdateProductDto): Promise<ApiProduct> {
    return api.patch<ApiProduct>(`/products/${slug}`, data)
  },

  /**
   * Reemplazar producto (ADMIN)
   */
  async replace(slug: string, data: CreateProductDto): Promise<ApiProduct> {
    return api.put<ApiProduct>(`/products/${slug}`, data)
  },

  /**
   * Desactivar producto (ADMIN)
   */
  async deactivate(slug: string): Promise<ApiProduct> {
    return api.post<ApiProduct>(`/products/${slug}/deactivate`)
  },

  /**
   * Eliminar producto (ADMIN)
   */
  async delete(slug: string): Promise<void> {
    return api.delete(`/products/${slug}`)
  },
}

export default productsService
