import { BadRequestException, Injectable } from '@nestjs/common';
import { AlertType, InventoryLotSource, Prisma } from '@prisma/client';
import {
  addDays,
  dateKeyToUtcDate,
  parseDateOnly,
  todayBusinessDate,
} from '../common/time/business-date.js';

type Transaction = Prisma.TransactionClient;

type LotDateValue = string | Date | undefined;

type CreateInboundLotOptions = {
  productId: number;
  branchId: number;
  quantity: number;
  sourceType: InventoryLotSource;
  sourceMovementId?: number;
  expiresAt?: LotDateValue;
  alertAt?: LotDateValue;
};

@Injectable()
export class InventoryLotsService {
  /**
   * Creates the lot associated with an inbound movement. The aggregate Inventory
   * row is intentionally updated by the caller so both representations remain
   * inside the same transaction.
   */
  async createInboundLot(tx: Transaction, options: CreateInboundLotOptions) {
    if (!Number.isInteger(options.quantity) || options.quantity <= 0) {
      throw new BadRequestException('La cantidad del lote debe ser mayor a 0');
    }

    const product = await tx.product.findUnique({
      where: { id: options.productId },
      select: { tracksExpiration: true, expirationAlertDays: true },
    });
    if (!product) throw new BadRequestException('Producto no encontrado');

    // La caducidad aplica únicamente a productos comprados (jugos, galletas,
    // etc.). Los panes producidos siguen usando el flujo de producción actual.
    const requiresExpiration = product.tracksExpiration && options.sourceType === InventoryLotSource.COMPRA;

    let expiresAt: Date | undefined;
    let alertAt: Date | undefined;
    if (requiresExpiration) {
      if (!options.expiresAt) {
        throw new BadRequestException(
          `El producto requiere fecha de caducidad. Configúrala antes de registrar la entrada.`,
        );
      }
      expiresAt = this.normalizeDate(options.expiresAt, 'La fecha de caducidad no es válida');
      alertAt = options.alertAt
        ? this.normalizeDate(options.alertAt, 'La fecha de alerta no es válida')
        : dateKeyToUtcDate(addDays(expiresAt.toISOString().slice(0, 10), -Math.max(0, product.expirationAlertDays)));

      if (alertAt.getTime() > expiresAt.getTime()) {
        throw new BadRequestException('La fecha de alerta no puede ser posterior a la fecha de caducidad');
      }
    }

    return tx.inventoryLot.create({
      data: {
        productId: options.productId,
        branchId: options.branchId,
        sourceType: options.sourceType,
        sourceMovementId: options.sourceMovementId,
        initialQuantity: options.quantity,
        availableQuantity: options.quantity,
        expiresAt,
        alertAt,
      },
    });
  }

