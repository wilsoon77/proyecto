"use client"

import { useState } from "react"
import { ExternalLink, MessageCircle } from "lucide-react"
import { telegramService } from "@/lib/api/telegram"
import { useToast } from "@/context/ToastContext"

function isMobileDevice() {
  const userAgent = navigator.userAgent || ""
  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(userAgent)
    || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(userAgent))
}

function openTelegramApp(appDeepLink: string | undefined, webDeepLink: string) {
  if (!appDeepLink) {
    window.location.assign(webDeepLink)
    return
  }

  let appOpened = false

  const cleanup = () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    window.clearTimeout(fallbackTimer)
  }

  const handleVisibilityChange = () => {
    if (!document.hidden) return
    appOpened = true
    cleanup()
  }

  document.addEventListener("visibilitychange", handleVisibilityChange)
  const fallbackTimer = window.setTimeout(() => {
    cleanup()
    if (!appOpened && !document.hidden) window.location.assign(webDeepLink)
  }, 1800)

  try {
    // Telegram registers this scheme on Android/iOS. If the app is not
    // installed or the browser blocks it, the timer uses the web fallback.
    window.location.assign(appDeepLink)
  } catch {
    cleanup()
    window.location.assign(webDeepLink)
  }
}

export default function TelegramAssistantButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const openTelegram = async () => {
    setIsLoading(true)
    try {
      const session = await telegramService.createLinkSession()
      const webDeepLink = session.webDeepLink || session.deepLink

      if (isMobileDevice()) {
        openTelegramApp(session.appDeepLink, webDeepLink)
        showToast("Telegram se abrirá. Pulsa «Iniciar» en el bot para completar la vinculación.", "success")
      } else {
        // Open only the final URL. This avoids leaving an about:blank tab when
        // the browser blocks or mishandles the popup on mobile.
        const popup = window.open(webDeepLink, "_blank", "noopener,noreferrer")
        if (!popup) window.location.assign(webDeepLink)
        showToast("Abriendo el asistente de Telegram. Pulsa «Iniciar» en el bot para completar la vinculación.", "success")
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "No se pudo abrir Telegram", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={openTelegram}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
      title="Abrir el asistente privado en la aplicación de Telegram"
      aria-label="Abrir el asistente privado en Telegram"
    >
      <MessageCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Asistente Telegram</span>
      {isLoading ? <span className="text-xs">...</span> : <ExternalLink className="h-3.5 w-3.5" />}
    </button>
  )
}
