import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductsService } from '../products/products.service.js';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, ProductsService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
