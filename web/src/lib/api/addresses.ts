/**
 * Servicios de direcciones del usuario
 */

import api from './client'
import type { ApiAddress, CreateAddressDto } from './types'

export const addressesService = {
  /**
   * Listar direcciones del usuario autenticado
   */
  async list(): Promise<ApiAddress[]> {
    return api.get<ApiAddress[]>('/addresses')
  },

  /**
   * Crear nueva dirección
   */
  async create(data: CreateAddressDto): Promise<ApiAddress> {
    return api.post<ApiAddress>('/addresses', data)
  },

  /**
   * Eliminar dirección por ID
   */
  async delete(id: number): Promise<void> {
    return api.delete(`/addresses/${id}`)
  },
}

export default addressesService
