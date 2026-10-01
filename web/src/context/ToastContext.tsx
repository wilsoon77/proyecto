"use client"

import React, { createContext, useContext, useMemo } from "react"
import { Toaster, toast } from "sonner"

type ToastVariant = 'success' | 'error' | 'info'

type ToastContextType = {
  show: (message: string, options?: { variant?: ToastVariant; duration?: number }) => void
  /** Alias compatible con las páginas admin: showToast(msg, variant) */
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const api = useMemo<ToastContextType>(() => {
    const show = (message: string, options?: { variant?: ToastVariant; duration?: number }) => {
      const duration = options?.duration ?? 2500
      const variant = options?.variant ?? 'success'
      if (variant === 'success') toast.success(message, { duration })
      else if (variant === 'error') toast.error(message, { duration })
      else toast(message, { duration })
    }
    return {
      show,
      showToast: (message: string, variant?: ToastVariant) => show(message, { variant: variant ?? 'success' }),
    }
  }, [])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        expand
        mobileOffset={{ left: 0, right: 0, bottom: 16 }}
        style={{ maxWidth: "100vw", overflowX: "hidden" }}
        toastOptions={{
          style: { maxWidth: "calc(100vw - 32px)", margin: "0 auto" },
          className: "break-words",
        }}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}

