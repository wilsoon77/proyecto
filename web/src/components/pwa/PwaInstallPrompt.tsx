"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Download, X, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

function isDeclinedPermanently(): boolean {
  if (typeof window === "undefined") return true
  try {
    return (
      localStorage.getItem("pwa_install_declined") === "true" ||
      sessionStorage.getItem("pwa_install_declined") === "true"
    )
  } catch {
    return false
  }
}

export function PwaInstallPrompt() {
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  // No mostrar NUNCA en rutas administrativas para no estorbar la operación
  const isAdminRoute = pathname?.startsWith("/admin")

  useEffect(() => {
    if (isAdminRoute) return

    // 1. Si ya está instalada como PWA (modo standalone), no mostrar nada
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    if (isStandalone) return

    // 2. Si el usuario ya rechazó la instalación previamente, NUNCA volver a mostrar
    if (isDeclinedPermanently()) return

    // 3. Capturar evento de instalación nativo del navegador
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Verificar nuevamente si fue rechazada antes de mostrar
      if (!isDeclinedPermanently()) {
        setShowPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    const handleAppInstalled = () => {
      setShowPrompt(false)
      setDeferredPrompt(null)
      try {
        localStorage.setItem("pwa_install_declined", "true")
      } catch {}
    }
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [isAdminRoute])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const choiceResult = await deferredPrompt.userChoice

    if (choiceResult.outcome === "accepted") {
      setShowPrompt(false)
      try {
        localStorage.setItem("pwa_install_declined", "true")
      } catch {}
    } else {
      // Si el usuario canceló el diálogo nativo, silenciar de forma permanente
      handleDismiss()
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    try {
      localStorage.setItem("pwa_install_declined", "true")
      sessionStorage.setItem("pwa_install_declined", "true")
    } catch {}
  }

  if (!showPrompt || isAdminRoute) return null

  return (
    <aside
      role="region"
      aria-label="Instalación de la aplicación"
      className="fixed bottom-20 md:bottom-4 right-4 left-4 md:left-auto md:max-w-sm z-30 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="bg-card/95 backdrop-blur-md text-card-foreground border border-border/70 rounded-xl p-3 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              Instalar Panadería Svetlana
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Acceso rápido desde tu inicio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-2.5 py-1 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-md shadow-sm transition-colors flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            title="No volver a mostrar"
            aria-label="No volver a mostrar sugerencia de instalación"
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
