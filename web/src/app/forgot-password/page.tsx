"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import Captcha, { isCaptchaEnabled } from "@/components/ui/captcha"
import { createClient } from "@/lib/supabase/client"
import { Mail, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError("Por favor, ingresa tu correo electrónico")
      return
    }

    if (isCaptchaEnabled() && !captchaToken) {
      setError("Por favor, completa la verificación de seguridad")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const redirectUrl = `${window.location.origin}/reset-password`
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
        captchaToken: captchaToken || undefined,
      })

      if (error) {
        throw error
      }

      setSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al enviar el correo"
      setError(message)
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-card text-center space-y-4 animate-fade-up">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Revisa tu correo</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hemos enviado un enlace de recuperación a <strong>{email}</strong>. 
            Haz clic en el enlace del correo para restablecer tu contraseña.
          </p>
          <p className="text-xs text-muted-foreground">
            ¿No recibiste el correo? Revisa tu carpeta de spam o{" "}
            <button 
              onClick={() => setSuccess(false)}
              className="text-primary hover:underline font-semibold"
            >
              intenta de nuevo
            </button>
          </p>
          <Link href={ROUTES.login} className="block pt-2">
            <Button variant="outline" className="w-full h-11">
              Volver al inicio de sesión
            </Button>
          </Link>
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
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-foreground">Recuperar Contraseña</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu acceso.
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
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="tu@correo.com"
                disabled={isLoading}
              />
            </div>
          </div>

          {isCaptchaEnabled() && (
            <Captcha
              ref={captchaRef}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
            />
          )}
          
          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold shadow-warm touch-tactile"
            disabled={isLoading}
          >
            {isLoading ? "Enviando enlace..." : "Enviar Enlace de Recuperación"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs sm:text-sm text-muted-foreground">
          ¿Recordaste tu contraseña?{" "}
          <Link href={ROUTES.login} className="text-primary hover:underline font-semibold">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
