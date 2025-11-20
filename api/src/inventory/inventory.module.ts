import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [InventoryController],
  providers: [PrismaService],
})
export class InventoryModule {}
