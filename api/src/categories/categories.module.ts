import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProductsService } from '../products/products.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, ProductsService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
