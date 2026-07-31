import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AssistantContext } from './assistant-policy.service.js';
import { addDays, businessDateStartUtc, todayBusinessDate } from '../common/time/business-date.js';

const FULFILLMENT_STATUSES = [
  'CONFIRMED',
  'PREPARING',
  'READY',
  'IN_DELIVERY',
  'DELIVERED',
  'PICKED_UP',
] as const;

type BranchArgs = { branch?: string };

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function parseDate(value?: unknown): string {
  const date = value === undefined || value === null || value === '' ? todayBusinessDate() : String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BadRequestException('La fecha debe tener formato YYYY-MM-DD');
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new BadRequestException('La fecha indicada no es válida');
  }
  return date;
}

function dateRange(date: string): { start: Date; end: Date } {
  return {
    start: businessDateStartUtc(date),
    end: businessDateStartUtc(addDays(date, 1)),
  };
}

function decimal(value: unknown): number {
  return Number(value ?? 0);
}

@Injectable()
export class AssistantReadService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveBranches(context: AssistantContext, args: BranchArgs): number[] {
    if (!args.branch || !args.branch.trim()) return context.branchIds;

    const query = normalize(args.branch);
    const branch = context.branches.find((candidate) => {
      const name = normalize(candidate.name);
      const slug = normalize(candidate.slug);
      return name === query || slug === query || name.includes(query) || slug.includes(query);
    });

