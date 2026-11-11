import { NextRequest, NextResponse } from 'next/server'
import { backendFetch, isValidCsrfRequest, responseFromBackend } from '@/lib/auth/bff'
import { SITE_URL } from '@/lib/constants'

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
    const upstream = await backendFetch('/auth/recovery-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email: body.email,
        captchaToken: body.captchaToken,
        deviceId: body.deviceId,
        redirectTo: `${SITE_URL}/reset-password`,
      }),
    })
    return responseFromBackend(upstream)
  } catch {
    return NextResponse.json({ message: 'No fue posible contactar el servicio de autenticación.' }, { status: 502 })
  }
}
