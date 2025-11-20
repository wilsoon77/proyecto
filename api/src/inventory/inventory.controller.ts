import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiTags, ApiQuery } from '@nestjs/swagger';

@Controller('inventory')
@ApiTags('inventory')
export class InventoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiQuery({ name: 'product', required: false, description: 'slug del producto' })
  @ApiQuery({ name: 'branch', required: false, description: 'slug de la sucursal' })
  async list(@Query('product') productSlug?: string, @Query('branch') branchSlug?: string) {
    const whereInv: any = {};

    if (productSlug) {
      const product = await this.prisma.product.findUnique({ where: { slug: productSlug } });
      if (!product) return [];
      whereInv.productId = product.id;
    }
    if (branchSlug) {
      const branch = await this.prisma.branch.findUnique({ where: { slug: branchSlug } });
      if (!branch) return [];
      whereInv.branchId = branch.id;
    }

    const inv = await this.prisma.inventory.findMany({ where: whereInv, include: { product: true, branch: true } });
    return inv.map(i => ({
      product: { id: i.product.id, name: i.product.name, slug: i.product.slug },
      branch: { id: i.branch.id, name: i.branch.name, slug: i.branch.slug },
      quantity: i.quantity,
      reserved: i.reserved,
      available: i.quantity - i.reserved,
      updatedAt: i.updatedAt,
    }));
  }
}
