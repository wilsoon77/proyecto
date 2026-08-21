"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  MessageCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Unlink, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Smartphone,
  Bot,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { telegramService, type TelegramLinkSession, type TelegramLinkStatus } from "@/lib/api/telegram"
import { useToast } from "@/context/ToastContext"

function isMobileDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false
  const userAgent = navigator.userAgent || ""
  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(userAgent)
    || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(userAgent))
}

export default function TelegramAssistantButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [status, setStatus] = useState<TelegramLinkStatus | null>(null)
  const [session, setSession] = useState<TelegramLinkSession | null>(null)
  const [copied, setCopied] = useState(false)
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false)
  const { showToast } = useToast()

  const loadStatus = useCallback(async () => {
    setIsLoadingStatus(true)
    try {
      const res = await telegramService.getLinkStatus()
      setStatus(res)
      return res
    } catch (err) {
      console.error("Error al consultar estado de Telegram:", err)
      return null
    } finally {
      setIsLoadingStatus(false)
    }
  }, [])

  const generateSession = useCallback(async () => {
    setIsGenerating(true)
    try {
      const newSession = await telegramService.createLinkSession()
      setSession(newSession)
      return newSession
    } catch (err: unknown) {
      console.error("Error al generar sesión de Telegram:", err)
      showToast(err instanceof Error ? err.message : "No se pudo generar el enlace de Telegram", "error")
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [showToast])

  const handleOpenModal = async () => {
    setIsOpen(true)
    setShowUnlinkConfirm(false)
    const currentStatus = await loadStatus()
    if (!currentStatus?.linked) {
      await generateSession()
    }
  }

  const handleUnlink = async () => {
    setIsUnlinking(true)
    try {
      await telegramService.unlink()
      showToast("Cuenta de Telegram desvinculada exitosamente", "success")
      setShowUnlinkConfirm(false)
      await loadStatus()
      await generateSession()
    } catch (err: unknown) {
      console.error("Error al desvincular Telegram:", err)
      showToast(err instanceof Error ? err.message : "Error al desvincular cuenta", "error")
    } finally {
      setIsUnlinking(false)
    }
  }

  const handleCopyCommand = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      showToast("Comando copiado al portapapeles. Pégalo en el chat de Telegram.", "success")
      setTimeout(() => setCopied(false), 3000)
    } catch {
      showToast("No se pudo copiar automáticamente. Por favor selecciónalo manualmente.", "error")
    }
  }

  const handleDirectOpenTelegram = (url: string) => {
    if (isMobileDevice()) {
      window.location.href = url
    } else {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-medium text-sky-700 shadow-sm transition-colors hover:bg-sky-100 active:bg-sky-200"
        title="Configurar o abrir el asistente privado en Telegram"
        aria-label="Abrir asistente de Telegram"
      >
        <MessageCircle className="h-4 w-4 text-sky-600 flex-shrink-0" />
        <span className="hidden sm:inline font-semibold">Asistente Telegram</span>
        <span className="inline sm:hidden font-semibold">Telegram</span>
      </button>

      {/* Modal Interactivo de Vinculación */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Header del Modal */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 font-serif leading-tight">
                    Asistente en Telegram
                  </h3>
                  <p className="text-xs text-stone-500">
                    Consultas en tiempo real de inventarios, ventas y producción
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                aria-label="Cerrar ventana"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido según estado de vinculación */}
            {isLoadingStatus ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="h-7 w-7 animate-spin text-sky-600 mx-auto" />
                <p className="text-xs sm:text-sm text-stone-500">Verificando estado de la cuenta...</p>
              </div>
            ) : status?.linked ? (
              /* CASO 1: CUENTA YA VINCULADA */
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>Tu cuenta está vinculada y activa</span>
                  </div>
                  <div className="text-xs text-emerald-900/80 space-y-1 pl-7">
                    {status.username && (
                      <p>Usuario de Telegram: <strong className="text-emerald-950 font-mono">@{status.username}</strong></p>
                    )}
                    {status.linkedAt && (
                      <p>Fecha de vinculación: {new Date(status.linkedAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    )}
                    {status.lastSeenAt && (
                      <p className="text-stone-500">Última consulta: {new Date(status.lastSeenAt).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    )}
                  </div>
                </div>

                {/* Acciones para cuenta vinculada */}
                <div className="space-y-2.5 pt-1">
                  <Button
                    type="button"
                    onClick={() => {
                      const botUser = session?.botUsername || "panaderia_bot"
                      handleDirectOpenTelegram(`https://t.me/${botUser}`)
                    }}
                    className="w-full h-11 font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Abrir Chat con el Asistente
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>

                  {!showUnlinkConfirm ? (
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await generateSession()
                          setStatus((prev) => prev ? { ...prev, linked: false } : null)
                        }}
                        className="text-xs text-stone-600 hover:text-stone-900 underline font-medium"
                      >
                        Vincular otra cuenta / Generar nuevo código
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowUnlinkConfirm(true)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                        Desvincular
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-red-200 bg-red-50/80 p-3.5 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-start gap-2 text-xs text-red-800">
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>¿Estás seguro de desvincular este chat de Telegram? Ya no recibirás respuestas ni alertas en este chat.</span>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowUnlinkConfirm(false)}
                          disabled={isUnlinking}
                          className="h-8 text-xs border-stone-300"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleUnlink}
                          disabled={isUnlinking}
                          className="h-8 text-xs font-bold"
                        >
                          {isUnlinking ? (
                            <><RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />Desvinculando...</>
                          ) : (
                            <><Unlink className="mr-1.5 h-3 w-3" />Sí, desvincular</>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* CASO 2: VINCULAR NUEVA CUENTA */
              <div className="space-y-4">
                {isGenerating ? (
                  <div className="py-10 text-center space-y-2">
                    <RefreshCw className="h-7 w-7 animate-spin text-sky-600 mx-auto" />
                    <p className="text-xs sm:text-sm text-stone-500">Generando enlace seguro de vinculación...</p>
                  </div>
                ) : session ? (
                  <div className="space-y-4">
                    {/* Método 1: Apertura Directa */}
                    <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-900">
                        <Smartphone className="h-4 w-4 text-sky-600" />
                        <span>Opción recomendada</span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Abre Telegram y pulsa el botón <strong>«Iniciar»</strong> que aparecerá abajo en el chat para conectar tu cuenta automáticamente:
                      </p>
                      <Button
                        type="button"
                        onClick={() => handleDirectOpenTelegram(session.webDeepLink || session.deepLink)}
                        className="w-full h-11 font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Abrir Telegram y Vincular
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Separador */}
                    <div className="relative flex items-center justify-center">
                      <div className="border-t border-stone-200 w-full" />
                      <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-stone-400 absolute">
                        o de forma manual
                      </span>
                    </div>

                    {/* Método 2: Copiar Comando /start */}
                    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-2.5">
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Si Telegram no se vinculó automáticamente, solo copia y envía este comando en el chat con <strong>@{session.botUsername}</strong>:
                      </p>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-2 font-mono text-xs text-stone-800 select-all overflow-x-auto whitespace-nowrap">
                          {session.startCommand || `/start ${session.token}`}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCommand(session.startCommand || `/start ${session.token}`)}
                          className="h-9 px-3 border-stone-300 font-semibold text-xs flex-shrink-0"
                        >
                          {copied ? (
                            <><Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />Copiado</>
                          ) : (
                            <><Copy className="mr-1 h-3.5 w-3.5 text-stone-600" />Copiar</>
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                        <span>Enlace directo al bot:</span>
                        <a 
                          href={`https://t.me/${session.botUsername}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sky-600 hover:text-sky-800 font-semibold inline-flex items-center gap-1"
                        >
                          t.me/{session.botUsername}
                          <ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {/* Nota de expiración */}
                    <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                      <span>Código válido por 30 minutos.</span>
                      <button
                        type="button"
                        onClick={generateSession}
                        className="text-sky-600 hover:text-sky-800 font-semibold inline-flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Generar otro código
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-3">
                    <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                    <p className="text-xs sm:text-sm text-stone-600">No se pudo generar la sesión de vinculación.</p>
                    <Button type="button" onClick={generateSession} size="sm">
                      Reintentar
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Footer con ayuda */}
            <div className="border-t border-stone-100 pt-3 text-center text-xs text-stone-400">
              Solo los usuarios con rol de Administrador o Gerente pueden consultar información mediante Telegram.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
