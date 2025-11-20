"use client"

import React, { createContext, useContext, useMemo } from "react"
import { Toaster, toast } from "sonner"

type ToastVariant = 'success' | 'error' | 'info'

type ToastContextType = {
  show: (message: string, options?: { variant?: ToastVariant; duration?: number }) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const api = useMemo<ToastContextType>(() => ({
    show: (message, options) => {
      const duration = options?.duration ?? 2500
      const variant = options?.variant ?? 'success'
      if (variant === 'success') toast.success(message, { duration })
      else if (variant === 'error') toast.error(message, { duration })
      else toast(message, { duration })
    },
  }), [])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster position="bottom-right" richColors closeButton expand />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
