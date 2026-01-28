/**
 * Cliente HTTP base para comunicación con la API
 * Maneja tokens JWT, refresh automático y errores
 */

import type { ApiError, AuthResponse } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Claves de localStorage para tokens
const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'

// ==================== GESTIÓN DE TOKENS ====================

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(token: string, refreshToken: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

// ==================== CLIENTE HTTP ====================

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  skipAuth?: boolean
}

class ApiClient {
  private baseUrl: string
  private isRefreshing: boolean = false
  private refreshPromise: Promise<boolean> | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async refreshTokens(): Promise<boolean> {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        clearTokens()
        return false
      }

      const data = await response.json() as { token: string; refreshToken: string }
      setTokens(data.token, data.refreshToken)
      return true
    } catch {
      clearTokens()
      return false
    }
  }

  private async handleRefresh(): Promise<boolean> {
    // Si ya está refrescando, esperar el resultado
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = this.refreshTokens()

    try {
      return await this.refreshPromise
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, skipAuth = false, headers: customHeaders, ...restOptions } = options

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    }

    // Agregar token de autorización si existe y no se omite
    if (!skipAuth) {
      const token = getToken()
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
      }
    }

    const config: RequestInit = {
      ...restOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, config)

    // Si el token expiró, intentar refrescar
    if (response.status === 401 && !skipAuth) {
      const refreshed = await this.handleRefresh()
      
      if (refreshed) {
        // Reintentar la petición con el nuevo token
        const newToken = getToken()
        if (newToken) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`
        }
        response = await fetch(`${this.baseUrl}${endpoint}`, { ...config, headers })
      } else {
        // No se pudo refrescar, limpiar y lanzar error
        clearTokens()
        throw new ApiClientError('Sesión expirada', 401)
      }
    }

    // Manejar respuestas sin contenido
    if (response.status === 204) {
      return undefined as T
    }

    const data = await response.json()

    if (!response.ok) {
      const error = data as ApiError
      throw new ApiClientError(
        Array.isArray(error.message) ? error.message.join(', ') : error.message,
        response.status,
        error
      )
    }

    return data as T
  }

  // Métodos de conveniencia
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // Método para subir archivos (FormData)
  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const headers: HeadersInit = {}
    
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    // Si el token expiró, intentar refrescar
    if (response.status === 401) {
      const refreshed = await this.handleRefresh()
      
      if (refreshed) {
        const newToken = getToken()
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`
        }
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers,
          body: formData,
        })
      } else {
        clearTokens()
        throw new ApiClientError('Sesión expirada', 401)
      }
    }

    const data = await response.json()

    if (!response.ok) {
      const error = data as ApiError
      throw new ApiClientError(
        Array.isArray(error.message) ? error.message.join(', ') : error.message,
        response.status,
        error
      )
    }

    return data as T
  }
}

// ==================== ERROR PERSONALIZADO ====================

export class ApiClientError extends Error {
  status: number
  details?: ApiError

  constructor(message: string, status: number, details?: ApiError) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.details = details
  }
}

// ==================== INSTANCIA SINGLETON ====================

export const api = new ApiClient(API_URL)

export default api
