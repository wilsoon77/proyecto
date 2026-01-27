/**
 * Servicios de sucursales
 */

import api from './client'
import type { ApiBranch } from './types'

export const branchesService = {
  /**
   * Listar todas las sucursales
   */
  async list(): Promise<ApiBranch[]> {
    return api.get<ApiBranch[]>('/branches', { skipAuth: true })
  },

  /**
   * Obtener una sucursal por ID
   */
  async getById(id: number): Promise<ApiBranch> {
    return api.get<ApiBranch>(`/branches/${id}`, { skipAuth: true })
  },

  /**
   * Crear sucursal (ADMIN)
   */
  async create(data: Omit<ApiBranch, 'id' | 'createdAt'>): Promise<ApiBranch> {
    return api.post<ApiBranch>('/branches', data)
  },

  /**
   * Actualizar sucursal (ADMIN)
   */
  async update(id: number, data: Partial<Omit<ApiBranch, 'id' | 'createdAt'>>): Promise<ApiBranch> {
    return api.patch<ApiBranch>(`/branches/${id}`, data)
  },

  /**
   * Eliminar sucursal (ADMIN)
   */
  async delete(id: number): Promise<void> {
    return api.delete(`/branches/${id}`)
  },
}

export default branchesService
