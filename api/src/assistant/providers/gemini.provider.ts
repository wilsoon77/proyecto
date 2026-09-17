import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemConfigService } from '../../system-config/system-config.service.js';
import { LlmProviderName } from '../llm-provider.interface.js';
import { BaseOpenAiProvider } from './base-openai.provider.js';

@Injectable()
export class GeminiProvider extends BaseOpenAiProvider {
  readonly name: LlmProviderName = 'gemini';
  readonly endpointUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  readonly apiKeyEnvVar = 'GEMINI_API_KEY';
  readonly modelEnvVar = 'GEMINI_MODEL';

  constructor(config: ConfigService, @Optional() systemConfig?: SystemConfigService) {
    super(config, systemConfig);
  }
}
