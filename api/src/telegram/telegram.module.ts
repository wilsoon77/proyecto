import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AssistantModule } from '../assistant/assistant.module.js';
import { TelegramDeliveryModule } from './telegram-delivery.module.js';
import { TelegramController } from './telegram.controller.js';
import { TelegramLinkService } from './telegram-link.service.js';
import { TelegramService } from './telegram.service.js';

@Module({
  imports: [PrismaModule, AuditModule, AssistantModule, TelegramDeliveryModule],
  controllers: [TelegramController],
  providers: [TelegramLinkService, TelegramService],
  exports: [TelegramLinkService, TelegramService],
})
export class TelegramModule {}
