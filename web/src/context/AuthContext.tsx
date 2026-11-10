"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react"
import { authService } from "@/lib/api"
import { notificationsService } from "@/lib/api/notifications"
import type { ApiUser, LoginDto, RegisterDto, UpdateMeDto } from "@/lib/api/types"

interface AuthContextType {
  user: ApiUser | null
  isLoading: boolean
  isLoggedIn: boolean
  isAuthenticated: boolean // Alias de isLoggedIn
  login: (data: LoginDto) => Promise<ApiUser>
  register: (data: RegisterDto) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: UpdateMeDto) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // La sesión se consulta desde el BFF; el navegador no puede leer tokens.
  useEffect(() => {
    const loadUser = async () => {
      // Si el navegador no tiene ninguna cookie de sesion ni hint, es un visitante anonimo.
      // Evitamos llamar a /api/bff/auth/me y despertar al backend para recibir un 401.
      const cookieStr = typeof document !== 'undefined' ? document.cookie : ''
      const hasPossibleSession = 
        cookieStr.includes('panaderia_session_hint') || 
        cookieStr.includes('panaderia_remember') ||
        cookieStr.includes('panaderia_csrf')

      if (!hasPossibleSession) {
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
        const userData = await authService.me()
        if (userData) {
          setUser(userData)
        }
      } catch (error) {
        console.error('Error cargando la sesión:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = useCallback(async (data: LoginDto): Promise<ApiUser> => {
    setIsLoading(true)
    try {
      const response = await authService.login(data)
      setUser(response.user)
      return response.user
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterDto) => {
    setIsLoading(true)
    try {
      const response = await authService.register(data)
      setUser(response.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready
          const subscription = await reg.pushManager.getSubscription()
          if (subscription?.endpoint) {
            await notificationsService.unsubscribe(subscription.endpoint).catch(() => {})
          }
        } catch {
          // Si falla la desvinculación push, continuar con el logout de sesión
        }
      }
      await authService.logout()
    } catch (error) {
      console.error('Error en logout:', error)
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (data: UpdateMeDto) => {
    const updatedUser = await authService.updateMe(data)
    setUser(updatedUser)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.me()
      if (userData) {
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error refrescando usuario:', error)
      setUser(null)
    }
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggedIn: !!user,
    isAuthenticated: !!user, // Alias de isLoggedIn
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
