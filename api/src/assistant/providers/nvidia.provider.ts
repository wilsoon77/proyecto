import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProviderName } from '../llm-provider.interface.js';
import { BaseOpenAiProvider } from './base-openai.provider.js';

@Injectable()
export class NvidiaProvider extends BaseOpenAiProvider {
  readonly name: LlmProviderName = 'nvidia';
  readonly endpointUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
  readonly apiKeyEnvVar = 'NVIDIA_API_KEY';
  readonly modelEnvVar = 'NVIDIA_MODEL';

  constructor(config: ConfigService) {
    super(config);
  }
}
