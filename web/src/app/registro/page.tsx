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

    // Validaciones
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

    // Validar CAPTCHA si está habilitado
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
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta")
      show("Error al registrarse", { variant: "error" })
      // Resetear el captcha si hay error
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Crear Cuenta</h1>
      <p className="mb-8 text-gray-600">Únete a PanaderIA y disfruta de pan fresco.</p>
      
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre *
            </label>
            <input 
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full rounded-md border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
              placeholder="Juan"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Apellido *
            </label>
            <input 
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full rounded-md border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
              placeholder="Pérez"
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Correo electrónico *
          </label>
          <input 
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-md border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
            placeholder="tu@correo.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Teléfono (opcional)
          </label>
          <input 
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full rounded-md border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
            placeholder="+502 1234-5678"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Contraseña *
          </label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-md border p-3 pr-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
              placeholder="Mínimo 6 caracteres"
              disabled={isLoading}
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
            Confirmar contraseña *
          </label>
          <div className="relative">
            <input 
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-md border p-3 pr-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
              placeholder="Repite tu contraseña"
              disabled={isLoading}
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
          {isLoading ? "Creando cuenta..." : "Registrarme"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-700">
        ¿Ya tienes cuenta?{" "}
        <Link href={ROUTES.login} className="text-primary hover:underline font-medium">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
