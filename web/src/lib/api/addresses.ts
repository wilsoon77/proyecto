/**
 * Servicios de direcciones
 */

import api from './client'
import type { ApiAddress, CreateAddressDto } from './types'

export const addressesService = {
  /**
   * Listar direcciones del usuario
   */
  async list(): Promise<ApiAddress[]> {
    return api.get<ApiAddress[]>('/addresses')
  },

  /**
   * Obtener una dirección por ID
   */
  async getById(id: number): Promise<ApiAddress> {
    return api.get<ApiAddress>(`/addresses/${id}`)
  },

  /**
   * Crear dirección
   */
  async create(data: CreateAddressDto): Promise<ApiAddress> {
    return api.post<ApiAddress>('/addresses', data)
  },

  /**
   * Actualizar dirección
   */
  async update(id: number, data: Partial<CreateAddressDto>): Promise<ApiAddress> {
    return api.patch<ApiAddress>(`/addresses/${id}`, data)
  },

  /**
   * Eliminar dirección
   */
  async delete(id: number): Promise<void> {
    return api.delete(`/addresses/${id}`)
  },
}

export default addressesService
