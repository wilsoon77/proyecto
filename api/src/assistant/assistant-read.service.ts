import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductOrigin } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AssistantContext } from './assistant-policy.service.js';
import { addDays, businessDateStartUtc, dateKeyToUtcDate, formatBusinessDate, todayBusinessDate } from '../common/time/business-date.js';
import type { AssistantDateRange } from './assistant-query.js';

type BranchArgs = { branch?: string };
type DateRangeArgs = BranchArgs & { date?: unknown; fromDate?: unknown; toDate?: unknown };

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function parseDate(value?: unknown, fallback = todayBusinessDate()): string {
  const date = value === undefined || value === null || value === '' ? fallback : String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BadRequestException('La fecha debe tener formato YYYY-MM-DD');
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new BadRequestException('La fecha indicada no es válida');
  }
  return date;
}

function dateRange(fromDate: string, toDate: string): { start: Date; end: Date } {
  return {
    start: businessDateStartUtc(fromDate),
    end: businessDateStartUtc(addDays(toDate, 1)),
  };
}

function resolveDateRange(args: DateRangeArgs): AssistantDateRange {
  const fromDate = parseDate(args.fromDate ?? args.date);
  const toDate = parseDate(args.toDate ?? args.fromDate ?? args.date, fromDate);
  const from = dateKeyToUtcDate(fromDate).getTime();
  const to = dateKeyToUtcDate(toDate).getTime();
  if (to < from) throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final');
  if ((to - from) / 86_400_000 > 366) {
    throw new BadRequestException('El rango máximo de consulta es de 366 días');
  }
  return { fromDate, toDate };
}

