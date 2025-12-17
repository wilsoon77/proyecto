import { Module } from '@nestjs/common';
import { StockMovementsController } from './stock-movements.controller.js';
import { StockMovementsService } from './stock-movements.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoggerService } from '../common/logger/logger.service.js';

@Module({
  controllers: [StockMovementsController],
  providers: [StockMovementsService, PrismaService, LoggerService],
  exports: [StockMovementsService],
})
export class StockMovementsModule {}
