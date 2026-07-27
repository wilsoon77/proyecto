import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  addDays,
  businessDateStartUtc,
  dateKeyToUtcDate,
  getOperatingDays,
  isOperatingDate,
  operatingDateKeysBetween,
  todayBusinessDate,
} from '../common/time/business-date.js';
import { DemandHistoryService } from './demand-history.service.js';

const FULFILLED_STATUSES = [OrderStatus.DELIVERED, OrderStatus.PICKED_UP];

export type AnalyticsOptions = {
  branchId?: number;
  productId?: number;
  from?: string;
  to?: string;
  granularity?: 'day' | 'week' | 'month';
  metric?: 'sales' | 'orders' | 'production' | 'waste' | 'stock' | 'forecast';
  level?: 'branch' | 'day' | 'product' | 'source';
  page?: number;
  pageSize?: number;
};

type SeriesPoint = {
  date: string;
  demandQty: number;
  orderQty: number;
  dailyCloseQty: number;
  productionQty: number;
  wasteQty: number;
  revenue: number;
  orderCount: number;
};

function addSeriesPoint(map: Map<string, SeriesPoint>, date: string): SeriesPoint {
  const existing = map.get(date);
  if (existing) return existing;
  const point: SeriesPoint = {
    date,
    demandQty: 0,
    orderQty: 0,
    dailyCloseQty: 0,
    productionQty: 0,
    wasteQty: 0,
    revenue: 0,
    orderCount: 0,
  };
  map.set(date, point);
  return point;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly demandHistory: DemandHistoryService,
  ) {}

  async syncHistory(options: { from: string; to: string; branchId?: number }) {
    return this.demandHistory.syncRange(options);
  }

  async overview(options: AnalyticsOptions = {}) {
    const { from, to, dates } = this.normalizeRange(options);
    await this.ensureHistory(from, to, options.branchId);

    const demandRows = (await this.prisma.demandDaily.findMany({
      where: {
        branchId: options.branchId,
        productId: options.productId,
        businessDate: { gte: dateKeyToUtcDate(from), lte: dateKeyToUtcDate(to) },
      },
      include: {
        product: { select: { id: true, name: true, slug: true, unitsPerTray: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { businessDate: 'asc' },
    })).filter((row) => isOperatingDate(row.businessDate.toISOString().slice(0, 10)));

    const orders = await this.prisma.order.findMany({
      where: {
        branchId: options.branchId,
        status: { in: FULFILLED_STATUSES },
        createdAt: { gte: businessDateStartUtc(from), lt: businessDateStartUtc(addDays(to, 1)) },
      },
      select: { id: true, branchId: true, total: true, createdAt: true },
    });

    const seriesMap = new Map<string, SeriesPoint>();
    dates.forEach((date) => addSeriesPoint(seriesMap, date));
    for (const row of demandRows) {
      const point = addSeriesPoint(seriesMap, row.businessDate.toISOString().slice(0, 10));
      point.demandQty += row.totalDemandQty;
      point.orderQty += row.orderQty;
      point.dailyCloseQty += row.dailyCloseQty;
      point.productionQty += row.productionQty;
      point.wasteQty += row.wasteQty;
    }
    for (const order of orders) {
      const point = addSeriesPoint(seriesMap, this.businessDate(order.createdAt));
      point.revenue += Number(order.total);
      point.orderCount += 1;
    }

    const series = [...seriesMap.values()].sort((a, b) => a.date.localeCompare(b.date));
    const totalDemandQty = series.reduce((sum, point) => sum + point.demandQty, 0);
    const revenue = series.reduce((sum, point) => sum + point.revenue, 0);
    const productionQty = series.reduce((sum, point) => sum + point.productionQty, 0);
    const wasteQty = series.reduce((sum, point) => sum + point.wasteQty, 0);
    const orderCount = orders.length;
    const daysWithData = series.filter((point) => point.demandQty > 0 || point.productionQty > 0 || point.wasteQty > 0).length;

    const productMap = new Map<number, { productId: number; name: string; totalDemand: number; orderQty: number; dailyCloseQty: number }>();
    for (const row of demandRows) {
      const existing = productMap.get(row.productId) ?? {
        productId: row.productId,
        name: row.product.name,
        totalDemand: 0,
        orderQty: 0,
        dailyCloseQty: 0,
      };
      existing.totalDemand += row.totalDemandQty;
      existing.orderQty += row.orderQty;
      existing.dailyCloseQty += row.dailyCloseQty;
      productMap.set(row.productId, existing);
    }

    const inventoryRows = await this.prisma.inventory.findMany({
      where: { branchId: options.branchId },
      include: {
        product: { select: { id: true, name: true, unitsPerTray: true } },
        branch: { select: { id: true, name: true } },
      },
    });
    const lowStockProducts = inventoryRows
      .map((inventory) => ({
        productId: inventory.productId,
        productName: inventory.product.name,
        branchId: inventory.branchId,
        branchName: inventory.branch.name,
        available: inventory.quantity - inventory.reserved,
      }))
      .filter((item) => item.available < 5)
      .sort((a, b) => a.available - b.available)
      .slice(0, 20);

    const branchMap = new Map<number, { branchId: number; branchName: string; demandQty: number; revenue: number; orderCount: number }>();
    for (const row of demandRows) {
      const existing = branchMap.get(row.branchId) ?? {
        branchId: row.branchId,
        branchName: row.branch.name,
        demandQty: 0,
        revenue: 0,
        orderCount: 0,
      };
      existing.demandQty += row.totalDemandQty;
      branchMap.set(row.branchId, existing);
    }
    for (const order of orders) {
      if (!order.branchId) continue;
      const existing = branchMap.get(order.branchId);
      if (!existing) continue;
      existing.revenue += Number(order.total);
      existing.orderCount += 1;
    }

    return {
      range: { from, to, granularity: options.granularity ?? 'day' },
      timezone: process.env.STORE_TIMEZONE || 'America/Guatemala',
      operatingDays: getOperatingDays(),
      kpis: {
        revenue,
        orderCount,
        averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
        totalDemandQty,
        productionQty,
        wasteQty,
        lowStockAlerts: lowStockProducts.length,
      },
      dataQuality: {
        totalDays: dates.length,
        daysWithData,
        coverage: dates.length > 0 ? daysWithData / dates.length : 0,
        sources: {
          orders: series.reduce((sum, point) => sum + point.orderQty, 0),
          dailyCloseResidual: series.reduce((sum, point) => sum + point.dailyCloseQty, 0),
        },
      },
      series,
      topProducts: [...productMap.values()].sort((a, b) => b.totalDemand - a.totalDemand).slice(0, 20),
      salesByBranch: [...branchMap.values()].sort((a, b) => b.revenue - a.revenue),
      lowStockProducts,
      lastSyncedAt: demandRows.reduce<Date | null>((latest, row) => {
        if (!latest || row.updatedAt > latest) return row.updatedAt;
        return latest;
      }, null)?.toISOString() ?? null,
    };
  }

  async drilldown(options: AnalyticsOptions = {}) {
    const { from, to } = this.normalizeRange(options);
    await this.ensureHistory(from, to, options.branchId);
    const level = options.level ?? 'day';
    const rows = (await this.prisma.demandDaily.findMany({
      where: {
        branchId: options.branchId,
        productId: options.productId,
        businessDate: { gte: dateKeyToUtcDate(from), lte: dateKeyToUtcDate(to) },
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        branch: { select: { id: true, name: true } },
      },
    })).filter((row) => isOperatingDate(row.businessDate.toISOString().slice(0, 10)));

    if (level === 'source') {
      return this.sourceDrilldown(options, from, to);
    }

    const grouped = new Map<string, any>();
    for (const row of rows) {
      const groupKey = level === 'branch'
        ? String(row.branchId)
        : level === 'product'
          ? String(row.productId)
          : row.businessDate.toISOString().slice(0, 10);
      const existing = grouped.get(groupKey) ?? {
        key: groupKey,
        branchId: level === 'branch' ? row.branchId : options.branchId ?? null,
        branchName: level === 'branch' ? row.branch.name : null,
        productId: level === 'product' ? row.productId : null,
        productName: level === 'product' ? row.product.name : null,
        date: level === 'day' ? groupKey : null,
        demandQty: 0,
        orderQty: 0,
        dailyCloseQty: 0,
        productionQty: 0,
        wasteQty: 0,
      };
      existing.demandQty += row.totalDemandQty;
      existing.orderQty += row.orderQty;
      existing.dailyCloseQty += row.dailyCloseQty;
      existing.productionQty += row.productionQty;
      existing.wasteQty += row.wasteQty;
      grouped.set(groupKey, existing);
    }

    const data = [...grouped.values()].sort((a, b) => {
      if (level === 'day') return a.key.localeCompare(b.key);
      return b.demandQty - a.demandQty;
    });
    return {
      level,
      metric: options.metric ?? 'sales',
      range: { from, to },
      data,
      meta: { total: data.length, page: 1, pageSize: data.length },
    };
  }

  async productDemand(productId: number, options: AnalyticsOptions = {}) {
    return this.drilldown({ ...options, productId, level: 'day' });
  }

  private async sourceDrilldown(options: AnalyticsOptions, from: string, to: string) {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 25));
    const fromUtc = businessDateStartUtc(from);
    const toExclusiveUtc = businessDateStartUtc(addDays(to, 1));
    const branchFilter = options.branchId ? { branchId: options.branchId } : {};

    const [orders, closeItems, productionLogs, wasteMovements] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          ...branchFilter,
          status: { in: FULFILLED_STATUSES },
          createdAt: { gte: fromUtc, lt: toExclusiveUtc },
        },
        include: { branch: { select: { id: true, name: true } }, items: true },
      }),
      this.prisma.dailyCloseItem.findMany({
        where: {
          productId: options.productId,
          dailyClose: {
            ...branchFilter,
            closeDate: { gte: dateKeyToUtcDate(from), lte: dateKeyToUtcDate(to) },
          },
        },
        include: { dailyClose: { include: { branch: { select: { id: true, name: true } } } } },
      }),
      this.prisma.productionLog.findMany({
        where: {
          ...branchFilter,
          createdAt: { gte: fromUtc, lt: toExclusiveUtc },
          recipe: options.productId ? { productId: options.productId } : undefined,
        },
        include: { recipe: { include: { product: { select: { id: true, name: true } } } }, branch: { select: { id: true, name: true } } },
      }),
      this.prisma.stockMovement.findMany({
        where: {
          fromBranchId: options.branchId,
          type: StockMovementType.MERMA,
          productId: options.productId,
          createdAt: { gte: fromUtc, lt: toExclusiveUtc },
        },
        include: { product: { select: { id: true, name: true } }, fromBranch: { select: { id: true, name: true } } },
      }),
    ]);

    const sourceRows: any[] = [];
    for (const order of orders) {
      if (options.metric && !['sales', 'orders'].includes(options.metric)) continue;
      for (const item of order.items) {
        if (options.productId && item.productId !== options.productId) continue;
        sourceRows.push({
          source: order.shippingMethod === 'POS' ? 'POS' : 'ORDER',
          sourceId: order.id,
          reference: order.orderNumber,
          date: order.createdAt.toISOString(),
          businessDate: this.businessDate(order.createdAt),
          branchId: order.branchId,
          branchName: order.branch?.name ?? 'Sin sucursal',
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          amount: Number(item.unitPrice) * item.quantity,
          href: `/admin/ordenes/${order.id}`,
        });
      }
    }
    for (const item of closeItems) {
      if (options.metric && !['sales', 'orders'].includes(options.metric)) continue;
      sourceRows.push({
        source: 'DAILY_CLOSE',
        sourceId: item.dailyCloseId,
        reference: `CIERRE-${item.dailyCloseId}`,
        date: item.dailyClose.closeDate.toISOString(),
        businessDate: item.dailyClose.closeDate.toISOString().slice(0, 10),
        branchId: item.dailyClose.branchId,
        branchName: item.dailyClose.branch.name,
        productId: item.productId,
        productName: item.productName,
        quantity: item.soldQty,
        amount: null,
        href: `/admin/cierre-dia/${item.dailyCloseId}`,
      });
    }
    if (options.metric === 'production') {
      for (const log of productionLogs) {
        sourceRows.push({
          source: 'PRODUCTION',
          sourceId: log.id,
          reference: `PROD-${log.id}`,
          date: log.createdAt.toISOString(),
          businessDate: this.businessDate(log.createdAt),
          branchId: log.branchId,
          branchName: log.branch.name,
          productId: log.recipe.productId,
          productName: log.recipe.product.name,
          quantity: log.unitsProduced,
          amount: null,
          href: '/admin/produccion',
        });
      }
    }
    if (options.metric === 'waste') {
      for (const movement of wasteMovements) {
        sourceRows.push({
          source: 'WASTE',
          sourceId: movement.id,
          reference: movement.referenceId ?? `MOV-${movement.id}`,
          date: movement.createdAt.toISOString(),
          businessDate: this.businessDate(movement.createdAt),
          branchId: movement.fromBranchId,
          branchName: movement.fromBranch?.name ?? 'Sin sucursal',
          productId: movement.productId,
          productName: movement.product.name,
          quantity: movement.quantity,
          amount: null,
          href: '/admin/inventario/movimiento',
        });
      }
    }

    sourceRows.sort((a, b) => b.date.localeCompare(a.date));
    const total = sourceRows.length;
    return {
      level: 'source',
      metric: options.metric ?? 'sales',
      range: { from, to },
      data: sourceRows.slice((page - 1) * pageSize, page * pageSize),
      meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
    };
  }

  private async ensureHistory(from: string, to: string, branchId?: number) {
    const historyFrom = from < addDays(to, -89) ? from : addDays(to, -89);
    const latest = await this.prisma.demandDaily.aggregate({
      where: {
        branchId,
        businessDate: { gte: dateKeyToUtcDate(historyFrom), lte: dateKeyToUtcDate(to) },
      },
      _max: { updatedAt: true },
    });
    if (!latest._max.updatedAt || Date.now() - latest._max.updatedAt.getTime() > 15 * 60 * 1000) {
      await this.demandHistory.syncRange({ from: historyFrom, to, branchId });
    }
  }

  private normalizeRange(options: AnalyticsOptions) {
    const to = options.to ?? todayBusinessDate();
    const from = options.from ?? addDays(to, -29);
    if (from > to) throw new Error('from no puede ser posterior a to');
    const dates = operatingDateKeysBetween(from, to);
    if (dates.length > 366) throw new Error('El rango de analítica no puede superar 366 días');
    return { from, to, dates };
  }

  private businessDate(value: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: process.env.STORE_TIMEZONE || 'America/Guatemala',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
}
