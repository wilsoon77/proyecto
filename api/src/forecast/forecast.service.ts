import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  addDays,
  dateKeyToUtcDate,
  getOperatingDays,
  nextOperatingDateKeys,
  operatingDateKeysBetween,
  previousOperatingDateKeys,
  todayBusinessDate,
} from '../common/time/business-date.js';
import { DemandHistoryService } from '../analytics/demand-history.service.js';
import { calculateDemandForecast, calculateWape } from './forecast-calculator.js';

const MODEL_VERSION = 'WMA_WEEKDAY_V1';

type GenerateOptions = {
  branchId?: number;
  horizonDays?: number;
};

@Injectable()
export class ForecastService {
  private readonly logger = new Logger(ForecastService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly demandHistory: DemandHistoryService,
    private readonly notifications: NotificationsService,
  ) {}

  async generate(options: GenerateOptions = {}) {
    const horizonDays = Math.min(31, Math.max(1, options.horizonDays ?? 7));
    const branches = await this.prisma.branch.findMany({
      where: options.branchId ? { id: options.branchId } : undefined,
      select: { id: true, name: true },
    });
    const results = [];
    for (const branch of branches) {
      results.push(await this.generateForBranch(branch.id, branch.name, horizonDays));
    }
    return options.branchId ? results[0] ?? null : results;
  }