function resolveExpirationRange(args: DateRangeArgs & { days?: unknown }): AssistantDateRange {
  const fromDate = parseDate(args.fromDate ?? args.date);
  const requestedDays = Number(args.days);
  const span = Number.isInteger(requestedDays) && requestedDays >= 0
    ? Math.min(365, requestedDays)
    : 30;
  const toDate = parseDate(args.toDate, addDays(fromDate, span));
  const from = dateKeyToUtcDate(fromDate).getTime();
  const to = dateKeyToUtcDate(toDate).getTime();
  if (to < from) throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final');
  if ((to - from) / 86_400_000 > 366) {
    throw new BadRequestException('El rango máximo de consulta es de 366 días');
  }
  return { fromDate, toDate };
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
    const simplifiedQuery = this.simplifyBranchQuery(query);
    const branch = context.branches.find((candidate) => {
      const variants = [candidate.name, candidate.slug]
        .map((value) => normalize(value))
        .flatMap((value) => [value, this.simplifyBranchQuery(value)]);
      return variants.some((variant) => variant === query
        || variant === simplifiedQuery
        || variant.includes(simplifiedQuery)
        || simplifiedQuery.includes(variant));
    });

    if (!branch) throw new BadRequestException('La sucursal solicitada no está autorizada');
    return [branch.id];
  }

  private branchName(context: AssistantContext, branchId: number): string {
    return context.branches.find((branch) => branch.id === branchId)?.name || `Sucursal ${branchId}`;
  }

  private resolveBranchLabels(context: AssistantContext, branch?: string): string[] {
    return this.resolveBranches(context, { branch }).map((branchId) => this.branchName(context, branchId));
  }

  private simplifyBranchQuery(value: string): string {
    return value
      .replace(/\b(sucursal|branch)\b/g, ' ')
      .replace(/\b(de|del|la|el|las|los|en)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async findMaterials(query: string) {
    const baseSelect = { id: true, name: true, baseUnit: true, minStock: true } as const;
    if (!query) {
      return this.prisma.rawMaterial.findMany({
        where: { isActive: true },
        select: baseSelect,
        orderBy: { name: 'asc' },
        take: 100,
      });
    }

    const direct = await this.prisma.rawMaterial.findMany({
      where: { isActive: true, name: { contains: query, mode: 'insensitive' } },
      select: baseSelect,
      orderBy: { name: 'asc' },
      take: 50,
    });
    if (direct.length > 0) return direct;

    const normalizedQuery = normalize(query);
    const all = await this.prisma.rawMaterial.findMany({
      where: { isActive: true },
      select: baseSelect,
      orderBy: { name: 'asc' },
      take: 200,
    });
    return all.filter((material) => {
      const name = normalize(material.name);
      return name.includes(normalizedQuery) || normalizedQuery.includes(name);
    }).slice(0, 50);
  }

  private async findProducts(query: string) {
    const baseSelect = { id: true, name: true, slug: true, isActive: true, stockUnitLabel: true } as const;
    if (!query) {
      return this.prisma.product.findMany({
        select: baseSelect,
        orderBy: { name: 'asc' },
        take: 100,
      });
    }

    const direct = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: baseSelect,
      orderBy: { name: 'asc' },
      take: 50,
    });
    if (direct.length > 0) return direct;

    const normalizedQuery = normalize(query);
    const all = await this.prisma.product.findMany({
      select: baseSelect,
      orderBy: { name: 'asc' },
      take: 200,
    });
    return all.filter((product) => {
      const name = normalize(product.name);
      const slug = normalize(product.slug);
      return name.includes(normalizedQuery) || normalizedQuery.includes(name)
        || slug.includes(normalizedQuery) || normalizedQuery.includes(slug);
    }).slice(0, 50);
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
    // The assistant is for operational users, so hidden e-commerce products
    // must remain queryable here and in daily close reports.
    const products = await this.findProducts(query);

    const rows = await this.prisma.inventory.findMany({
      where: {
        branchId: { in: branchIds },
        ...(products.length ? { productId: { in: products.map((product) => product.id) } } : { productId: -1 }),
      },
      select: {
        product: { select: { id: true, name: true, slug: true, isActive: true, stockUnitLabel: true } },
        branch: { select: { id: true, name: true } },
        quantity: true,
        reserved: true,
        updatedAt: true,
      },
      orderBy: [{ product: { name: 'asc' } }, { branchId: 'asc' }],
      take: 100,
    });

    const normalizedRows = query && products.length > 0
      ? products.flatMap((product) => branchIds.map((branchId) => ({
          product,
          branch: { id: branchId, name: this.branchName(context, branchId) },
          quantity: rows.find((row) => row.product.id === product.id && row.branch.id === branchId)?.quantity || 0,
          reserved: rows.find((row) => row.product.id === product.id && row.branch.id === branchId)?.reserved || 0,
          updatedAt: rows.find((row) => row.product.id === product.id && row.branch.id === branchId)?.updatedAt || null,
        })))
      : rows;

    const lotRows = normalizedRows.length === 0
      ? []
      : await this.prisma.inventoryLot.findMany({
          where: {
            productId: { in: [...new Set(normalizedRows.map((row) => row.product.id))] },
            branchId: { in: branchIds },
            availableQuantity: { gt: 0 },
            expiresAt: { lt: dateKeyToUtcDate(todayBusinessDate()) },
            product: { origin: ProductOrigin.COMPRADO, tracksExpiration: true },
          },
          select: { productId: true, branchId: true, availableQuantity: true },
        });
    const expiredByInventory = new Map<string, number>();
    for (const lot of lotRows) {
      const key = `${lot.productId}:${lot.branchId}`;
      expiredByInventory.set(key, (expiredByInventory.get(key) || 0) + lot.availableQuantity);
    }

    return {
      query: query || null,
      items: normalizedRows.map((row) => ({
        productId: row.product.id,
        productName: row.product.name,
        slug: row.product.slug,
        branchId: row.branch.id,
        branchName: row.branch.name,
        quantity: row.quantity,
        reserved: row.reserved,
        expiredQuantity: expiredByInventory.get(`${row.product.id}:${row.branch.id}`) || 0,
        available: Math.max(
          0,
          row.quantity - row.reserved - (expiredByInventory.get(`${row.product.id}:${row.branch.id}`) || 0),
        ),
        isActive: row.product.isActive,
        stockUnitLabel: row.product.stockUnitLabel,
        updatedAt: row.updatedAt,
      })),
    };
  }

  async inventoryLookup(
    context: AssistantContext,
    args: { query?: string; branch?: string; prefer?: 'raw' | 'product' },
  ) {
    const query = typeof args.query === 'string' ? args.query.trim().slice(0, 80) : '';
    const rawFirst = args.prefer === 'raw' || (!args.prefer && Boolean(query));

    if (rawFirst) {
      const raw = await this.rawMaterialInventory(context, { materialQuery: query, branch: args.branch });
      if (raw.items.length > 0 || !query || args.prefer === 'raw') {
        return { resourceType: 'rawMaterial' as const, ...raw };
      }
    }

    const products = await this.productInventory(context, { productQuery: query, branch: args.branch });
    if (products.items.length > 0 || !query || args.prefer === 'product') {
      return { resourceType: 'product' as const, ...products };
    }

    const raw = await this.rawMaterialInventory(context, { materialQuery: query, branch: args.branch });
    return raw.items.length > 0
      ? { resourceType: 'rawMaterial' as const, ...raw }
      : { resourceType: 'none' as const, query: query || null, items: [], branches: this.resolveBranchLabels(context, args.branch) };
  }

  async expirationSummary(
    context: AssistantContext,
    args: DateRangeArgs & { days?: unknown; includeExpired?: unknown },
  ) {
    const includeExpired = args.includeExpired === true || String(args.includeExpired).toLowerCase() === 'true';
    const requestedRange = resolveExpirationRange(args);
    const branchIds = this.resolveBranches(context, args);
    const fromDate = includeExpired && !args.fromDate && !args.toDate && !args.date
      ? addDays(todayBusinessDate(), -30)
      : requestedRange.fromDate;
    const toDate = requestedRange.toDate;
    const from = dateKeyToUtcDate(fromDate);
    const to = dateKeyToUtcDate(toDate);
    const today = dateKeyToUtcDate(todayBusinessDate());
    const rows = await this.prisma.inventoryLot.findMany({
      where: {
        branchId: { in: branchIds },
        availableQuantity: { gt: 0 },
        expiresAt: {
          not: null,
          ...(includeExpired ? { gte: from, lte: to } : { gte: from, lte: to }),
        },
        product: { origin: ProductOrigin.COMPRADO, tracksExpiration: true },
      },
      select: {
        id: true,
        availableQuantity: true,
        expiresAt: true,
        product: { select: { id: true, name: true, slug: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: [{ expiresAt: 'asc' }, { branchId: 'asc' }, { product: { name: 'asc' } }],
      take: 200,
    });

    return {
      fromDate,
      toDate,
      includeExpired,
      items: rows.flatMap((row) => {
        if (!row.expiresAt) return [];
        const expirationDate = row.expiresAt.toISOString().slice(0, 10);
        const expiresAt = dateKeyToUtcDate(expirationDate);
        const daysLeft = Math.round((expiresAt.getTime() - today.getTime()) / 86_400_000);
        if (!includeExpired && daysLeft < 0) return [];
        return [{
          lotId: row.id,
          productId: row.product.id,
          productName: row.product.name,
          slug: row.product.slug,
          branchId: row.branch.id,
          branchName: row.branch.name,
          quantity: row.availableQuantity,
          expiresAt: expirationDate,
          daysLeft,
          status: daysLeft < 0 ? 'EXPIRED' : 'EXPIRING_SOON',
        }];
      }),
    };
  }

  async productionSummary(context: AssistantContext, args: DateRangeArgs) {
    const { fromDate, toDate } = resolveDateRange(args);
    const { start, end } = dateRange(fromDate, toDate);
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
      take: 500,
    });

    const byDay = new Map<string, { date: string; branchId: number; branchName: string; records: number; unitsProduced: number; traysProduced: number }>();
    const byBranch = new Map<number, { branchId: number; branchName: string; records: number; unitsProduced: number; traysProduced: number }>();
    const byProduct = new Map<string, { productName: string; records: number; unitsProduced: number; traysProduced: number }>();
    for (const row of rows) {
      const date = formatBusinessDate(row.createdAt);
      const dayKey = `${date}:${row.branch.id}`;
      const day = byDay.get(dayKey) || { date, branchId: row.branch.id, branchName: row.branch.name, records: 0, unitsProduced: 0, traysProduced: 0 };
      day.records += 1;
      day.unitsProduced += row.unitsProduced;
      day.traysProduced += row.traysProduced;
      byDay.set(dayKey, day);

      const branch = byBranch.get(row.branch.id) || { branchId: row.branch.id, branchName: row.branch.name, records: 0, unitsProduced: 0, traysProduced: 0 };
      branch.records += 1;
      branch.unitsProduced += row.unitsProduced;
      branch.traysProduced += row.traysProduced;
      byBranch.set(row.branch.id, branch);

      const product = byProduct.get(row.recipe.product.name) || { productName: row.recipe.product.name, records: 0, unitsProduced: 0, traysProduced: 0 };
      product.records += 1;
      product.unitsProduced += row.unitsProduced;
      product.traysProduced += row.traysProduced;
      byProduct.set(row.recipe.product.name, product);
    }

    return {
      fromDate,
      toDate,
      records: rows.map((row) => ({
        branchId: row.branch.id,
        branchName: row.branch.name,
        date: formatBusinessDate(row.createdAt),
        recipeName: row.recipe.name,
        productName: row.recipe.product.name,
        traysProduced: row.traysProduced,
        unitsProduced: row.unitsProduced,
        createdAt: row.createdAt,
      })),
      totalUnits: rows.reduce((sum, row) => sum + row.unitsProduced, 0),
      totalTrays: rows.reduce((sum, row) => sum + row.traysProduced, 0),
      totalRecords: rows.length,
      byDay: [...byDay.values()],
      byBranch: [...byBranch.values()],
      byProduct: [...byProduct.values()],
    };
  }

  async dailyCloseSummary(context: AssistantContext, args: DateRangeArgs) {
    const { fromDate, toDate } = resolveDateRange(args);
    const branchIds = this.resolveBranches(context, args);
    const rows = await this.prisma.dailyClose.findMany({
      where: {
        branchId: { in: branchIds },
        closeDate: { gte: dateKeyToUtcDate(fromDate), lte: dateKeyToUtcDate(toDate) },
      },
      select: {
        closeDate: true,
        branch: { select: { id: true, name: true } },
        items: { select: { soldQty: true, wasteQty: true, surplusQty: true } },
      },
      orderBy: [{ closeDate: 'asc' }, { branchId: 'asc' }],
      take: 366 * Math.max(1, branchIds.length),
    });

    const totals = rows.reduce((summary, row) => {
      summary.totalSold += row.items.reduce((sum, item) => sum + item.soldQty, 0);
      summary.totalWaste += row.items.reduce((sum, item) => sum + item.wasteQty, 0);
      summary.totalSurplus += row.items.reduce((sum, item) => sum + item.surplusQty, 0);
      summary.productsClosed += row.items.length;
      return summary;
    }, { totalSold: 0, totalWaste: 0, totalSurplus: 0, productsClosed: 0 });

    return {
      fromDate,
      toDate,
      closes: rows.map((row) => ({
        date: row.closeDate.toISOString().slice(0, 10),
        branchId: row.branch.id,
        branchName: row.branch.name,
        totalSold: row.items.reduce((sum, item) => sum + item.soldQty, 0),
        totalWaste: row.items.reduce((sum, item) => sum + item.wasteQty, 0),
        totalSurplus: row.items.reduce((sum, item) => sum + item.surplusQty, 0),
        productsClosed: row.items.length,
      })),
      totalCloses: rows.length,
      totals,
      note: 'El cierre actual no almacena precio histórico; no se reporta monto monetario.',
    };
  }

  async rawMaterialInventory(context: AssistantContext, args: { materialQuery?: string; branch?: string }) {
    const branchIds = this.resolveBranches(context, args);
    const query = typeof args.materialQuery === 'string' ? args.materialQuery.trim().slice(0, 80) : '';
    const materials = await this.findMaterials(query);

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

    const normalizedRows = query && materials.length > 0
      ? materials.flatMap((material) => branchIds.map((branchId) => rows.find(
          (row) => row.rawMaterial.id === material.id && row.branch.id === branchId,
        ) || {
          rawMaterial: material,
          branch: { id: branchId, name: this.branchName(context, branchId) },
          quantity: 0,
          updatedAt: null,
        }))
      : rows;

    return {
      query: query || null,
      items: normalizedRows.map((row) => ({
        materialId: row.rawMaterial.id,
        materialName: row.rawMaterial.name,
        branchId: row.branch.id,
        branchName: row.branch.name,
        quantity: decimal(row.quantity),
        minimum: row.rawMaterial.minStock !== null ? decimal(row.rawMaterial.minStock) : null,
        unit: row.rawMaterial.baseUnit,
        isLowStock: row.rawMaterial.minStock !== null && decimal(row.quantity) <= decimal(row.rawMaterial.minStock),
        updatedAt: row.updatedAt,
      })),
    };
  }
}
