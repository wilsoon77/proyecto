import { NextRequest, NextResponse } from 'next/server'
import {
  backendFetch,
  type BackendAuthResponse,
  isValidCsrfRequest,
  setSessionCookies,
} from '@/lib/auth/bff'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!isValidCsrfRequest(request)) {
    return NextResponse.json({ message: 'Solicitud rechazada por protección CSRF.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Cuerpo de solicitud inválido.' }, { status: 400 })
  }

  try {
    const upstream = await backendFetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await upstream.json().catch(() => ({ message: 'Respuesta inválida de autenticación.' }))

    if (!upstream.ok) {
      return NextResponse.json(payload, { status: upstream.status })
    }

    const auth = payload as BackendAuthResponse
    if (!auth.token || !auth.refreshToken || !auth.user) {
      return NextResponse.json({ message: 'La API devolvió una sesión inválida.' }, { status: 502 })
    }

    const response = NextResponse.json({ user: auth.user })
    setSessionCookies(response, auth)
    return response
  } catch (error) {
    console.error('[Auth BFF] Register failed:', error)
    return NextResponse.json({ message: 'No fue posible contactar la API.' }, { status: 502 })
  }
}
