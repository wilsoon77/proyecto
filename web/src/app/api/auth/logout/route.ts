import { NextRequest, NextResponse } from 'next/server'
import {
  backendFetch,
  clearSessionCookies,
  getSessionTokens,
  isValidCsrfRequest,
} from '@/lib/auth/bff'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!isValidCsrfRequest(request)) {
    return NextResponse.json({ message: 'Solicitud rechazada por protección CSRF.' }, { status: 403 })
  }

  const session = getSessionTokens(request)
  if (session.accessToken) {
    try {
      await backendFetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      })
    } catch (error) {
      console.warn('[Auth BFF] Backend logout failed; clearing browser session anyway.', error)
    }
  }

  const response = NextResponse.json({ ok: true })
  clearSessionCookies(response)
  return response
}
