"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { ROUTES } from "@/lib/constants"

interface ProtectedRouteProps {
  children: React.ReactNode
  /** Redirigir a esta ruta si no está autenticado (default: /login) */
  redirectTo?: string
  /** Mensaje a mostrar mientras verifica autenticación */
  loadingMessage?: string
}

/**
 * Componente que protege rutas requiriendo autenticación.
 * Redirige automáticamente a login si el usuario no está autenticado.
 */
export function ProtectedRoute({ 
  children, 
  redirectTo = ROUTES.login,
  loadingMessage = "Verificando sesión..."
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Solo redirigir cuando ya terminó de cargar y no está autenticado
    if (!isLoading && !isAuthenticated) {
      // Guardar la URL actual para redirigir después del login
      const currentPath = window.location.pathname
      const returnUrl = currentPath !== ROUTES.login ? `?returnUrl=${encodeURIComponent(currentPath)}` : ''
      router.push(`${redirectTo}${returnUrl}`)
    }
  }, [isLoading, isAuthenticated, router, redirectTo])

  // Mostrar loading mientras verifica
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada (se está redirigiendo)
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  // Usuario autenticado, mostrar contenido
  return <>{children}</>
}

export default ProtectedRoute
