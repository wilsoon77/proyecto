import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  addDays,
  businessDateStartUtc,
  dateKeyToUtcDate,
  getOperatingDays,
  operatingDateKeysBetween,
} from '../common/time/business-date.js';
import { reconcileDemand } from './demand-reconciliation.js';

const FULFILLED_STATUSES = [OrderStatus.DELIVERED, OrderStatus.PICKED_UP];

type DemandAggregate = {
  orderQty: number;
  dailyCloseQty: number;
  productionQty: number;
  wasteQty: number;
};

function key(branchId: number, productId: number, businessDate: string): string {
  return `${branchId}:${productId}:${businessDate}`;
}

@Injectable()
export class DemandHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Rebuilds the daily read model from the two supported sales paths:
   * fulfilled orders/POS plus the residual sales calculated by daily close.
   */
  async syncRange(options: { from: string; to: string; branchId?: number }) {
    if (options.from > options.to) throw new Error('from no puede ser posterior a to');
    const dates = operatingDateKeysBetween(options.from, options.to);
    if (dates.length > 366) {
      throw new Error('El rango de analítica no puede superar 366 días');
    }

    const branches = await this.prisma.branch.findMany({
      where: options.branchId ? { id: options.branchId } : undefined,
      select: { id: true, name: true },
    });
    const branchIds = branches.map((branch) => branch.id);
    if (branchIds.length === 0) {
      return { from: options.from, to: options.to, branches: [], rows: 0 };
    }

    const fromUtc = businessDateStartUtc(options.from);
    const toExclusiveUtc = businessDateStartUtc(addDays(options.to, 1));
    const fromDate = dateKeyToUtcDate(options.from);
    const toDate = dateKeyToUtcDate(options.to);

    const [products, orders, closeItems, productionLogs, wasteMovements] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true },
        select: { id: true },
      }),
      this.prisma.order.findMany({
        where: {
          branchId: { in: branchIds },
          status: { in: FULFILLED_STATUSES },
          createdAt: { gte: fromUtc, lt: toExclusiveUtc },
        },
        select: {
          branchId: true,
          createdAt: true,
          items: { select: { productId: true, quantity: true } },
        },
      }),
      this.prisma.dailyCloseItem.findMany({
        where: {
          dailyClose: {
            branchId: { in: branchIds },
            closeDate: { gte: fromDate, lte: toDate },
          },
        },
        select: {
          productId: true,
          soldQty: true,
          dailyClose: { select: { branchId: true, closeDate: true } },
        },
      }),
      this.prisma.productionLog.findMany({
        where: {
          branchId: { in: branchIds },
          createdAt: { gte: fromUtc, lt: toExclusiveUtc },
        },
        select: {
          branchId: true,
          createdAt: true,
          unitsProduced: true,
          recipe: { select: { productId: true } },
        },
      }),
      this.prisma.stockMovement.findMany({
        where: {
          fromBranchId: { in: branchIds },
          type: StockMovementType.MERMA,
          createdAt: { gte: fromUtc, lt: toExclusiveUtc },
        },
        select: {
          fromBranchId: true,
          productId: true,
          quantity: true,
          createdAt: true,
        },
      }),
    ]);

    const aggregates = new Map<string, DemandAggregate>();
    const getAggregate = (branchId: number, productId: number, businessDate: string) => {
      const aggregateKey = key(branchId, productId, businessDate);
      const existing = aggregates.get(aggregateKey);
      if (existing) return existing;
      const created: DemandAggregate = {
        orderQty: 0,
        dailyCloseQty: 0,
        productionQty: 0,
        wasteQty: 0,
      };
      aggregates.set(aggregateKey, created);
      return created;
    };

    for (const order of orders) {
      if (!order.branchId) continue;
      const businessDate = this.businessDate(order.createdAt);
      for (const item of order.items) {
        getAggregate(order.branchId, item.productId, businessDate).orderQty += item.quantity;
      }
    }

    for (const item of closeItems) {
      const businessDate = item.dailyClose.closeDate.toISOString().slice(0, 10);
      getAggregate(item.dailyClose.branchId, item.productId, businessDate).dailyCloseQty += item.soldQty;
    }

    for (const log of productionLogs) {
      getAggregate(log.branchId, log.recipe.productId, this.businessDate(log.createdAt)).productionQty += log.unitsProduced;
    }

    for (const movement of wasteMovements) {
      if (!movement.fromBranchId) continue;
      getAggregate(movement.fromBranchId, movement.productId, this.businessDate(movement.createdAt)).wasteQty += movement.quantity;
    }

    const rows = [];
    for (const branchId of branchIds) {
      for (const product of products) {
        for (const businessDate of dates) {
          const aggregate = aggregates.get(key(branchId, product.id, businessDate)) ?? {
            orderQty: 0,
            dailyCloseQty: 0,
            productionQty: 0,
            wasteQty: 0,
          };
          const demand = reconcileDemand(aggregate.orderQty, aggregate.dailyCloseQty);
          const dataQuality = demand.dataQuality === 'NO_DATA' && (aggregate.productionQty > 0 || aggregate.wasteQty > 0)
            ? 'OPERATIONAL_ONLY'
            : demand.dataQuality;

          rows.push({
            branchId,
            productId: product.id,
            businessDate,
            orderQty: demand.orderQty,
            dailyCloseQty: demand.dailyCloseQty,
            totalDemandQty: demand.totalDemandQty,
            productionQty: aggregate.productionQty,
            wasteQty: aggregate.wasteQty,
            stockout: false,
            dataQuality,
            sourceBreakdown: {
              ...demand.sourceBreakdown,
              production: aggregate.productionQty,
              waste: aggregate.wasteQty,
            },
          });
        }
      }
    }

    for (let offset = 0; offset < rows.length; offset += 100) {
      const chunk = rows.slice(offset, offset + 100);
      await this.prisma.$transaction(
        chunk.map((row) => this.prisma.demandDaily.upsert({
          where: {
            branchId_productId_businessDate: {
              branchId: row.branchId,
              productId: row.productId,
              businessDate: dateKeyToUtcDate(row.businessDate),
            },
          },
          update: {
            orderQty: row.orderQty,
            dailyCloseQty: row.dailyCloseQty,
            totalDemandQty: row.totalDemandQty,
            productionQty: row.productionQty,
            wasteQty: row.wasteQty,
            stockout: row.stockout,
            dataQuality: row.dataQuality,
            sourceBreakdown: row.sourceBreakdown as Prisma.InputJsonValue,
          },
          create: {
            branchId: row.branchId,
            productId: row.productId,
            businessDate: dateKeyToUtcDate(row.businessDate),
            orderQty: row.orderQty,
            dailyCloseQty: row.dailyCloseQty,
            totalDemandQty: row.totalDemandQty,
            productionQty: row.productionQty,
            wasteQty: row.wasteQty,
            stockout: row.stockout,
            dataQuality: row.dataQuality,
            sourceBreakdown: row.sourceBreakdown as Prisma.InputJsonValue,
          },
        })),
      );
    }

    return {
      from: options.from,
      to: options.to,
      operatingDays: getOperatingDays(),
      branches,
      rows: rows.length,
      syncedAt: new Date().toISOString(),
    };
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
