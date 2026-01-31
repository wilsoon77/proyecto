"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/context/ToastContext"
import type { SupabaseClient } from "@supabase/supabase-js"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { show } = useToast()
  const supabaseRef = useRef<SupabaseClient | null>(null)
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    // Usar una única instancia del cliente Supabase
    const supabase = createClient()
    supabaseRef.current = supabase

    // Procesar el hash de la URL que contiene el token de recuperación
    const handleRecoveryToken = async () => {
      const hash = window.location.hash
      console.log("🔍 URL Hash:", hash)
      setDebugInfo(prev => prev + `Hash: ${hash.substring(0, 50)}...\n`)
      
      // Verificar si hay tokens en el hash de la URL (formato: #access_token=...&refresh_token=...&type=recovery)
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      console.log("🔍 Token type:", type)
      console.log("🔍 Has access_token:", !!accessToken)
      console.log("🔍 Has refresh_token:", !!refreshToken)

      if (accessToken && refreshToken && type === 'recovery') {
        setDebugInfo(prev => prev + `Type: ${type}, Tokens: ✓\n`)
        
        // Establecer la sesión con los tokens del enlace de recuperación
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        console.log("🔍 setSession result:", { data: !!data?.session, error })
        setDebugInfo(prev => prev + `setSession: ${error ? 'Error: ' + error.message : 'OK'}\n`)

        if (!error && data?.session) {
          console.log("✅ Session established for:", data.session.user?.email)
          setDebugInfo(prev => prev + `User: ${data.session.user?.email}\n`)
          setIsValidSession(true)
          // Limpiar el hash de la URL por seguridad
          window.history.replaceState(null, '', window.location.pathname)
          return
        } else if (error) {
          console.error("❌ setSession error:", error)
          setDebugInfo(prev => prev + `Error: ${error.message}\n`)
        }
      }

      // Verificar si ya hay una sesión válida (el usuario ya procesó el token)
      const { data: { session } } = await supabase.auth.getSession()
      console.log("🔍 Existing session:", !!session)
      setDebugInfo(prev => prev + `Existing session: ${session ? session.user?.email : 'None'}\n`)
      setIsValidSession(!!session)
    }

    handleRecoveryToken()

    // Escuchar eventos de auth para detectar PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔍 Auth event:", event)
      setDebugInfo(prev => prev + `Event: ${event}\n`)
      
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true)
      } else if (event === 'SIGNED_IN' && session) {
        setIsValidSession(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password || !confirmPassword) {
      setError("Por favor, completa todos los campos")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)

    try {
      // Usar la misma instancia de Supabase que estableció la sesión
      const supabase = supabaseRef.current || createClient()
      
      // Verificar que hay sesión antes de actualizar
      const { data: { session } } = await supabase.auth.getSession()
      console.log("🔍 Session before update:", !!session, session?.user?.email)
      setDebugInfo(prev => prev + `Pre-update session: ${session ? 'OK' : 'NONE'}\n`)
      
      if (!session) {
        throw new Error("No hay sesión válida. Por favor, usa el enlace del email nuevamente.")
      }
      
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      })

      console.log("🔍 updateUser result:", { data: !!data?.user, error })
      setDebugInfo(prev => prev + `updateUser: ${error ? 'Error: ' + error.message : 'OK'}\n`)

      if (error) {
        throw error
      }

      console.log("✅ Password updated successfully")
      
      // Cerrar sesión después de cambiar la contraseña para forzar re-login
      await supabase.auth.signOut()
      
      show("¡Contraseña actualizada exitosamente!", { variant: "success" })
      
      // Redirigir al login después de un breve delay
      setTimeout(() => {
        router.push(ROUTES.login)
      }, 1500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al actualizar la contraseña"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Mientras se verifica la sesión
  if (isValidSession === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Si no hay sesión válida
  if (!isValidSession) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Enlace inválido o expirado</h1>
          <p className="mb-6 text-gray-600">
            El enlace de recuperación de contraseña no es válido o ha expirado. 
            Por favor, solicita uno nuevo.
          </p>
          
          {/* Debug info - Quitar en producción */}
          {debugInfo && (
            <details className="mb-4 text-left">
              <summary className="cursor-pointer text-xs text-gray-500">🔧 Debug Info</summary>
              <pre className="mt-2 rounded bg-gray-100 p-2 text-xs overflow-auto max-h-40">
                {debugInfo}
              </pre>
            </details>
          )}
          
          <div className="space-y-3">
            <Link href="/forgot-password">
              <Button className="w-full">
                Solicitar nuevo enlace
              </Button>
            </Link>
            <Link href={ROUTES.login}>
              <Button variant="outline" className="w-full">
                Volver al inicio de sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Nueva contraseña</h1>
      <p className="mb-8 text-gray-600">
        Ingresa tu nueva contraseña. Asegúrate de que sea segura y fácil de recordar.
      </p>

      {/* Debug info - Quitar en producción */}
      {debugInfo && (
        <details className="mb-4">
          <summary className="cursor-pointer text-xs text-gray-500">🔧 Debug Info</summary>
          <pre className="mt-2 rounded bg-gray-100 p-2 text-xs overflow-auto max-h-40">
            {debugInfo}
          </pre>
        </details>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border p-3 pr-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
              disabled={isLoading}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border p-3 pr-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
              disabled={isLoading}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Actualizando..." : "Actualizar contraseña"}
        </Button>
      </form>
    </div>
  )
}
