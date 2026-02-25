import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LoggerService } from '../common/logger/logger.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService, LoggerService],
  exports: [OrdersService],
})
export class OrdersModule {}
