"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { ROUTES } from "@/lib/constants"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/button"
import Captcha, { isCaptchaEnabled } from "@/components/ui/captcha"
import { Eye, EyeOff, UserPlus, Mail, Lock, Phone, User } from "lucide-react"

export default function RegistroPage() {
  const router = useRouter()
  const { register, isLoading } = useAuth()
  const { show } = useToast()
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError("Por favor, completa todos los campos obligatorios")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (isCaptchaEnabled() && !captchaToken) {
      setError("Por favor, completa la verificación de seguridad")
      return
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        captchaToken: captchaToken || undefined,
      })
      show("¡Cuenta creada exitosamente!", { variant: "success" })
      router.push(ROUTES.home)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear la cuenta"
      setError(message)
      show("Error al registrarse", { variant: "error" })
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-lg flex-col items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-card animate-fade-up">
        <div className="mb-6 text-center space-y-1">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-foreground">Crear Cuenta</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Únete a Panadería Svetlana y disfruta de pan fresco cada día.</p>
        </div>
        
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground">
                Nombre *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" 
                  placeholder="Juan"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground">
                Apellido *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" 
                  placeholder="Pérez"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" 
                placeholder="tu@correo.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground">
              Teléfono (opcional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" 
                placeholder="+502 1234-5678"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" 
                placeholder="Mínimo 6 caracteres"
                disabled={isLoading}
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
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" 
                placeholder="Repite tu contraseña"
                disabled={isLoading}
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
            {isLoading ? "Creando cuenta..." : "Registrarme"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs sm:text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href={ROUTES.login} className="text-primary hover:underline font-semibold">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
