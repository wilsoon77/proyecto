import { Module } from '@nestjs/common';
import { DailyCloseController } from './daily-close.controller.js';
import { DailyCloseService } from './daily-close.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [DailyCloseController],
  providers: [DailyCloseService],
  exports: [DailyCloseService],
})
export class DailyCloseModule {}
