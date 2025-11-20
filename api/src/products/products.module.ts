import { Module } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  providers: [ProductsService, PrismaService],
  controllers: [ProductsController],
})
export class ProductsModule {}
