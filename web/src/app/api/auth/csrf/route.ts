import { NextResponse } from 'next/server'
import { setCsrfCookie } from '@/lib/auth/bff'

export const dynamic = 'force-dynamic'

export function GET() {
  const response = NextResponse.json({ ok: true }, {
    headers: { 'Cache-Control': 'no-store' },
  })
  setCsrfCookie(response)
  return response
}