    if (!branch) throw new BadRequestException('La sucursal solicitada no está autorizada');
    return [branch.id];
  }

  private branchName(context: AssistantContext, branchId: number): string {
    return context.branches.find((branch) => branch.id === branchId)?.name || `Sucursal ${branchId}`;
  }

  async salesSummary(context: AssistantContext, args: { date?: string; branch?: string }) {
    const date = parseDate(args.date);
    const { start, end } = dateRange(date);
    const branchIds = this.resolveBranches(context, args);
    const where = {
      branchId: { in: branchIds },
      createdAt: { gte: start, lt: end },
      status: { in: [...FULFILLMENT_STATUSES] },
    };

    const [aggregate, orders] = await Promise.all([
      this.prisma.order.aggregate({ where, _sum: { total: true }, _count: { _all: true } }),
      this.prisma.order.findMany({
        where,
        select: { branchId: true, total: true },
      }),
    ]);

    const byBranch = new Map<number, { totalSales: number; orderCount: number }>();
    for (const order of orders) {
      if (!order.branchId) continue;
      const current = byBranch.get(order.branchId) || { totalSales: 0, orderCount: 0 };
      current.totalSales += decimal(order.total);
      current.orderCount += 1;
      byBranch.set(order.branchId, current);
    }

    return {
      date,
      timezone: context.timezone,
      totalSales: decimal(aggregate._sum.total),
      orderCount: aggregate._count._all,
      branches: branchIds.map((branchId) => ({
        branchId,
        branchName: this.branchName(context, branchId),
        ...(byBranch.get(branchId) || { totalSales: 0, orderCount: 0 }),
      })),
    };
  }

  async lowRawMaterials(context: AssistantContext, args: BranchArgs) {
    const branchIds = this.resolveBranches(context, args);
    const rows = await this.prisma.rawMaterialInventory.findMany({
      where: {
        branchId: { in: branchIds },
        rawMaterial: { isActive: true, minStock: { not: null } },
      },
      select: {
        quantity: true,
        branch: { select: { id: true, name: true } },
        rawMaterial: { select: { id: true, name: true, baseUnit: true, minStock: true } },
      },
      orderBy: { rawMaterial: { name: 'asc' } },
      take: 100,
    });

    return {
      branches: branchIds.map((branchId) => this.branchName(context, branchId)),
      items: rows
        .filter((row) => row.rawMaterial.minStock !== null && decimal(row.quantity) <= decimal(row.rawMaterial.minStock))
        .map((row) => ({
          branchId: row.branch.id,
          branchName: row.branch.name,
          materialId: row.rawMaterial.id,
          materialName: row.rawMaterial.name,
          quantity: decimal(row.quantity),
          minimum: decimal(row.rawMaterial.minStock),
          unit: row.rawMaterial.baseUnit,
        })),
    };
  }

  async productInventory(context: AssistantContext, args: { productQuery?: string; branch?: string }) {
    const branchIds = this.resolveBranches(context, args);
    const query = typeof args.productQuery === 'string' ? args.productQuery.trim().slice(0, 80) : '';
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { slug: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
      take: 50,
    });

    const rows = await this.prisma.inventory.findMany({
      where: {
        branchId: { in: branchIds },
        ...(products.length ? { productId: { in: products.map((product) => product.id) } } : { productId: -1 }),
      },
      select: {
        product: { select: { id: true, name: true, slug: true } },
        branch: { select: { id: true, name: true } },
        quantity: true,
        reserved: true,
        updatedAt: true,
      },
      orderBy: [{ product: { name: 'asc' } }, { branchId: 'asc' }],
      take: 100,
    });

    return {
      query: query || null,
      items: rows.map((row) => ({
        productId: row.product.id,
        productName: row.product.name,
        slug: row.product.slug,
        branchId: row.branch.id,
        branchName: row.branch.name,
        quantity: row.quantity,
        reserved: row.reserved,
        available: row.quantity - row.reserved,
        updatedAt: row.updatedAt,
      })),
    };
  }

  async pendingOrders(context: AssistantContext, args: BranchArgs) {
    const branchIds = this.resolveBranches(context, args);
    const orders = await this.prisma.order.findMany({
      where: { branchId: { in: branchIds }, status: 'PENDING' },
      select: {
        orderNumber: true,
        total: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
        items: { select: { productName: true, quantity: true }, take: 20 },
      },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });

    return {
      count: orders.length,
      orders: orders.map((order) => ({
        orderNumber: order.orderNumber,
        branchId: order.branch?.id ?? null,
        branchName: order.branch?.name ?? 'Sin sucursal',
        total: decimal(order.total),
        createdAt: order.createdAt,
        items: order.items,
      })),
    };
  }

  async productionSummary(context: AssistantContext, args: { date?: string; branch?: string }) {
    const date = parseDate(args.date);
    const { start, end } = dateRange(date);
    const branchIds = this.resolveBranches(context, args);
    const rows = await this.prisma.productionLog.findMany({
      where: { branchId: { in: branchIds }, createdAt: { gte: start, lt: end } },
      select: {
        traysProduced: true,
        unitsProduced: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
        recipe: { select: { name: true, product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return {
      date,
      records: rows.map((row) => ({
        branchId: row.branch.id,
        branchName: row.branch.name,
        recipeName: row.recipe.name,
        productName: row.recipe.product.name,
        traysProduced: row.traysProduced,
        unitsProduced: row.unitsProduced,
        createdAt: row.createdAt,
      })),
      totalUnits: rows.reduce((sum, row) => sum + row.unitsProduced, 0),
      totalTrays: rows.reduce((sum, row) => sum + row.traysProduced, 0),
    };
  }

  async dailyCloseSummary(context: AssistantContext, args: { date?: string; branch?: string }) {
    const date = parseDate(args.date);
    const parsedDate = new Date(`${date}T00:00:00Z`);
    const branchIds = this.resolveBranches(context, args);
    const rows = await this.prisma.dailyClose.findMany({
      where: { branchId: { in: branchIds }, closeDate: parsedDate },
      select: {
        closeDate: true,
        branch: { select: { id: true, name: true } },
        items: { select: { soldQty: true, wasteQty: true, surplusQty: true } },
      },
      orderBy: { branchId: 'asc' },
    });

    return {
      date,
      closes: rows.map((row) => ({
        branchId: row.branch.id,
        branchName: row.branch.name,
        totalSold: row.items.reduce((sum, item) => sum + item.soldQty, 0),
        totalWaste: row.items.reduce((sum, item) => sum + item.wasteQty, 0),
        totalSurplus: row.items.reduce((sum, item) => sum + item.surplusQty, 0),
        productsClosed: row.items.length,
      })),
      note: 'El cierre actual no almacena precio histórico; no se reporta monto monetario.',
    };
  }

  async rawMaterialInventory(context: AssistantContext, args: { materialQuery?: string; branch?: string }) {
    const branchIds = this.resolveBranches(context, args);
    const query = typeof args.materialQuery === 'string' ? args.materialQuery.trim().slice(0, 80) : '';

    const materials = await this.prisma.rawMaterial.findMany({
      where: {
        isActive: true,
        ...(query
          ? {
              name: { contains: query, mode: 'insensitive' },
            }
          : {}),
      },
      select: { id: true, name: true, baseUnit: true, minStock: true },
      orderBy: { name: 'asc' },
      take: 50,
    });

    const rows = await this.prisma.rawMaterialInventory.findMany({
      where: {
        branchId: { in: branchIds },
        ...(materials.length ? { rawMaterialId: { in: materials.map((m) => m.id) } } : { rawMaterialId: -1 }),
      },
      select: {
        rawMaterial: { select: { id: true, name: true, baseUnit: true, minStock: true } },
        branch: { select: { id: true, name: true } },
        quantity: true,
        updatedAt: true,
      },
      orderBy: [{ rawMaterial: { name: 'asc' } }, { branchId: 'asc' }],
      take: 100,
    });

    return {
      query: query || null,
      items: rows.map((row) => ({
        materialId: row.rawMaterial.id,
        materialName: row.rawMaterial.name,
        branchId: row.branch.id,
        branchName: row.branch.name,
        quantity: decimal(row.quantity),
        minimum: row.rawMaterial.minStock ? decimal(row.rawMaterial.minStock) : null,
        unit: row.rawMaterial.baseUnit,
        isLowStock: row.rawMaterial.minStock !== null && decimal(row.quantity) <= decimal(row.rawMaterial.minStock),
        updatedAt: row.updatedAt,
      })),
    };
  }
}
