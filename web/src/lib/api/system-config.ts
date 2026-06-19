/**
 * Servicios de configuración global del sistema
 */

import api from './client'
import type { SystemConfig } from './types'

export const systemConfigService = {
  /**
   * Obtener configuraciones públicas (objeto plano)
   */
  async getPublic(): Promise<Record<string, any>> {
    return api.get<Record<string, any>>('/system-config/public', { skipAuth: true })
  },

  /**
   * Listar todas las configuraciones (ADMIN)
   */
  async list(): Promise<SystemConfig[]> {
    return api.get<SystemConfig[]>('/system-config')
  },

  /**
   * Actualizar una configuración (ADMIN)
   */
  async update(key: string, value: any): Promise<{ success: boolean; key: string; value: any }> {
    return api.put<{ success: boolean; key: string; value: any }>(`/system-config/${key}`, { value })
  },
}

export default systemConfigService
