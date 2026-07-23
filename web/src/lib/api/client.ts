/**
 * Cliente HTTP del navegador.
 *
 * Las credenciales de la API viven exclusivamente en cookies HttpOnly y las
 * lee el BFF de Next.js. Este módulo no guarda ni recibe access/refresh
 * tokens, por lo que una inyección de JavaScript no puede extraerlos.
 */

import type { ApiError } from './types'

const BFF_BASE_URL = '/api/bff'
const CSRF_ENDPOINT = '/api/auth/csrf'
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '')

  if (!response.ok) {
    const error = payload as ApiError | null
    const message = error && typeof error === 'object' && 'message' in error
      ? Array.isArray(error.message) ? error.message.join(', ') : error.message
      : typeof payload === 'string' && payload
        ? payload
        : 'La solicitud no pudo completarse.'
    throw new ApiClientError(message, response.status, error || undefined)
  }

  return payload as T
}

export async function ensureCsrfToken(): Promise<void> {
  if (getCookie('panaderia_csrf')) return

  const response = await fetch(CSRF_ENDPOINT, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  })

  if (!response.ok || !getCookie('panaderia_csrf')) {
    throw new ApiClientError('No fue posible inicializar la protección de sesión.', response.status || 0)
  }
}

async function withCsrfHeaders(headers: Headers, method: string): Promise<void> {
  if (!MUTATING_METHODS.has(method.toUpperCase())) return
  await ensureCsrfToken()
  const token = getCookie('panaderia_csrf')
  if (!token) throw new ApiClientError('No fue posible validar la protección de sesión.', 0)
  headers.set('X-CSRF-Token', token)
}

export async function requestAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method || 'GET'
  const headers = new Headers(options.headers)
  await withCsrfHeaders(headers, method)

  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
  })

  return parseResponse<T>(response)
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Conservado para compatibilidad; el BFF decide la sesión desde cookies. */
  skipAuth?: boolean
}

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, skipAuth: _skipAuth, headers: customHeaders, ...restOptions } = options
    void _skipAuth

    const method = restOptions.method || 'GET'
    const headers = new Headers(customHeaders)
    if (body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    await withCsrfHeaders(headers, method)

    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...restOptions,
        method,
        headers,
        credentials: 'same-origin',
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error de red'
      throw new ApiClientError('Error de conexión con el servidor', 0, {
        statusCode: 0,
        message,
      })
    }

    return parseResponse<T>(response)
  }

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

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const headers = new Headers()
    await withCsrfHeaders(headers, 'POST')

    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'same-origin',
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error de red'
      throw new ApiClientError('Error de conexión con el servidor', 0, {
        statusCode: 0,
        message,
      })
    }

    return parseResponse<T>(response)
  }
}

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

export const api = new ApiClient(BFF_BASE_URL)

export default api
