"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/context/ToastContext"
import { requestAuth } from "@/lib/api/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, KeyRound } from "lucide-react"

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

  useEffect(() => {
    const supabase = createClient()
    supabaseRef.current = supabase

    const handleRecoveryToken = async () => {
      const hash = window.location.hash
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (accessToken && refreshToken && type === 'recovery') {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        const session = data?.session
        if (!error && session) {
          setIsValidSession(true)
          window.history.replaceState(null, '', window.location.pathname)
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      setIsValidSession(!!session)
    }

    handleRecoveryToken()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
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

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)

    try {
      const supabase = supabaseRef.current || createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error("No hay sesión válida. Por favor, usa el enlace del email nuevamente.")
      }

      const recoveryAccessToken = session.access_token
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      })
      
      if (error) {
        throw error
      }
      
      await requestAuth('/api/auth/recovery-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryAccessToken, newPassword: password }),
      })
      
      show("¡Contraseña actualizada exitosamente! Redirigiendo al login...", { variant: "success" })
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      await supabase.auth.signOut()
      router.push(ROUTES.login)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al actualizar la contraseña"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidSession === null) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md items-center justify-center px-4 py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-card text-center space-y-4 animate-fade-up">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Enlace inválido o expirado</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            El enlace de recuperación de contraseña no es válido o ya ha expirado. 
            Por favor, solicita uno nuevo.
          </p>
          
          <div className="space-y-2.5 pt-2">
            <Link href="/forgot-password" className="block">
              <Button className="w-full h-11 font-semibold shadow-warm">
                Solicitar nuevo enlace
              </Button>
            </Link>
            <Link href={ROUTES.login} className="block">
              <Button variant="outline" className="w-full h-11">
                Volver al inicio de sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-card animate-fade-up">
        <div className="mb-6 text-center space-y-1">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-foreground">Nueva Contraseña</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground">
              Nueva Contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="Mínimo 8 caracteres"
                disabled={isLoading}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none p-1"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground">
              Confirmar Contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="Repite tu nueva contraseña"
                disabled={isLoading}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none p-1"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold shadow-warm touch-tactile"
            disabled={isLoading}
          >
            {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
          </Button>
        </form>
      </div>
    </div>
  )
}
