import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { WhatsAppDeliveryService } from './whatsapp-delivery.service.js';

@Module({
  imports: [PrismaModule],
  providers: [WhatsAppDeliveryService],
  exports: [WhatsAppDeliveryService],
})
export class WhatsAppModule {}
