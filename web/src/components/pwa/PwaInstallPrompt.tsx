"use client"

import { useState, useEffect } from "react"
import { Download, Share2, PlusSquare, X, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosInstructions, setShowIosInstructions] = useState(false)

  useEffect(() => {
    // 1. Verificar si ya está en modo standalone (ya instalada)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    if (isStandalone) {
      return
    }

    // 2. Verificar si el usuario ya descartó el banner recientemente (7 días)
    const dismissedAt = localStorage.getItem("pwa_install_dismissed_at")
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        return
      }
    }

    // 3. Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|edgios/.test(userAgent)

    if (isIosDevice && isSafari) {
      setIsIos(true)
      // Mostrar recordatorio en iOS después de unos segundos de navegación
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 4000)
      return () => clearTimeout(timer)
    }

    // 4. Capturar evento de instalación en Android / Desktop Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Si la app se instala con éxito, ocultar el banner
    const handleAppInstalled = () => {
      setShowPrompt(false)
      setDeferredPrompt(null)
    }
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosInstructions(true)
      return
    }

    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const choiceResult = await deferredPrompt.userChoice

    if (choiceResult.outcome === "accepted") {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setShowIosInstructions(false)
    localStorage.setItem("pwa_install_dismissed_at", Date.now().toString())
  }

  if (!showPrompt) return null

  return (
    <aside
      role="region"
      aria-label="Instalar aplicación"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-card/95 backdrop-blur-md text-card-foreground border border-amber-500/30 rounded-2xl p-4 shadow-xl shadow-amber-900/10 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Instalar Panadería Svetlana
              </h2>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Acceso directo desde tu pantalla de inicio y navegación más rápida.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Cerrar sugerencia de instalación"
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showIosInstructions ? (
          <div className="bg-muted/60 rounded-xl p-3 text-xs space-y-2 border border-border/50 animate-in fade-in duration-200">
            <p className="font-medium text-foreground">Para instalar en tu iPhone / iPad:</p>
            <ol className="space-y-1.5 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="font-semibold text-foreground">1.</span> Toca el botón{" "}
                <span className="inline-flex items-center gap-1 font-medium text-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                  <Share2 className="w-3.5 h-3.5 text-amber-600" /> Compartir
                </span>{" "}
                en la barra inferior de Safari.
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-foreground">2.</span> Desliza y selecciona{" "}
                <span className="inline-flex items-center gap-1 font-medium text-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                  <PlusSquare className="w-3.5 h-3.5 text-amber-600" /> Agregar a inicio
                </span>
                .
              </li>
            </ol>
            <button
              onClick={handleDismiss}
              className="w-full text-center text-xs font-medium text-amber-700 hover:text-amber-800 pt-1 block"
            >
              Entendido
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstallClick}
              className="px-4 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              {isIos ? (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Cómo instalar
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Instalar app
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
