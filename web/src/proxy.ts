import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ACCESS_COOKIE = 'panaderia_access'
const OPERATIONAL_ROLES = new Set(['ADMIN', 'MANAGER', 'BAKER'])

function decodeAccessClaims(token: string): { role?: string; exp?: number } | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
    const json = Array.from(binary, (character) => String.fromCharCode(character.charCodeAt(0))).join('')
    const claims = JSON.parse(json) as { role?: string; exp?: number }
    if (claims.exp && claims.exp <= Math.floor(Date.now() / 1000)) return null
    return claims
  } catch {
    return null
  }
}

function redirectForAdmin(request: NextRequest, pathname: string) {
  const url = new URL('/login', request.url)
  url.searchParams.set('returnUrl', `${pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(url)
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const token = request.cookies.get(ACCESS_COOKIE)?.value
    const claims = token ? decodeAccessClaims(token) : null
    if (!claims || !OPERATIONAL_ROLES.has(claims.role || '')) {
      return redirectForAdmin(request, pathname)
    }
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
