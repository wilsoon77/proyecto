import { Module } from '@nestjs/common';
import { StockMovementsController } from './stock-movements.controller.js';
import { StockMovementsService } from './stock-movements.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LoggerService } from '../common/logger/logger.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [StockMovementsController],
  providers: [StockMovementsService, LoggerService],
  exports: [StockMovementsService],
})
export class StockMovementsModule {}
