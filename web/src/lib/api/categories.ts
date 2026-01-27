/**
 * Servicios de categorías
 */

import api from './client'
import type { ApiCategory, CreateCategoryDto } from './types'

export const categoriesService = {
  /**
   * Listar todas las categorías
   */
  async list(): Promise<ApiCategory[]> {
    return api.get<ApiCategory[]>('/categories', { skipAuth: true })
  },

  /**
   * Obtener una categoría por slug
   */
  async getBySlug(slug: string): Promise<ApiCategory> {
    return api.get<ApiCategory>(`/categories/${slug}`, { skipAuth: true })
  },

  /**
   * Crear categoría (ADMIN)
   */
  async create(data: CreateCategoryDto): Promise<ApiCategory> {
    return api.post<ApiCategory>('/categories', data)
  },

  /**
   * Actualizar categoría (ADMIN)
   */
  async update(slug: string, data: Partial<CreateCategoryDto>): Promise<ApiCategory> {
    return api.patch<ApiCategory>(`/categories/${slug}`, data)
  },

  /**
   * Eliminar categoría (ADMIN)
   */
  async delete(slug: string): Promise<void> {
    return api.delete(`/categories/${slug}`)
  },
}

export default categoriesService
