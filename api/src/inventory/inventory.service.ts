import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * InventoryService — Servicio puro para consultas de inventario de producto terminado.
 * 
 * Aplica: nestjs-service-layer (SRP, separación Controller/Service/Prisma)
 * 
 * El controlador NO debe acceder a Prisma directamente.
 * Toda la lógica de negocio y acceso a datos pasa por este servicio.
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Listar inventario de producto terminado, opcionalmente filtrado por producto y/o sucursal.
   */
  async list(productSlug?: string, branchSlug?: string) {
    const where: any = {};

    if (productSlug) {
      const product = await this.prisma.product.findUnique({ where: { slug: productSlug } });
      if (!product) return [];
      where.productId = product.id;
    }
    if (branchSlug) {
      const branch = await this.prisma.branch.findUnique({ where: { slug: branchSlug } });
      if (!branch) return [];
      where.branchId = branch.id;
    }

    const inventories = await this.prisma.inventory.findMany({
      where,
      include: { product: true, branch: true },
    });

    return inventories.map(i => ({
      product: { id: i.product.id, name: i.product.name, slug: i.product.slug },
      branch: { id: i.branch.id, name: i.branch.name, slug: i.branch.slug },
      quantity: i.quantity,
      reserved: i.reserved,
      available: i.quantity - i.reserved,
      updatedAt: i.updatedAt,
    }));
  }

  /**
   * Obtener inventario de un producto específico en una sucursal.
   */
  async getByProductAndBranch(productId: number, branchId: number) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { productId_branchId: { productId, branchId } },
      include: { product: true, branch: true },
    });

    if (!inventory) {
      throw new NotFoundException(
        `No se encontró inventario para producto ${productId} en sucursal ${branchId}`,
      );
    }

    return {
      product: { id: inventory.product.id, name: inventory.product.name, slug: inventory.product.slug },
      branch: { id: inventory.branch.id, name: inventory.branch.name, slug: inventory.branch.slug },
      quantity: inventory.quantity,
      reserved: inventory.reserved,
      available: inventory.quantity - inventory.reserved,
      updatedAt: inventory.updatedAt,
    };
  }

  /**
   * Obtener productos con stock bajo (quantity - reserved <= minThreshold).
   * Útil para alertas en el dashboard.
   */
  async getLowStock(branchId?: number, threshold: number = 10) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    const inventories = await this.prisma.inventory.findMany({
      where,
      include: { product: true, branch: true },
    });

    return inventories
      .filter(i => (i.quantity - i.reserved) <= threshold)
      .map(i => ({
        product: { id: i.product.id, name: i.product.name, slug: i.product.slug },
        branch: { id: i.branch.id, name: i.branch.name, slug: i.branch.slug },
        quantity: i.quantity,
        reserved: i.reserved,
        available: i.quantity - i.reserved,
        updatedAt: i.updatedAt,
      }));
  }
}
