import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { addDays, dateKeyToUtcDate, todayBusinessDate } from '../common/time/business-date.js';

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

  /**
   * Lists active lots that are expired, close to expiration, or still lack a
   * date. The latter is useful during the migration from aggregate inventory.
   */
  async listExpirations(
    branchSlug?: string,
    status: 'all' | 'expired' | 'expiring' | 'no-date' = 'all',
    days = 7,
  ) {
    const branch = branchSlug
      ? await this.prisma.branch.findUnique({ where: { slug: branchSlug }, select: { id: true } })
      : undefined;
    if (branchSlug && !branch) return { data: [], summary: { expired: 0, expiring: 0, noDate: 0 } };

    const safeDays = Math.max(0, Math.min(365, Math.floor(days)));
    const todayKey = todayBusinessDate();
    const today = dateKeyToUtcDate(todayKey);
    const horizon = dateKeyToUtcDate(addDays(todayKey, safeDays));
    const baseWhere: any = {
      availableQuantity: { gt: 0 },
      ...(branch ? { branchId: branch.id } : {}),
      product: { tracksExpiration: true },
    };

    if (status === 'expired') baseWhere.expiresAt = { lt: today };
    if (status === 'expiring') baseWhere.expiresAt = { gte: today, lte: horizon };
    if (status === 'no-date') baseWhere.expiresAt = null;
    if (status === 'all') {
      baseWhere.OR = [
        { expiresAt: { lt: today } },
        { expiresAt: { gte: today, lte: horizon } },
        { expiresAt: null },
      ];
    }

    const lots = await this.prisma.inventoryLot.findMany({
      where: baseWhere,
      include: {
        product: { select: { id: true, name: true, slug: true, origin: true } },
        branch: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }],
    });

    const data = lots.map((lot) => {
      const expiresAt = lot.expiresAt?.toISOString().slice(0, 10) ?? null;
      const daysLeft = expiresAt
        ? Math.round((dateKeyToUtcDate(expiresAt).getTime() - today.getTime()) / 86_400_000)
        : null;
      return {
        id: lot.id,
        product: lot.product,
        branch: lot.branch,
        sourceType: lot.sourceType,
        initialQuantity: lot.initialQuantity,
        availableQuantity: lot.availableQuantity,
        expiresAt,
        alertAt: lot.alertAt?.toISOString().slice(0, 10) ?? null,
        daysLeft,
        status: expiresAt === null ? 'NO_DATE' : daysLeft !== null && daysLeft < 0 ? 'EXPIRED' : 'EXPIRING_SOON',
      };
    });

    return {
      data,
      summary: {
        expired: data.filter((lot) => lot.status === 'EXPIRED').length,
        expiring: data.filter((lot) => lot.status === 'EXPIRING_SOON').length,
        noDate: data.filter((lot) => lot.status === 'NO_DATE').length,
      },
    };
  }
}
