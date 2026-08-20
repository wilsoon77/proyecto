import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProviderName } from '../llm-provider.interface.js';
import { BaseOpenAiProvider } from './base-openai.provider.js';

@Injectable()
export class GroqProvider extends BaseOpenAiProvider {
  readonly name: LlmProviderName = 'groq';
  readonly endpointUrl = 'https://api.groq.com/openai/v1/chat/completions';
  readonly apiKeyEnvVar = 'GROQ_API_KEY';
  readonly modelEnvVar = 'GROQ_MODEL';

  constructor(config: ConfigService) {
    super(config);
  }
}
