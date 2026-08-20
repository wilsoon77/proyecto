import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProviderName } from '../llm-provider.interface.js';
import { BaseOpenAiProvider } from './base-openai.provider.js';

@Injectable()
export class MistralProvider extends BaseOpenAiProvider {
  readonly name: LlmProviderName = 'mistral';
  readonly endpointUrl = 'https://api.mistral.ai/v1/chat/completions';
  readonly apiKeyEnvVar = 'MISTRAL_API_KEY';
  readonly modelEnvVar = 'MISTRAL_MODEL';

  constructor(config: ConfigService) {
    super(config);
  }
}
