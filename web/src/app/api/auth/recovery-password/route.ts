import { NextRequest, NextResponse } from 'next/server'
import { backendFetch, isValidCsrfRequest, responseFromBackend } from '@/lib/auth/bff'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!isValidCsrfRequest(request)) {
    return NextResponse.json({ message: 'Solicitud rechazada por protección CSRF.' }, { status: 403 })
  }

  let body: { recoveryAccessToken?: unknown; newPassword?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Cuerpo de solicitud inválido.' }, { status: 400 })
  }

  if (typeof body.recoveryAccessToken !== 'string' || typeof body.newPassword !== 'string') {
    return NextResponse.json({ message: 'Datos de recuperación inválidos.' }, { status: 400 })
  }

  try {
    const upstream = await backendFetch('/auth/reset-password/recovery', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${body.recoveryAccessToken}`,
      },
      body: JSON.stringify({ newPassword: body.newPassword }),
    })
    const response = await responseFromBackend(upstream)
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    console.error('[Auth BFF] Recovery password sync failed:', error)
    return NextResponse.json({ message: 'No fue posible contactar la API.' }, { status: 502 })
  }
}
