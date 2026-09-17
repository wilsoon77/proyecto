import api from './client'

export interface ProviderDiagnostic {
  name: 'gemini' | 'groq' | 'mistral' | 'nvidia'
  displayName: string
  configured: boolean
  activeModel: string
  modelSource: 'database' | 'env' | 'default'
  recommendedModels: string[]
  isPrimary: boolean
}

export interface AssistantDiagnostics {
  activeProvider: string
  providers: ProviderDiagnostic[]
}

export interface ProviderTestResult {
  ok: boolean
  latencyMs: number
  status: number
  model: string
  error?: string
}

export interface TelegramDiagnostics {
  configured: boolean
  botUsername: string
  webhookUrl: string
  webhookInfo?: {
    url: string
    hasCustomCertificate: boolean
    pendingUpdateCount: number
    lastErrorDate?: string
    lastErrorMessage?: string
    ipAddress?: string
    maxConnections?: number
  }
  error?: string
}

export const assistantService = {
  async getDiagnostics(): Promise<AssistantDiagnostics> {
    return api.get<AssistantDiagnostics>('/assistant/diagnostics')
  },

  async testProvider(provider: string, model?: string): Promise<ProviderTestResult> {
    return api.post<ProviderTestResult>('/assistant/test-provider', { provider, model })
  },

  async updateConfig(data: { provider?: string; models?: Record<string, string> }): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/assistant/config', data)
  },

  async getTelegramDiagnostics(): Promise<TelegramDiagnostics> {
    return api.get<TelegramDiagnostics>('/telegram/diagnostics')
  },

  async registerTelegramWebhook(): Promise<{ ok: boolean; description?: string }> {
    return api.post<{ ok: boolean; description?: string }>('/telegram/register-webhook', {})
  },
}

export default assistantService
