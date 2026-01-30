import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorar errores de cookies en Server Components
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Obtener datos del usuario de Supabase Auth
      const user = data.session.user
      
      // Llamar a nuestro backend para sincronizar/obtener el usuario
      // y obtener nuestro JWT personalizado
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://proyecto-dp81.onrender.com'
        const response = await fetch(`${apiUrl}/auth/oauth-callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supabaseUserId: user.id,
            email: user.email,
            firstName: user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || 'Usuario',
            lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            avatarUrl: user.user_metadata?.avatar_url,
            provider: user.app_metadata?.provider,
          }),
        })

        if (response.ok) {
          const authData = await response.json()
          
          // Guardar tokens en cookies para el cliente
          cookieStore.set('auth_token', authData.token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 15, // 15 minutos
            path: '/',
          })
          
          cookieStore.set('refresh_token', authData.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 días
            path: '/',
          })

          // Redirigir con parámetros para que el cliente actualice el estado
          return NextResponse.redirect(`${origin}${next}?oauth=success`)
        }
      } catch (err) {
        console.error('Error sincronizando usuario OAuth:', err)
      }
    }
  }

  // Error en OAuth, redirigir al login con error
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
