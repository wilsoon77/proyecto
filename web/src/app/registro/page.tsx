"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { ROUTES } from "@/lib/constants"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/button"
import Captcha from "@/components/ui/captcha"

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
          <input 
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-md border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
            placeholder="Mínimo 6 caracteres"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Confirmar contraseña *
          </label>
          <input 
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full rounded-md border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
            placeholder="Repite tu contraseña"
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
