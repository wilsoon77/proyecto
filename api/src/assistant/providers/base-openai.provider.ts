import { Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemConfigService } from '../../system-config/system-config.service.js';
import {
  LlmMessage,
  LlmProvider,
  LlmProviderName,
  LlmProviderTestResult,
  LlmResponse,
  LlmTool,
} from '../llm-provider.interface.js';

export const DEFAULT_PROVIDER_MODELS: Record<LlmProviderName, string> = {
  gemini: 'gemini-2.5-flash',
  groq: 'qwen/qwen3.8-27b',
  mistral: 'mistral-small-latest',
  nvidia: 'deepseek-ai/deepseek-v4-flash-0731',
};

export abstract class BaseOpenAiProvider implements LlmProvider {
  protected readonly logger: Logger;

  abstract readonly name: LlmProviderName;
  abstract readonly endpointUrl: string;
  abstract readonly apiKeyEnvVar: string;
  abstract readonly modelEnvVar: string;

  constructor(
    protected readonly config: ConfigService,
    @Optional() protected readonly systemConfig?: SystemConfigService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  isConfigured(): boolean {
    return Boolean(this.getApiKey());
  }

  protected getApiKey(): string | undefined {
    const key = this.config.get<string>(this.apiKeyEnvVar) ?? process.env[this.apiKeyEnvVar];
    return key && key.trim().length > 0 ? key.trim() : undefined;
  }

  async getActiveModel(): Promise<string> {
    // 1. Dynamic override from SystemConfig (database)
    if (this.systemConfig) {
      try {
        const dbModel = await this.systemConfig.get<string>(`assistant.${this.name}_model`);
        if (dbModel && typeof dbModel === 'string' && dbModel.trim().length > 0) {
          return dbModel.trim();
        }
      } catch {
        // Ignored if setting does not exist yet
      }
    }

    // 2. Provider-specific environment variable (e.g. GEMINI_MODEL, GROQ_MODEL)
    const envModel = (
      this.config.get<string>(this.modelEnvVar) ||
      process.env[this.modelEnvVar]
    )?.trim();
    if (envModel) return envModel;

    // 3. Provider safe default (e.g. gemini-2.5-flash, qwen/qwen3.8-27b)
    const fallbackDefault = DEFAULT_PROVIDER_MODELS[this.name];
    if (fallbackDefault) return fallbackDefault;

    // 4. General fallback ASSISTANT_MODEL only as last resort
    const generalModel = (
      this.config.get<string>('ASSISTANT_MODEL') ||
      process.env.ASSISTANT_MODEL
    )?.trim();

    return generalModel || '';
  }

  async getModelSource(): Promise<'database' | 'env' | 'default'> {
    if (this.systemConfig) {
      try {
        const dbModel = await this.systemConfig.get<string>(`assistant.${this.name}_model`);
        if (dbModel && typeof dbModel === 'string' && dbModel.trim().length > 0) {
          return 'database';
        }
      } catch {
        // Ignored
      }
    }

    const envModel = (
      this.config.get<string>(this.modelEnvVar) ||
      process.env[this.modelEnvVar]
    )?.trim();
    if (envModel) return 'env';

    return 'default';
  }

  async testConnection(modelOverride?: string): Promise<LlmProviderTestResult> {
    const apiKey = this.getApiKey();
    const model = (modelOverride || (await this.getActiveModel()))?.trim();

    if (!apiKey) {
      return {
        ok: false,
        latencyMs: 0,
        status: 401,
        model: model || 'No configurado',
        error: `Falta la variable ${this.apiKeyEnvVar}`,
      };
    }

    if (!model) {
      return {
        ok: false,
        latencyMs: 0,
        status: 400,
        model: 'Sin modelo',
        error: `No hay modelo configurado para ${this.name}`,
      };
    }

    const start = Date.now();
    try {
      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Di "OK" en una palabra' }],
          max_tokens: 10,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(12_000),
      });

      const latencyMs = Date.now() - start;
      if (!response.ok) {
        const rawText = (await response.text()).slice(0, 400);
        let errorMsg = `HTTP ${response.status}`;
        try {
          const parsed = JSON.parse(rawText);
          errorMsg = parsed.error?.message || parsed.detail || parsed.message || rawText;
        } catch {
          errorMsg = rawText || errorMsg;
        }
        return {
          ok: false,
          latencyMs,
          status: response.status,
          model,
          error: errorMsg,
        };
      }

      return {
        ok: true,
        latencyMs,
        status: 200,
        model,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return {
        ok: false,
        latencyMs,
        status: 500,
        model,
        error: err?.message || 'Error de conexión / timeout',
      };
    }
  }

  async call(messages: LlmMessage[], tools: LlmTool[], modelOverride?: string): Promise<LlmResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(`El proveedor ${this.name} no está configurado (falta ${this.apiKeyEnvVar})`);
    }

    const model = (modelOverride || (await this.getActiveModel()))?.trim();
    if (!model) {
      throw new Error(`Debes especificar el modelo para ${this.name}`);
    }

    const timeoutMs = Math.max(5_000, Math.min(60_000, Number(this.config.get('ASSISTANT_TIMEOUT_MS') || 30_000)));
    const maxOutputTokens = Math.max(100, Math.min(2_000, Number(this.config.get('ASSISTANT_MAX_OUTPUT_TOKENS') || 700)));

    const response = await fetch(this.endpointUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        temperature: 0.2,
        max_tokens: maxOutputTokens,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`${this.name} HTTP ${response.status}: ${detail}`);
    }

    return (await response.json()) as LlmResponse;
  }
}
