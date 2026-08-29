"use client"

import Link from "next/link"
import { useEffect, useRef, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react"
import { ROUTES } from "@/lib/constants"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/button"
import Captcha, { isCaptchaEnabled } from "@/components/ui/captcha"
import { signInWithOAuth } from "@/lib/supabase/oauth"
import { getDeviceId } from "@/lib/device-fingerprint"
import { authService } from "@/lib/api/auth"

function getSafeReturnUrl(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return ROUTES.home
  return value
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = getSafeReturnUrl(searchParams.get("returnUrl"))
  const oauthError = searchParams.get("error")
  const { login, isLoading } = useAuth()
  const { show } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(oauthError === "oauth_failed" ? "No fue posible iniciar sesión con Google." : null)
  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [deviceId, setDeviceId] = useState("")
  const [requiresCaptcha, setRequiresCaptcha] = useState(false)
  const [checkingCaptcha, setCheckingCaptcha] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDeviceId(getDeviceId()), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const checkCaptchaRequired = async (emailToCheck: string) => {
    if (!emailToCheck || !deviceId) return
    setCheckingCaptcha(true)
    try {
      const result = await authService.checkCaptcha(emailToCheck, deviceId)
      setRequiresCaptcha(result.required)
      if (!result.required) setCaptchaToken(null)
    } catch {
      setRequiresCaptcha(true)
    } finally {
      setCheckingCaptcha(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!email || !password) {
      setError("Completa tu correo y contraseña para continuar.")
      return
    }

    if (isCaptchaEnabled() && requiresCaptcha && !captchaToken) {
      setError("Completa la verificación de seguridad para continuar.")
      return
    }

    try {
      await login({ email, password, captchaToken: captchaToken || undefined, rememberMe, deviceId: deviceId || undefined })
      show("Bienvenido de vuelta.", { variant: "success" })
      router.push(returnUrl)
    } catch (loginError: unknown) {
      const message = loginError instanceof Error ? loginError.message : "No fue posible iniciar sesión."
      setError(message)
      show("No fue posible iniciar sesión.", { variant: "error" })
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
      await checkCaptchaRequired(email)
    }
  }

  const handleOAuth = async () => {
    setError(null)
    setOauthLoading("google")
    try {
      await signInWithOAuth("google", returnUrl)
    } catch (oauthLoginError: unknown) {
      const message = oauthLoginError instanceof Error ? oauthLoginError.message : "No fue posible iniciar sesión con Google."
      setError(message)
      show("No fue posible iniciar sesión con Google.", { variant: "error" })
      setOauthLoading(null)
    }
  }

  const disabled = isLoading || !!oauthLoading

  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-lg flex-col items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-card animate-fade-up">
        <div className="mb-6 text-center space-y-1">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-foreground">Iniciar Sesión</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Accede a tu cuenta para gestionar tus pedidos y preferencias.</p>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={(event) => checkCaptchaRequired(event.target.value)}
                placeholder="tu@correo.com"
                disabled={disabled}
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-foreground">
                Contraseña *
              </label>
              <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu contraseña"
                disabled={disabled}
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-11 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer pt-1">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            Recordar mi sesión por 30 días
          </label>

          {isCaptchaEnabled() && requiresCaptcha && (
            <Captcha ref={captchaRef} onVerify={(token) => setCaptchaToken(token)} onExpire={() => setCaptchaToken(null)} />
          )}
          {checkingCaptcha && <p className="text-xs text-muted-foreground">Verificando seguridad...</p>}

          <Button
            type="submit"
            disabled={disabled || checkingCaptcha}
            className="touch-tactile h-11 w-full rounded-full font-bold shadow-warm"
          >
            {isLoading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          o continúa con
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleOAuth}
          disabled={disabled}
          className="public-focus touch-tactile flex h-11 w-full items-center justify-center gap-3 rounded-full border border-border bg-background text-sm font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-60"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-xs font-bold">G</span>
          {oauthLoading === "google" ? "Conectando..." : "Google"}
        </button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href={ROUTES.register} className="font-bold text-primary hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense fallback={<div className="public-container flex min-h-[50dvh] items-center justify-center py-16"><div className="w-full max-w-md animate-pulse space-y-4"><div className="h-12 w-2/3 rounded bg-muted" /><div className="h-4 w-1/2 rounded bg-muted" /><div className="h-12 rounded-xl bg-muted" /><div className="h-12 rounded-xl bg-muted" /></div></div>}><LoginForm /></Suspense>
}