  /**
   * Consumes product lots in FEFO order and records the allocation for audit.
   * Products with expiration tracking never consume an expired lot implicitly.
   */
  async consumeLots(
    tx: Transaction,
    options: {
      productId: number;
      branchId: number;
      quantity: number;
      stockMovementId: number;
      allowExpired?: boolean;
    },
  ) {
    if (options.quantity <= 0) return [];

    const product = await tx.product.findUnique({
      where: { id: options.productId },
      select: { tracksExpiration: true },
    });
    if (!product) throw new BadRequestException('Producto no encontrado');

    const where: Prisma.InventoryLotWhereInput = {
      productId: options.productId,
      branchId: options.branchId,
      availableQuantity: { gt: 0 },
    };

    const lots = product.tracksExpiration
      ? options.allowExpired
        ? await tx.inventoryLot.findMany({
            where,
            orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }],
          })
        : [
            ...(await tx.inventoryLot.findMany({
              where: { ...where, expiresAt: { gte: dateKeyToUtcDate(todayBusinessDate()) } },
              orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }],
            })),
            ...(await tx.inventoryLot.findMany({
              where: { ...where, expiresAt: null },
              orderBy: { createdAt: 'asc' },
            })),
          ]
      : await tx.inventoryLot.findMany({
          where,
          orderBy: [{ createdAt: 'asc' }],
        });

    const representedQuantity = lots.reduce((sum, lot) => sum + lot.availableQuantity, 0);
    if (product.tracksExpiration && representedQuantity < options.quantity) {
      throw new BadRequestException(
        'No hay suficientes unidades vigentes. Revisa los productos vencidos o registra una entrada con fecha.',
      );
    }

    // For products without lot history we preserve the legacy aggregate behavior.
    if (lots.length === 0 && !product.tracksExpiration) return [];

    let remaining = options.quantity;
    const allocations: Array<{ lotId: number; quantity: number }> = [];
    for (const lot of lots) {
      if (remaining <= 0) break;
      const quantity = Math.min(remaining, lot.availableQuantity);
      if (quantity <= 0) continue;

      await tx.inventoryLot.update({
        where: { id: lot.id },
        data: { availableQuantity: { decrement: quantity } },
      });
      if (lot.availableQuantity - quantity === 0) {
        await tx.alertState.updateMany({
          where: {
            branchId: options.branchId,
            alertType: AlertType.PRODUCT_EXPIRY,
            resourceKey: { startsWith: `lot:${lot.id}:` },
            active: true,
          },
          data: { active: false, resolvedAt: new Date() },
        });
      }
      await tx.inventoryLotConsumption.create({
        data: {
          lotId: lot.id,
          stockMovementId: options.stockMovementId,
          quantity,
        },
      });
      allocations.push({ lotId: lot.id, quantity });
      remaining -= quantity;
    }

    if (remaining > 0) {
      if (product.tracksExpiration) {
        throw new BadRequestException('El inventario por lote no coincide con el inventario general');
      }
      return allocations;
    }
    return allocations;
  }

  /**
   * Returns the quantity that can still be sold. For products without
   * expiration tracking, null delegates availability to the aggregate Inventory
   * row used by the legacy flow.
   */
  async getSellableQuantity(tx: Transaction, productId: number, branchId: number): Promise<number | null> {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { tracksExpiration: true },
    });
    if (!product || !product.tracksExpiration) return null;

    const today = dateKeyToUtcDate(todayBusinessDate());
    const lots = await tx.inventoryLot.findMany({
      where: {
        productId,
        branchId,
        availableQuantity: { gt: 0 },
        OR: [{ expiresAt: { gte: today } }, { expiresAt: null }],
      },
      select: { availableQuantity: true },
    });
    return lots.reduce((sum, lot) => sum + lot.availableQuantity, 0);
  }

  /**
   * Moves stock between branches while preserving every lot's expiration date.
   */
  async transferLots(
    tx: Transaction,
    options: {
      productId: number;
      fromBranchId: number;
      toBranchId: number;
      quantity: number;
      stockMovementId: number;
    },
  ) {
    const product = await tx.product.findUnique({
      where: { id: options.productId },
      select: { tracksExpiration: true },
    });
    if (!product || !product.tracksExpiration) return [];

    const lots = await tx.inventoryLot.findMany({
      where: {
        productId: options.productId,
        branchId: options.fromBranchId,
        availableQuantity: { gt: 0 },
        OR: [
          { expiresAt: { gte: dateKeyToUtcDate(todayBusinessDate()) } },
          { expiresAt: null },
        ],
      },
      orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }],
    });

    const total = lots.reduce((sum, lot) => sum + lot.availableQuantity, 0);
    if (total < options.quantity) {
      throw new BadRequestException('No hay suficientes unidades vigentes para transferir');
    }

    let remaining = options.quantity;
    const transfers: Array<{ lotId: number; quantity: number }> = [];
    for (const lot of lots) {
      if (remaining <= 0) break;
      const quantity = Math.min(remaining, lot.availableQuantity);
      await tx.inventoryLot.update({
        where: { id: lot.id },
        data: { availableQuantity: { decrement: quantity } },
      });
      await tx.inventoryLotConsumption.create({
        data: { lotId: lot.id, stockMovementId: options.stockMovementId, quantity },
      });
      await tx.inventoryLot.create({
        data: {
          productId: options.productId,
          branchId: options.toBranchId,
          sourceType: InventoryLotSource.TRANSFERENCIA,
          sourceMovementId: options.stockMovementId,
          initialQuantity: quantity,
          availableQuantity: quantity,
          expiresAt: lot.expiresAt,
          alertAt: lot.alertAt,
        },
      });
      transfers.push({ lotId: lot.id, quantity });
      remaining -= quantity;
    }
    return transfers;
  }

  private normalizeDate(value: LotDateValue, message: string): Date {
    try {
      if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) throw new Error(message);
        return dateKeyToUtcDate(value.toISOString().slice(0, 10));
      }
      if (!value) throw new Error(message);
      return parseDateOnly(value.slice(0, 10));
    } catch {
      throw new BadRequestException(message);
    }
  }
}
