import { createClient } from './client'

/**
 * Inicia sesión con un proveedor OAuth (Google).
 * Redirige al usuario al flujo de autenticación del proveedor.
 */
export async function signInWithOAuth(provider: 'google', nextPath: string = '/') {
  const supabase = createClient()
  const redirectUrl = new URL('/auth/callback', window.location.origin)
  redirectUrl.searchParams.set('next', nextPath)

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl.toString(),
    },
  })

  if (error) {
    throw new Error(`Error al iniciar sesión con ${provider}: ${error.message}`)
  }
}
