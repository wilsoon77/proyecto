"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import Captcha, { isCaptchaEnabled } from "@/components/ui/captcha"
import { createClient } from "@/lib/supabase/client"

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

    // Validar CAPTCHA si está habilitado
    if (isCaptchaEnabled() && !captchaToken) {
      setError("Por favor, completa la verificación de seguridad")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      // Obtener la URL base para redirección
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
      // Resetear el captcha si hay error
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Revisa tu correo</h1>
          <p className="mb-6 text-gray-600">
            Hemos enviado un enlace de recuperación a <strong>{email}</strong>. 
            Haz clic en el enlace del correo para restablecer tu contraseña.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            ¿No recibiste el correo? Revisa tu carpeta de spam o{" "}
            <button 
              onClick={() => setSuccess(false)}
              className="text-primary hover:underline font-medium"
            >
              intenta de nuevo
            </button>
          </p>
          <Link href={ROUTES.login}>
            <Button variant="outline" className="w-full">
              Volver al inicio de sesión
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Recuperar contraseña</h1>
      <p className="mb-8 text-gray-600">
        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="tu@correo.com"
            disabled={isLoading}
          />
        </div>

        <Captcha
          ref={captchaRef}
          onVerify={(token) => setCaptchaToken(token)}
          onExpire={() => setCaptchaToken(null)}
        />
        
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-700">
        ¿Recordaste tu contraseña?{" "}
        <Link href={ROUTES.login} className="text-primary hover:underline font-medium">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
