import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { InventoryLotsService } from './inventory-lots.service.js';
import { ExpirationService } from './expiration.service.js';
import { ExpirationScheduler } from './expiration.scheduler.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryLotsService, ExpirationService, ExpirationScheduler],
  exports: [InventoryService, InventoryLotsService, ExpirationService],
})
export class InventoryModule {}
