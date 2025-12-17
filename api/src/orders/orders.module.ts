import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoggerService } from '../common/logger/logger.service.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, LoggerService],
  exports: [OrdersService],
})
export class OrdersModule {}
