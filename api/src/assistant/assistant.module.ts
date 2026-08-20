import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AssistantPolicyService } from './assistant-policy.service.js';
import { AssistantReadService } from './assistant-read.service.js';
import { AssistantService } from './assistant.service.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { GroqProvider } from './providers/groq.provider.js';
import { MistralProvider } from './providers/mistral.provider.js';
import { NvidiaProvider } from './providers/nvidia.provider.js';

@Module({
  imports: [PrismaModule],
  providers: [
    AssistantPolicyService,
    AssistantReadService,
    GeminiProvider,
    GroqProvider,
    MistralProvider,
    NvidiaProvider,
    AssistantService,
  ],
  exports: [
    AssistantPolicyService,
    AssistantReadService,
    GeminiProvider,
    GroqProvider,
    MistralProvider,
    NvidiaProvider,
    AssistantService,
  ],
})
export class AssistantModule {}
