import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmMessage, LlmProvider, LlmProviderName, LlmResponse, LlmTool } from '../llm-provider.interface.js';

export abstract class BaseOpenAiProvider implements LlmProvider {
  protected readonly logger: Logger;

  abstract readonly name: LlmProviderName;
  abstract readonly endpointUrl: string;
  abstract readonly apiKeyEnvVar: string;
  abstract readonly modelEnvVar: string;

  constructor(protected readonly config: ConfigService) {
    this.logger = new Logger(this.constructor.name);
  }

  isConfigured(): boolean {
    const hasKey = Boolean(this.getApiKey());
    const hasModel = Boolean(
      (
        this.config.get<string>('ASSISTANT_MODEL') ||
        process.env.ASSISTANT_MODEL ||
        this.config.get<string>(this.modelEnvVar) ||
        process.env[this.modelEnvVar]
      )?.trim(),
    );
    return hasKey && hasModel;
  }

  protected getApiKey(): string | undefined {
    const key = this.config.get<string>(this.apiKeyEnvVar) ?? process.env[this.apiKeyEnvVar];
    return key && key.trim().length > 0 ? key.trim() : undefined;
  }

  protected getModel(): string {
    const model = (
      this.config.get<string>('ASSISTANT_MODEL') ||
      process.env.ASSISTANT_MODEL ||
      this.config.get<string>(this.modelEnvVar) ||
      process.env[this.modelEnvVar]
    )?.trim();

    if (!model) {
      throw new Error(`Debes especificar el modelo para ${this.name} en la variable ${this.modelEnvVar} o ASSISTANT_MODEL en tu archivo .env`);
    }

    return model;
  }

  async call(messages: LlmMessage[], tools: LlmTool[]): Promise<LlmResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(`El proveedor ${this.name} no está configurado (falta ${this.apiKeyEnvVar})`);
    }

    const model = this.getModel();
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
