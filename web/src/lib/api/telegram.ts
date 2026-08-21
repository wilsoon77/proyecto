import api from './client'

export interface TelegramLinkSession {
  token?: string
  startCommand?: string
  deepLink: string
  /** Enlace compatible con navegador; deepLink se conserva como alias. */
  webDeepLink?: string
  /** Enlace que intenta abrir directamente la aplicación de Telegram. */
  appDeepLink?: string
  expiresAt: string
  botUsername: string
}

export interface TelegramLinkStatus {
  configured: boolean
  linked: boolean
  username: string | null
  chatId: string | null
  linkedAt: string | null
  lastSeenAt: string | null
}

export const telegramService = {
  async createLinkSession(): Promise<TelegramLinkSession> {
    return api.post<TelegramLinkSession>('/telegram/link-session', {})
  },

  async getLinkStatus(): Promise<TelegramLinkStatus> {
    return api.get<TelegramLinkStatus>('/telegram/link-status')
  },

  async unlink(): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>('/telegram/link')
  },
}

export default telegramService
