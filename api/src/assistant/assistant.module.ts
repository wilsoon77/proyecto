import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AssistantPolicyService } from './assistant-policy.service.js';
import { AssistantReadService } from './assistant-read.service.js';
import { AssistantService } from './assistant.service.js';

@Module({
  imports: [PrismaModule],
  providers: [AssistantPolicyService, AssistantReadService, AssistantService],
  exports: [AssistantPolicyService, AssistantReadService, AssistantService],
})
export class AssistantModule {}
