"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/context/ToastContext"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { show } = useToast()
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    // Verificar si hay una sesión válida de recuperación
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      // Si hay sesión, el usuario llegó desde el enlace de recuperación
      setIsValidSession(!!session)
    }

    checkSession()

    // Escuchar eventos de auth para detectar PASSWORD_RECOVERY
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
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
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="••••••••"
            disabled={isLoading}
            minLength={6}
          />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Confirmar contraseña
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="••••••••"
            disabled={isLoading}
            minLength={6}
          />
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
