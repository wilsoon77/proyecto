import { createClient } from './client'

/**
 * Inicia sesión con un proveedor OAuth (Google, GitHub).
 * Redirige al usuario al flujo de autenticación del proveedor.
 */
export async function signInWithOAuth(provider: 'google' | 'github') {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new Error(`Error al iniciar sesión con ${provider}: ${error.message}`)
  }
}
