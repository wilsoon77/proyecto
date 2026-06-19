/**
 * Servicios de API para Notificaciones In-App y Push
 */

import api from './client'
import type { Notification, NotificationConfig, SubscribePushDto, PaginatedResponse } from './types'

export const notificationsService = {
  /**
   * Obtener clave pública VAPID para el navegador
   */
  async getVapidPublicKey(): Promise<{ publicKey: string }> {
    return api.get<{ publicKey: string }>('/notifications/vapid-public-key', { skipAuth: true })
  },

  /**
   * Registrar dispositivo para notificaciones push
   */
  async subscribe(subscription: SubscribePushDto): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/notifications/subscribe', subscription)
  },

  /**
   * Cancelar suscripción del dispositivo
   */
  async unsubscribe(endpoint: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/notifications/unsubscribe', { endpoint })
  },

  /**
   * Obtener historial de notificaciones in-app (paginado)
   */
  async getHistory(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Notification>> {
    return api.get<PaginatedResponse<Notification>>(`/notifications?page=${page}&pageSize=${pageSize}`)
  },

  /**
   * Obtener conteo de no leídas
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return api.get<{ count: number }>('/notifications/unread-count')
  },

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(): Promise<{ success: boolean }> {
    return api.patch<{ success: boolean }>('/notifications/read-all', {})
  },

  /**
   * Marcar una notificación específica como leída
   */
  async markAsRead(id: number): Promise<{ success: boolean }> {
    return api.patch<{ success: boolean }>(`/notifications/${id}/read`, {})
  },

  /**
   * Listar configuraciones de notificaciones (ADMIN)
   */
  async getConfigs(): Promise<NotificationConfig[]> {
    return api.get<NotificationConfig[]>('/notifications/config')
  },

  /**
   * Actualizar configuración de una notificación (ADMIN)
   */
  async updateConfig(
    key: string,
    data: {
      isEnabled?: boolean
      title?: string
      message?: string
      targetRoles?: string[]
      soundType?: string
      thresholds?: { threshold: number; unit?: string } | null
    }
  ): Promise<NotificationConfig> {
    return api.put<NotificationConfig>(`/notifications/config/${key}`, data)
  },

  /**
   * Enviar notificación de prueba (ADMIN)
   */
  async sendTestNotification(key: string): Promise<{ success: boolean; key: string }> {
    return api.post<{ success: boolean; key: string }>('/notifications/test', { key })
  },
}

export default notificationsService
