"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const { show } = useToast()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("Por favor, completa todos los campos")
      return
    }

    try {
      await login({ email, password })
      show("¡Bienvenido de vuelta!", { variant: "success" })
      router.push(ROUTES.home)
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión")
      show("Error al iniciar sesión", { variant: "error" })
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Iniciar Sesión</h1>
      <p className="mb-8 text-gray-600">Ingresa a tu cuenta para continuar.</p>
      
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
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>
        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-500">o</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="grid gap-2">
        <button 
          type="button"
          className="w-full rounded-md border bg-white p-3 text-sm hover:bg-gray-50 transition-colors"
          disabled
        >
          Continuar con Google (próximamente)
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-700">
        ¿No tienes cuenta?{" "}
        <Link href={ROUTES.register} className="text-primary hover:underline font-medium">
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}
