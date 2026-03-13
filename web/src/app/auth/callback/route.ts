import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const next = searchParams.get('next')
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const nextPath = next?.startsWith('/') ? next : '/'

  if (error) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
  }

  try {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    })

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !data.session?.user) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
    }

    const user = data.session.user
    const fullName =
      user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario'
    const parts = String(fullName).trim().split(/\s+/)
    const firstName = parts[0] || 'Usuario'
    const lastName = parts.slice(1).join(' ')

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const backendResponse = await fetch(`${apiUrl}/auth/oauth-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        supabaseUserId: user.id,
        email: user.email,
        firstName,
        lastName,
        avatarUrl: user.user_metadata?.avatar_url,
        provider: user.app_metadata?.provider,
      }),
    })

    if (!backendResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
    }

    const authData = (await backendResponse.json()) as { token: string; refreshToken: string }
    const isProduction = process.env.NODE_ENV === 'production'

    // Keep cookies short-lived: AuthContext will move them to localStorage on first load.
    const response = NextResponse.redirect(new URL(nextPath, request.url))
    response.cookies.set('auth_token', authData.token, {
      path: '/',
      maxAge: 60,
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
    })
    response.cookies.set('auth_refresh_token', authData.refreshToken, {
      path: '/',
      maxAge: 60,
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
    })

    return response
  } catch {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
  }
}
