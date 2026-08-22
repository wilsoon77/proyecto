import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductOrigin } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { addDays, dateKeyToUtcDate, todayBusinessDate } from '../common/time/business-date.js';
import {
  getDefaultExpirationAlertDate,
  isCustomExpirationAlert,
  normalizeExpirationAlertDays,
} from './expiration-alerts.js';

type LotAvailability = {
  sellable: number;
  expired: number;
  hasHistory: boolean;
};

function mapInventoryProduct(product: any, available = 0) {
  const mapped = {
    id: product.id,
    name: product.name,
    slug: product.slug,
  };

  // Mantener la forma histórica cuando el servicio recibe objetos parciales
  // (por ejemplo, mocks o integraciones antiguas). Las consultas reales de
  // inventario siempre incluyen estos campos nuevos.
  if (Object.prototype.hasOwnProperty.call(product, 'stockUnitLabel')) {
    (mapped as any).stockUnitLabel = product.stockUnitLabel ?? 'unidades';
  }
  if (Object.prototype.hasOwnProperty.call(product, 'presentations')) {
    (mapped as any).presentations = (product.presentations ?? []).map((presentation: any) => ({
      id: presentation.id,
      name: presentation.name,
      unitsInStock: presentation.unitsInStock,
      price: presentation.price === null || presentation.price === undefined ? null : Number(presentation.price),
      isForSale: presentation.isForSale,
      isForProduction: presentation.isForProduction,
      isDefault: presentation.isDefault,
      isActive: presentation.isActive,
      sortOrder: presentation.sortOrder,
      available: Math.max(0, Math.floor(available / presentation.unitsInStock)),
    }));
  }

  return mapped;
}

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
   * Inventory.quantity is the physical aggregate and intentionally keeps
   * expired units until an explicit MERMA. The sellable view must instead use
   * current lots for products bought with expiration tracking.
   */
  private async getLotAvailability(inventories: Array<{ productId: number; branchId: number }>) {
    const productIds = [...new Set(inventories.map((inventory) => inventory.productId))];
    const branchIds = [...new Set(inventories.map((inventory) => inventory.branchId))];
    const availability = new Map<string, LotAvailability>();

    if (productIds.length === 0 || branchIds.length === 0) return availability;

    const today = dateKeyToUtcDate(todayBusinessDate());
    const lots = await this.prisma.inventoryLot.findMany({
      where: {
        productId: { in: productIds },
        branchId: { in: branchIds },
      },
      select: { productId: true, branchId: true, availableQuantity: true, expiresAt: true },
    });

    for (const lot of lots) {
      const key = `${lot.productId}:${lot.branchId}`;
      const current = availability.get(key) ?? { sellable: 0, expired: 0, hasHistory: false };
      current.hasHistory = true;
      if (lot.availableQuantity > 0) {
        if (lot.expiresAt && lot.expiresAt < today) current.expired += lot.availableQuantity;
        else current.sellable += lot.availableQuantity;
      }
      availability.set(key, current);
    }

    return availability;
  }

  private mapAvailability(
    inventory: { productId: number; branchId: number; quantity: number; reserved: number; product: any },
    lotAvailability: Map<string, LotAvailability>,
  ) {
    const tracksExpiration = inventory.product.origin === 'COMPRADO' && inventory.product.tracksExpiration;
    const lots = lotAvailability.get(`${inventory.productId}:${inventory.branchId}`);
    const sellableBeforeReservations = tracksExpiration
      ? (lots?.hasHistory ? lots.sellable : 0)
      : inventory.quantity;

    return {
      available: Math.max(0, sellableBeforeReservations - inventory.reserved),
      expiredQuantity: tracksExpiration && lots?.hasHistory ? lots.expired : 0,
    };
  }

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
      include: {
        product: { include: { presentations: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } } },
        branch: true,
      },
    });

    const lotAvailability = await this.getLotAvailability(inventories);

    return inventories.map(i => {
      const stock = this.mapAvailability(i, lotAvailability);
      return {
        product: mapInventoryProduct(i.product, stock.available),
        branch: { id: i.branch.id, name: i.branch.name, slug: i.branch.slug },
        quantity: i.quantity,
        reserved: i.reserved,
        available: stock.available,
        expiredQuantity: stock.expiredQuantity,
        updatedAt: i.updatedAt,
      };
    });
  }

  /**
   * Obtener inventario de un producto específico en una sucursal.
   */
  async getByProductAndBranch(productId: number, branchId: number) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { productId_branchId: { productId, branchId } },
      include: {
        product: { include: { presentations: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } } },
        branch: true,
      },
    });

    if (!inventory) {
      throw new NotFoundException(
        `No se encontró inventario para producto ${productId} en sucursal ${branchId}`,
      );
    }

    const lotAvailability = await this.getLotAvailability([inventory]);
    const stock = this.mapAvailability(inventory, lotAvailability);

    return {
      product: mapInventoryProduct(inventory.product, stock.available),
      branch: { id: inventory.branch.id, name: inventory.branch.name, slug: inventory.branch.slug },
      quantity: inventory.quantity,
      reserved: inventory.reserved,
      available: stock.available,
      expiredQuantity: stock.expiredQuantity,
      updatedAt: inventory.updatedAt,
    };
  }

  /**
   * Obtener productos con stock bajo (quantity - reserved <= minThreshold).
   * Útil para consultas operativas de stock.
   */
  async getLowStock(branchId?: number, threshold: number = 10) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    const inventories = await this.prisma.inventory.findMany({
      where,
      include: {
        product: { include: { presentations: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } } },
        branch: true,
      },
    });

    const lotAvailability = await this.getLotAvailability(inventories);

    return inventories
      .map((inventory) => ({ inventory, stock: this.mapAvailability(inventory, lotAvailability) }))
      .filter(({ stock }) => stock.available <= threshold)
      .map(({ inventory: i, stock }) => ({
        product: mapInventoryProduct(i.product, stock.available),
        branch: { id: i.branch.id, name: i.branch.name, slug: i.branch.slug },
        quantity: i.quantity,
        reserved: i.reserved,
        available: stock.available,
        expiredQuantity: stock.expiredQuantity,
        updatedAt: i.updatedAt,
      }));
  }

  /**
   * Obtener lote por ID con relaciones
   */
  async getLotById(id: number) {
    return this.prisma.inventoryLot.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, slug: true, origin: true, tracksExpiration: true, expirationAlertDays: true } },
        branch: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Modificar la alerta o fecha de caducidad de un lote específico
   */
  async updateLotAlert(
    lotId: number,
    dto: { alertAt?: string | null; daysBefore?: number; expiresAt?: string },
  ) {
    const lot = await this.prisma.inventoryLot.findUnique({
      where: { id: lotId },
      include: { product: true },
    });
    if (!lot) throw new NotFoundException('Lote no encontrado');

    if (lot.product.origin !== ProductOrigin.COMPRADO || !lot.product.tracksExpiration) {
      throw new BadRequestException('La alerta de caducidad solo aplica a productos COMPRADOS con control por lote');
    }

    if (dto.alertAt === undefined && dto.daysBefore === undefined && dto.expiresAt === undefined) {
      throw new BadRequestException('Debes indicar una alerta o una fecha de caducidad para actualizar el lote');
    }

    const parseDate = (value: string, label: string) => {
      try {
        return dateKeyToUtcDate(value);
      } catch {
        throw new BadRequestException(`${label} debe usar el formato YYYY-MM-DD y ser una fecha válida`);
      }
    };

    const reminderDays = normalizeExpirationAlertDays(lot.product.expirationAlertDays);
    const currentIsCustomAlert = isCustomExpirationAlert(lot.expiresAt, lot.alertAt, reminderDays);
    const updateData: { alertAt?: Date | null; expiresAt?: Date } = {};

    if (dto.expiresAt !== undefined) {
      updateData.expiresAt = parseDate(dto.expiresAt, 'La fecha de caducidad');
    }

    const effectiveExpiresAt = updateData.expiresAt ?? lot.expiresAt;
    if (!effectiveExpiresAt) {
      throw new BadRequestException('El lote necesita una fecha de caducidad antes de configurar la alerta');
    }

    if (dto.daysBefore !== undefined) {
      if (!Number.isInteger(dto.daysBefore) || dto.daysBefore < 0 || dto.daysBefore > 90) {
        throw new BadRequestException('Los días de anticipación deben ser un entero entre 0 y 90');
      }
      const expiresKey = effectiveExpiresAt.toISOString().slice(0, 10);
      updateData.alertAt = dateKeyToUtcDate(addDays(expiresKey, -dto.daysBefore));
    } else if (dto.alertAt !== undefined) {
      updateData.alertAt = dto.alertAt === null
        ? null
        : parseDate(dto.alertAt, 'La fecha de alerta');
    } else if (dto.expiresAt !== undefined) {
      // Al corregir solo el vencimiento, conserva una fecha personalizada;
      // de lo contrario, recalcula la referencia con la configuración vigente.
      updateData.alertAt = currentIsCustomAlert && lot.alertAt
        ? lot.alertAt
        : dateKeyToUtcDate(getDefaultExpirationAlertDate(effectiveExpiresAt, reminderDays)!);
    }

    if (updateData.alertAt && updateData.alertAt.getTime() > effectiveExpiresAt.getTime()) {
      throw new BadRequestException('La fecha de alerta no puede ser posterior a la fecha de caducidad');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedLot = await tx.inventoryLot.update({
        where: { id: lotId },
        data: updateData,
        include: {
          product: { select: { id: true, name: true, slug: true, origin: true, tracksExpiration: true, expirationAlertDays: true } },
          branch: { select: { id: true, name: true, slug: true } },
        },
      });

      // Resetear estados de alertas previos para que la nueva fecha dispare notificación oportunamente.
      await tx.alertState.deleteMany({
        where: {
          branchId: updatedLot.branchId,
          alertType: 'PRODUCT_EXPIRY',
          resourceKey: { startsWith: `lot:${lotId}:` },
        },
      });

      return updatedLot;
    });

    const todayKey = todayBusinessDate();
    const today = dateKeyToUtcDate(todayKey);
    const expiresAt = updated.expiresAt?.toISOString().slice(0, 10) ?? null;
    const daysLeft = expiresAt
      ? Math.round((dateKeyToUtcDate(expiresAt).getTime() - today.getTime()) / 86_400_000)
      : null;
    const updatedReminderDays = normalizeExpirationAlertDays(updated.product.expirationAlertDays);
    const isCustomAlert = isCustomExpirationAlert(updated.expiresAt, updated.alertAt, updatedReminderDays);
    const defaultDaysBefore = updatedReminderDays[0];
    const effectiveAlertDate = isCustomAlert && updated.alertAt
      ? updated.alertAt.toISOString().slice(0, 10)
      : expiresAt
        ? getDefaultExpirationAlertDate(expiresAt, updatedReminderDays)
        : null;

    const daysUntilAlert = effectiveAlertDate
      ? Math.round((dateKeyToUtcDate(effectiveAlertDate).getTime() - today.getTime()) / 86_400_000)
      : null;

    return {
      id: updated.id,
      product: updated.product,
      branch: updated.branch,
      sourceType: updated.sourceType,
      initialQuantity: updated.initialQuantity,
      availableQuantity: updated.availableQuantity,
      expiresAt,
      alertAt: updated.alertAt?.toISOString().slice(0, 10) ?? null,
      reminderDays: updatedReminderDays,
      isCustomAlert,
      defaultDaysBefore,
      effectiveAlertDate,
      daysUntilAlert,
      lastNotifiedAt: null,
      daysLeft,
      status: expiresAt === null ? 'NO_DATE' : daysLeft !== null && daysLeft < 0 ? 'EXPIRED' : 'EXPIRING_SOON',
    };
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
      product: { origin: 'COMPRADO', tracksExpiration: true },
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
        product: { select: { id: true, name: true, slug: true, origin: true, expirationAlertDays: true } },
        branch: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }],
    });

    const lotIds = lots.map((l) => l.id);
    const alertResourceKeys = lots.flatMap((lot) => {
      const reminderDays = normalizeExpirationAlertDays(lot.product.expirationAlertDays);
      const keys = reminderDays.map((daysBefore) => `lot:${lot.id}:warning:${daysBefore}`);
      if (isCustomExpirationAlert(lot.expiresAt, lot.alertAt, reminderDays)) {
        keys.push(`lot:${lot.id}:custom`);
      }
      return keys;
    });
    const alertStates = lotIds.length > 0
      ? await this.prisma.alertState.findMany({
          where: {
            alertType: 'PRODUCT_EXPIRY',
            resourceKey: { in: alertResourceKeys },
          },
          select: { resourceKey: true, lastNotifiedAt: true, active: true },
        })
      : [];

    const alertStateMap = new Map<number, string>();
    for (const state of alertStates) {
      const match = state.resourceKey.match(/^lot:(\d+):/);
      if (match && match[1]) {
        const id = Number(match[1]);
        if (state.lastNotifiedAt) {
          const current = alertStateMap.get(id);
          const candidate = state.lastNotifiedAt.toISOString();
          if (!current || candidate > current) alertStateMap.set(id, candidate);
        }
      }
    }

    const data = lots.map((lot) => {
      const expiresAt = lot.expiresAt?.toISOString().slice(0, 10) ?? null;
      const daysLeft = expiresAt
        ? Math.round((dateKeyToUtcDate(expiresAt).getTime() - today.getTime()) / 86_400_000)
        : null;

      const reminderDays = normalizeExpirationAlertDays(lot.product.expirationAlertDays);
      const isCustomAlert = isCustomExpirationAlert(lot.expiresAt, lot.alertAt, reminderDays);
      const defaultDaysBefore = reminderDays[0];
      const effectiveAlertDate = isCustomAlert && lot.alertAt
        ? lot.alertAt.toISOString().slice(0, 10)
        : expiresAt
          ? getDefaultExpirationAlertDate(expiresAt, reminderDays)
          : null;

      const daysUntilAlert = effectiveAlertDate
        ? Math.round((dateKeyToUtcDate(effectiveAlertDate).getTime() - today.getTime()) / 86_400_000)
        : null;

      const lastNotifiedAt = alertStateMap.get(lot.id) ?? null;

      return {
        id: lot.id,
        product: lot.product,
        branch: lot.branch,
        sourceType: lot.sourceType,
        initialQuantity: lot.initialQuantity,
        availableQuantity: lot.availableQuantity,
        expiresAt,
        alertAt: lot.alertAt?.toISOString().slice(0, 10) ?? null,
        reminderDays,
        isCustomAlert,
        defaultDaysBefore,
        effectiveAlertDate,
        daysUntilAlert,
        lastNotifiedAt,
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
