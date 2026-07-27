import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TelegramDeliveryModule } from '../telegram/telegram-delivery.module.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';

@Global()
@Module({
  imports: [PrismaModule, TelegramDeliveryModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
