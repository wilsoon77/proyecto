import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { backendFetch, setSessionCookies, type BackendAuthResponse } from '@/lib/auth/bff'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const next = searchParams.get('next')
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const nextPath = next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/'

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
    const response = NextResponse.redirect(new URL(nextPath, request.url))

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
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !data.session?.access_token) {
      console.error('[OAuth] Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
    }

    // Add timeout to backend fetch (especially useful for free tier Render cold starts)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25s timeout

    let backendResponse;
    try {
      backendResponse = await backendFetch('/auth/oauth-callback', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
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

    const authData = (await backendResponse.json()) as BackendAuthResponse
    if (!authData.token || !authData.refreshToken) {
      console.error('[OAuth] Backend returned an incomplete application session')
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
    }

    // Los tokens de la aplicación quedan solo en cookies HttpOnly. El cliente
    // carga el perfil desde /api/auth/session sin recibir secretos.
    setSessionCookies(response, authData)

    return response
  } catch (err) {
    console.error('[OAuth] Unexpected error during callback:', err)
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
  }
}
