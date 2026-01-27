/**
 * Servicios de autenticación
 */

import { api, setTokens, clearTokens } from './client'
import type { AuthResponse, ApiUser, LoginDto, RegisterDto, UpdateMeDto } from './types'

export const authService = {
  /**
   * Iniciar sesión
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data, { skipAuth: true })
    setTokens(response.token, response.refreshToken)
    return response
  },

  /**
   * Registrar nuevo usuario
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data, { skipAuth: true })
    setTokens(response.token, response.refreshToken)
    return response
  },

  /**
   * Cerrar sesión
   */
  async logout(refreshToken?: string): Promise<void> {
    try {
      await api.post('/auth/logout', refreshToken ? { refreshToken } : undefined)
    } finally {
      clearTokens()
    }
  },

  /**
   * Obtener usuario actual
   */
  async me(): Promise<ApiUser> {
    return api.get<ApiUser>('/auth/me')
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
    const response = await api.post<{ id: string; email: string; isActive: boolean }>('/auth/deactivate')
    clearTokens()
    return response
  },
}

export default authService