  async latest(branchId?: number) {
    const runs = await this.prisma.forecastRun.findMany({
      where: { branchId, status: 'SUCCESS' },
      orderBy: { generatedAt: 'desc' },
      take: branchId ? 1 : 50,
      include: {
        branch: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { id: true, name: true, slug: true, unitsPerTray: true } } },
          orderBy: [{ forecastDate: 'asc' }, { productId: 'asc' }],
        },
      },
    });

    if (branchId) return runs[0] ?? null;
    const latestByBranch = new Map<number, (typeof runs)[number]>();
    for (const run of runs) {
      if (!latestByBranch.has(run.branchId)) latestByBranch.set(run.branchId, run);
    }
    return [...latestByBranch.values()];
  }

  async getRun(runId: number, branchId?: number) {
    const run = await this.prisma.forecastRun.findUnique({
      where: { id: runId },
      include: {
        branch: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { id: true, name: true, slug: true, unitsPerTray: true } } },
          orderBy: [{ forecastDate: 'asc' }, { productId: 'asc' }],
        },
      },
    });
    if (!run || (branchId && run.branchId !== branchId)) throw new NotFoundException('Predicción no encontrada');
    return run;
  }

  async backtest(branchId?: number, evaluationDays = 14) {
    const days = Math.min(30, Math.max(7, evaluationDays));
    const branches = await this.prisma.branch.findMany({
      where: branchId ? { id: branchId } : undefined,
      select: { id: true, name: true },
    });
    const results = [];
    for (const branch of branches) {
      results.push(await this.backtestForBranch(branch.id, branch.name, days));
    }
    return branchId ? results[0] ?? null : results;
  }

  private async generateForBranch(branchId: number, branchName: string, horizonDays: number) {
    const today = todayBusinessDate();
    const historyFrom = addDays(today, -89);
    const historyDates = operatingDateKeysBetween(historyFrom, today);
    const forecastDates = nextOperatingDateKeys(today, horizonDays);
    const forecastStart = forecastDates[0] ?? addDays(today, 1);
    const forecastEnd = forecastDates[forecastDates.length - 1] ?? forecastStart;

    await this.demandHistory.syncRange({ from: historyFrom, to: today, branchId });

    const [products, demandRows, inventories, rawMaterialInventories] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          unitsPerTray: true,
          origin: true,
          recipes: {
            where: { isActive: true },
            take: 1,
            include: { ingredients: { include: { rawMaterial: true } } },
          },
          inventories: { where: { branchId }, select: { quantity: true, reserved: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.demandDaily.findMany({
        where: {
          branchId,
          businessDate: { gte: dateKeyToUtcDate(historyFrom), lte: dateKeyToUtcDate(today) },
        },
        select: { productId: true, businessDate: true, totalDemandQty: true, stockout: true },
      }),
      this.prisma.inventory.findMany({
        where: { branchId },
        select: { productId: true, quantity: true, reserved: true },
      }),
      this.prisma.rawMaterialInventory.findMany({
        where: { branchId },
        select: { rawMaterialId: true, quantity: true, rawMaterial: { select: { id: true, name: true, baseUnit: true } } },
      }),
    ]);

    const demandMap = new Map<string, number>();
    for (const row of demandRows) {
      demandMap.set(`${row.productId}:${row.businessDate.toISOString().slice(0, 10)}`, row.totalDemandQty);
    }
    const inventoryMap = new Map(inventories.map((inventory) => [inventory.productId, inventory]));
    const rawInventoryMap = new Map(rawMaterialInventories.map((inventory) => [inventory.rawMaterialId, inventory]));
    const run = await this.prisma.forecastRun.create({
      data: {
        branchId,
        periodStart: dateKeyToUtcDate(forecastStart),
        periodEnd: dateKeyToUtcDate(forecastEnd),
        horizonDays,
        modelVersion: MODEL_VERSION,
        status: 'RUNNING',
        parameters: {
          historyDays: historyDates.length,
          operatingDays: getOperatingDays(),
          safetyStockRate: 0.1,
          timezone: process.env.STORE_TIMEZONE || 'America/Guatemala',
        } as Prisma.InputJsonValue,
      },
    });

    try {
      const forecastItems: Array<{
        forecastRunId: number;
        productId: number;
        forecastDate: Date;
        predictedQty: number;
        lowerBound: number;
        upperBound: number;
        confidence: number;
        recommendedProductionQty: number;
        recommendedTrays: number | null;
        rawMaterialRisk: Prisma.InputJsonValue | undefined;
      }> = [];

      for (const product of products) {
        const observations = historyDates.map((date) => ({
          date,
          quantity: demandMap.get(`${product.id}:${date}`) ?? 0,
        }));
        const inventory = inventoryMap.get(product.id);
        let runningStock = Math.max(0, (inventory?.quantity ?? 0) - (inventory?.reserved ?? 0));

        for (const forecastDate of forecastDates) {
          const calculation = calculateDemandForecast(observations, forecastDate);
          const safetyStock = Math.ceil(calculation.predictedQty * 0.1);
          const needed = Math.max(0, Math.ceil(calculation.predictedQty + safetyStock - runningStock));
          const recommendedTrays = product.unitsPerTray && product.unitsPerTray > 0
            ? Math.ceil(needed / product.unitsPerTray)
            : null;
          const recommendedProductionQty = recommendedTrays !== null
            ? recommendedTrays * product.unitsPerTray!
            : needed;
          const risk = this.calculateRawMaterialRisk(product, recommendedTrays, rawInventoryMap);

          forecastItems.push({
            forecastRunId: run.id,
            productId: product.id,
            forecastDate: dateKeyToUtcDate(forecastDate),
            predictedQty: calculation.predictedQty,
            lowerBound: calculation.lowerBound,
            upperBound: calculation.upperBound,
            confidence: calculation.confidence,
            recommendedProductionQty,
            recommendedTrays,
            rawMaterialRisk: risk ? risk as Prisma.InputJsonValue : undefined,
          });

          runningStock = Math.max(0, runningStock + recommendedProductionQty - calculation.predictedQty);
        }
      }

      if (forecastItems.length > 0) {
        await this.prisma.forecastItem.createMany({ data: forecastItems });
      }
      await this.prisma.forecastRun.update({ where: { id: run.id }, data: { status: 'SUCCESS' } });

      const riskCount = forecastItems.filter((item) => {
        const risk = item.rawMaterialRisk as Record<string, any> | undefined;
        return risk?.status === 'RISK' || risk?.status === 'NO_RECIPE';
      }).length;
      if (riskCount > 0) {
        await this.notifications.sendByConfig('forecast.risk', {
          branchName,
          riskCount,
          forecastDate: forecastStart,
        }, '/admin/reportes');
      }

      return this.getRun(run.id, branchId);
    } catch (error) {
      await this.prisma.forecastRun.update({
        where: { id: run.id },
        data: { status: 'FAILED', errorMessage: error instanceof Error ? error.message : 'Error desconocido' },
      }).catch((updateError) => this.logger.error(`No se pudo registrar el fallo de la predicción ${run.id}`, updateError));
      throw error;
    }
  }

  private async backtestForBranch(branchId: number, branchName: string, evaluationDays: number) {
    const evaluationDates = previousOperatingDateKeys(todayBusinessDate(), evaluationDays);
    const evaluationStart = evaluationDates[0] ?? addDays(todayBusinessDate(), -1);
    const evaluationEnd = evaluationDates[evaluationDates.length - 1] ?? evaluationStart;
    const historyFrom = addDays(evaluationStart, -89);
    const historyDates = operatingDateKeysBetween(historyFrom, evaluationEnd);

    await this.demandHistory.syncRange({ from: historyFrom, to: evaluationEnd, branchId });
    const rows = await this.prisma.demandDaily.findMany({
      where: {
        branchId,
        businessDate: { gte: dateKeyToUtcDate(historyFrom), lte: dateKeyToUtcDate(evaluationEnd) },
      },
      select: { productId: true, businessDate: true, totalDemandQty: true },
    });
    const productIds = [...new Set(rows.map((row) => row.productId))];
    const productDetails = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productNames = new Map(productDetails.map((product) => [product.id, product.name]));
    const actualMap = new Map(rows.map((row) => [`${row.productId}:${row.businessDate.toISOString().slice(0, 10)}`, row.totalDemandQty]));
    const actual: number[] = [];
    const predicted: number[] = [];
    const productMetrics = productIds.map((productId) => {
      const observations = historyDates.map((date) => ({ date, quantity: actualMap.get(`${productId}:${date}`) ?? 0 }));
      const productActual: number[] = [];
      const productPredicted: number[] = [];
      for (const date of evaluationDates) {
        const priorHistory = observations.filter((observation) => observation.date < date);
        const calculation = calculateDemandForecast(priorHistory, date);
        const actualValue = actualMap.get(`${productId}:${date}`) ?? 0;
        productActual.push(actualValue);
        productPredicted.push(calculation.predictedQty);
        actual.push(actualValue);
        predicted.push(calculation.predictedQty);
      }
      const mae = productActual.length > 0
        ? productActual.reduce((sum, value, index) => sum + Math.abs(value - productPredicted[index]), 0) / productActual.length
        : 0;
      return {
        productId,
        productName: productNames.get(productId) ?? 'Producto',
        observations: productActual.length,
        mae,
        wape: calculateWape(productActual, productPredicted),
      };
    });

    return {
      branchId,
      branchName,
      modelVersion: MODEL_VERSION,
      evaluation: { from: evaluationStart, to: evaluationEnd, days: evaluationDays },
      metrics: {
        observations: actual.length,
        mae: actual.length > 0 ? actual.reduce((sum, value, index) => sum + Math.abs(value - predicted[index]), 0) / actual.length : 0,
        wape: calculateWape(actual, predicted),
      },
      products: productMetrics,
    };
  }

  private calculateRawMaterialRisk(
    product: any,
    recommendedTrays: number | null,
    rawInventoryMap: Map<number, any>,
  ) {
    if (!recommendedTrays || recommendedTrays <= 0) return undefined;
    const recipe = product.recipes?.[0];
    if (!recipe) return { status: 'NO_RECIPE', materials: [] };

    const batches = Math.max(1, Math.ceil(recommendedTrays / Math.max(1, recipe.standardTrays)));
    const materials = recipe.ingredients.map((ingredient: any) => {
      const required = Number(ingredient.quantity) * batches;
      const available = Number(rawInventoryMap.get(ingredient.rawMaterialId)?.quantity ?? 0);
      return {
        rawMaterialId: ingredient.rawMaterialId,
        name: ingredient.rawMaterial.name,
        unit: ingredient.rawMaterial.baseUnit,
        required,
        available,
        shortage: Math.max(0, required - available),
      };
    });
    return {
      status: materials.some((material: any) => material.shortage > 0) ? 'RISK' : 'OK',
      batches,
      materials,
    };
  }
}
