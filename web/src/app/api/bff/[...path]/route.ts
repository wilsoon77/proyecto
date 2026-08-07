import { NextRequest, NextResponse } from 'next/server'
import {
  backendFetch,
  clearSessionCookies,
  getSessionTokens,
  isRememberMeSession,
  isValidCsrfRequest,
  refreshSession,
  responseFromBackend,
  setSessionCookies,
} from '@/lib/auth/bff'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ path: string[] }> }

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const TOKEN_ISSUING_PATHS = new Set([
  'auth/login',
  'auth/register',
  'auth/refresh',
  'auth/oauth-callback',
])

function getBackendPath(path: string[]): string | null {
  if (!path.length || path.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('\\'))) {
    return null
  }

  const normalized = path.map((segment) => encodeURIComponent(segment)).join('/')
  if (TOKEN_ISSUING_PATHS.has(normalized)) return null

  return `/${normalized}`
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  const backendPath = getBackendPath(path)
  if (!backendPath) {
    return NextResponse.json({ message: 'Ruta no disponible.' }, { status: 404 })
  }

  if (MUTATING_METHODS.has(request.method) && !isValidCsrfRequest(request)) {
    return NextResponse.json({ message: 'Solicitud rechazada por protección CSRF.' }, { status: 403 })
  }

  const requestBody = ['GET', 'HEAD'].includes(request.method)
    ? undefined
    : await request.arrayBuffer()
  const session = getSessionTokens(request)

  const send = async (accessToken?: string) => {
    const headers = new Headers()
    const contentType = request.headers.get('content-type')
    const accept = request.headers.get('accept')
    const requestId = request.headers.get('x-request-id')

    if (contentType) headers.set('content-type', contentType)
    if (accept) headers.set('accept', accept)
    if (requestId) headers.set('x-request-id', requestId)
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`)

    return backendFetch(`${backendPath}${request.nextUrl.search}`, {
      method: request.method,
      headers,
      body: requestBody && requestBody.byteLength ? requestBody.slice(0) : undefined,
    })
  }

  try {
    let upstream = await send(session.accessToken)
    let refreshedSession: Awaited<ReturnType<typeof refreshSession>> = null

    if (upstream.status === 401 && session.refreshToken) {
      refreshedSession = await refreshSession(session.refreshToken)
      if (refreshedSession) {
        upstream = await send(refreshedSession.token)
      }
    }

    const response = await responseFromBackend(upstream)
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('Vary', 'Cookie')
    if (refreshedSession) {
      setSessionCookies(response, refreshedSession, isRememberMeSession(request))
    } else if (upstream.status === 401 && session.refreshToken) {
      clearSessionCookies(response)
    }

    return response
  } catch (error) {
    console.error('[BFF] Error contacting backend:', error)
    return NextResponse.json({ message: 'No fue posible contactar la API.' }, { status: 502 })
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy

export function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
