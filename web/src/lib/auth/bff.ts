import 'server-only'

import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

export const ACCESS_COOKIE = 'panaderia_access'
export const REFRESH_COOKIE = 'panaderia_refresh'
export const CSRF_COOKIE = 'panaderia_csrf'

const ACCESS_MAX_AGE_SECONDS = 15 * 60
const DEFAULT_REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60
const REMEMBER_REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

export interface BackendAuthResponse {
  token: string
  refreshToken: string
  user: unknown
}

export interface AppSessionTokens {
  accessToken?: string
  refreshToken?: string
}

function isProduction() {
  return process.env.NODE_ENV === 'production'
}

function sessionCookieOptions(maxAge: number) {
  return {
    path: '/',
    maxAge,
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax' as const,
  }
}

function csrfCookieOptions(maxAge: number) {
  return {
    path: '/',
    maxAge,
    httpOnly: false,
    secure: isProduction(),
    sameSite: 'lax' as const,
  }
}

export function getBackendUrl(): string {
  const url = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  return url.replace(/\/$/, '')
}

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${getBackendUrl()}${path}`, {
    ...init,
    cache: 'no-store',
  })
}

export function getSessionTokens(request: NextRequest): AppSessionTokens {
  return {
    accessToken: request.cookies.get(ACCESS_COOKIE)?.value,
    refreshToken: request.cookies.get(REFRESH_COOKIE)?.value,
  }
}

export function setSessionCookies(
  response: NextResponse,
  session: Pick<BackendAuthResponse, 'token' | 'refreshToken'>,
  rememberMe = false,
) {
  const refreshMaxAge = rememberMe
    ? REMEMBER_REFRESH_MAX_AGE_SECONDS
    : DEFAULT_REFRESH_MAX_AGE_SECONDS

  response.cookies.set(ACCESS_COOKIE, session.token, sessionCookieOptions(ACCESS_MAX_AGE_SECONDS))
  response.cookies.set(REFRESH_COOKIE, session.refreshToken, sessionCookieOptions(refreshMaxAge))
  response.cookies.set(CSRF_COOKIE, randomUUID(), csrfCookieOptions(refreshMaxAge))
}

export function clearSessionCookies(response: NextResponse) {
  const expired = { path: '/', maxAge: 0, secure: isProduction(), sameSite: 'lax' as const }
  response.cookies.set(ACCESS_COOKIE, '', { ...expired, httpOnly: true })
  response.cookies.set(REFRESH_COOKIE, '', { ...expired, httpOnly: true })
  response.cookies.set(CSRF_COOKIE, '', { ...expired, httpOnly: false })
}

export function setCsrfCookie(response: NextResponse) {
  response.cookies.set(CSRF_COOKIE, randomUUID(), csrfCookieOptions(DEFAULT_REFRESH_MAX_AGE_SECONDS))
}

export function isValidCsrfRequest(request: NextRequest): boolean {
  const expected = request.cookies.get(CSRF_COOKIE)?.value
  const received = request.headers.get('x-csrf-token')
  const origin = request.headers.get('origin')
  const fetchSite = request.headers.get('sec-fetch-site')

  if (origin && origin !== request.nextUrl.origin) return false
  if (fetchSite === 'cross-site') return false

  return Boolean(expected && received && expected === received)
}

export async function refreshSession(refreshToken: string): Promise<Pick<BackendAuthResponse, 'token' | 'refreshToken'> | null> {
  try {
    const response = await backendFetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) return null

    const payload = await response.json() as Partial<BackendAuthResponse>
    if (!payload.token || !payload.refreshToken) return null

    return { token: payload.token, refreshToken: payload.refreshToken }
  } catch {
    return null
  }
}

export async function responseFromBackend(upstream: Response): Promise<NextResponse> {
  const headers = new Headers()
  for (const header of [
    'content-type',
    'content-disposition',
    'cache-control',
    'link',
    'x-total-count',
    'x-page',
    'x-page-size',
  ]) {
    const value = upstream.headers.get(header)
    if (value) headers.set(header, value)
  }
  headers.set('X-Content-Type-Options', 'nosniff')

  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers,
  })
}
