/**
 * Servicios de autenticación
 */

import { api, requestAuth } from './client'
import type { ApiUser, LoginDto, RegisterDto, UpdateMeDto } from './types'

interface SessionResponse {
  user: ApiUser
}

export const authService = {
  /**
   * Verificar si se requiere captcha para un email/dispositivo
   */
  async checkCaptcha(email: string, deviceId?: string): Promise<{ required: boolean }> {
    const params = new URLSearchParams({ email })
    if (deviceId) params.append('deviceId', deviceId)
    return api.get<{ required: boolean }>(`/auth/check-captcha?${params}`, { skipAuth: true })
  },

  /**
   * Iniciar sesión
   */
  async login(data: LoginDto): Promise<SessionResponse> {
    return requestAuth<SessionResponse>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  /**
   * Registrar nuevo usuario
   */
  async register(data: RegisterDto): Promise<SessionResponse> {
    return requestAuth<SessionResponse>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    await requestAuth('/api/auth/logout', { method: 'POST' })
  },

  /**
   * Obtener usuario actual
   */
  async me(): Promise<ApiUser | null> {
    const response = await requestAuth<{ user: ApiUser | null }>('/api/auth/session')
    return response.user
  },

  /**
   * Actualizar perfil del usuario
   */
  async updateMe(data: UpdateMeDto): Promise<ApiUser> {
    return api.patch<ApiUser>('/auth/me', data)
  },

  /**
   * Desactivar cuenta
   */
  async deactivate(): Promise<{ id: string; email: string; isActive: boolean }> {
    return api.post<{ id: string; email: string; isActive: boolean }>('/auth/deactivate')
  },
}

export default authService
