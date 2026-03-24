import { Module } from '@nestjs/common';
import { ProductionService } from './production.service.js';
import { ProductionController } from './production.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [ProductionService],
  controllers: [ProductionController],
  exports: [ProductionService],
})
export class ProductionModule {}
