"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react"
import { authService, isAuthenticated, clearTokens, getToken } from "@/lib/api"
import type { ApiUser, LoginDto, RegisterDto, UpdateMeDto } from "@/lib/api/types"

interface AuthContextType {
  user: ApiUser | null
  isLoading: boolean
  isLoggedIn: boolean
  login: (data: LoginDto) => Promise<void>
  register: (data: RegisterDto) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: UpdateMeDto) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar usuario al montar si hay token
  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated()) {
        try {
          const userData = await authService.me()
          setUser(userData)
        } catch (error) {
          console.error('Error cargando usuario:', error)
          clearTokens()
        }
      }
      setIsLoading(false)
    }

    loadUser()
  }, [])

  const login = useCallback(async (data: LoginDto) => {
    setIsLoading(true)
    try {
      const response = await authService.login(data)
      setUser(response.user)
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
      await authService.logout()
    } catch (error) {
      console.error('Error en logout:', error)
    } finally {
      setUser(null)
      clearTokens()
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (data: UpdateMeDto) => {
    const updatedUser = await authService.updateMe(data)
    setUser(updatedUser)
  }, [])

  const refreshUser = useCallback(async () => {
    if (isAuthenticated()) {
      try {
        const userData = await authService.me()
        setUser(userData)
      } catch (error) {
        console.error('Error refrescando usuario:', error)
        clearTokens()
        setUser(null)
      }
    }
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggedIn: !!user,
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
