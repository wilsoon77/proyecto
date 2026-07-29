"use client"

import { useEffect, useRef } from "react"
import { TriangleAlert as AlertTriangle, X } from "lucide-react"
import { Button } from "./button"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "default"
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onCancel()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, isLoading, onCancel])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      dialogRef.current?.focus()
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: "bg-destructive/10 text-destructive",
      button: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
    },
    warning: {
      icon: "bg-warning/10 text-warning",
      button: "bg-warning hover:bg-warning/90 text-white",
    },
    default: {
      icon: "bg-primary/10 text-primary",
      button: "bg-primary hover:bg-primary/90 text-primary-foreground",
    },
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={!isLoading ? onCancel : undefined}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-card rounded-xl shadow-card-hover max-w-md w-full mx-4 animate-scale-in border border-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors disabled:opacity-50"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${styles.icon}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="mt-4 text-center">
            <h3 id="dialog-title" className="text-lg font-semibold text-card-foreground">
              {title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {message}
            </p>
          </div>

          <div className="mt-6 flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={`min-w-[100px] ${styles.button}`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </span>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
