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
      console.error('[OAuth] Missing Supabase environment variables')
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
    }

    // We create a response object first so we can append cookies to it
    let response = NextResponse.redirect(new URL(nextPath, request.url))

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !data.session?.user) {
      console.error('[OAuth] Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
    }

    const user = data.session.user
    const fullName =
      user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario'
    const parts = String(fullName).trim().split(/\s+/)
    const firstName = parts[0] || 'Usuario'
    const lastName = parts.slice(1).join(' ')

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    
    // Add timeout to backend fetch (especially useful for free tier Render cold starts)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25s timeout

    let backendResponse;
    try {
      backendResponse = await fetch(`${apiUrl}/auth/oauth-callback`, {
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
        signal: controller.signal
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error('[OAuth] Failed to fetch backend (timeout or network error):', fetchError)
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
    }

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text().catch(() => 'No text')
      console.error(`[OAuth] Backend rejected callback with status ${backendResponse.status}:`, errorText)
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
    }

    const authData = (await backendResponse.json()) as { token: string; refreshToken: string }
    const isProduction = process.env.NODE_ENV === 'production'

    // Keep cookies short-lived: AuthContext will move them to localStorage on first load.
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
  } catch (err) {
    console.error('[OAuth] Unexpected error during callback:', err)
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
  }
}
