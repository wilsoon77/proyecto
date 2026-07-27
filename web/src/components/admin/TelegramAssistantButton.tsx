"use client"

import { useState } from "react"
import { ExternalLink, MessageCircle } from "lucide-react"
import { telegramService } from "@/lib/api/telegram"
import { useToast } from "@/context/ToastContext"

export default function TelegramAssistantButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const openTelegram = async () => {
    // Open synchronously to avoid popup blockers after the API request.
    const popup = window.open("about:blank", "_blank", "noopener,noreferrer")
    setIsLoading(true)
    try {
      const session = await telegramService.createLinkSession()
      if (popup && !popup.closed) {
        popup.location.href = session.deepLink
      } else {
        window.location.href = session.deepLink
      }
      showToast("Abriendo el asistente de Telegram", "success")
    } catch (error) {
      popup?.close()
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
      title="Abrir el asistente privado en Telegram"
    >
      <MessageCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Asistente Telegram</span>
      {isLoading ? <span className="text-xs">...</span> : <ExternalLink className="h-3.5 w-3.5" />}
    </button>
  )
}
