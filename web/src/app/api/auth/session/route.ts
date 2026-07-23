import { NextRequest, NextResponse } from 'next/server'
import {
  backendFetch,
  clearSessionCookies,
  getSessionTokens,
  refreshSession,
  responseFromBackend,
  setSessionCookies,
} from '@/lib/auth/bff'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = getSessionTokens(request)
  if (!session.accessToken) {
    return NextResponse.json({ user: null }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const getUser = (accessToken: string) => backendFetch('/auth/me', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
  })

  try {
    let upstream = await getUser(session.accessToken)
    let refreshedSession: Awaited<ReturnType<typeof refreshSession>> = null

    if (upstream.status === 401 && session.refreshToken) {
      refreshedSession = await refreshSession(session.refreshToken)
      if (refreshedSession) upstream = await getUser(refreshedSession.token)
    }

    if (upstream.status === 401) {
      const response = NextResponse.json({ user: null }, { headers: { 'Cache-Control': 'no-store' } })
      clearSessionCookies(response)
      return response
    }

    if (!upstream.ok) return responseFromBackend(upstream)

    const user = await upstream.json()
    const response = NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } })
    if (refreshedSession) setSessionCookies(response, refreshedSession)
    return response
  } catch (error) {
    console.error('[Auth BFF] Session lookup failed:', error)
    return NextResponse.json({ message: 'No fue posible contactar la API.' }, { status: 502 })
  }
}
