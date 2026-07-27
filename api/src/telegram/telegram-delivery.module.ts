import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TelegramDeliveryService } from './telegram-delivery.service.js';

@Module({
  imports: [PrismaModule],
  providers: [TelegramDeliveryService],
  exports: [TelegramDeliveryService],
})
export class TelegramDeliveryModule {}
