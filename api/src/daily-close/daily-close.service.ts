import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InventoryLotSource, Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDailyCloseDto } from './dto/create-daily-close.dto.js';
import { InventoryLotsService } from '../inventory/inventory-lots.service.js';
import { calculateBaseQuantity } from '../products/presentation.helpers.js';

const BUSINESS_TIMEZONE = process.env.STORE_TIMEZONE || 'America/Guatemala';
const DEFAULT_MAX_RETRO_DAYS = 3;

type DailyCloseSummary = {
  totalSold: number;
  totalWaste: number;
  totalSurplus: number;
  productsClosed: number;
};

function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('La fecha debe tener el formato YYYY-MM-DD');
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new BadRequestException('La fecha indicada no es válida');
  }

  return parsed;
}

function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function businessDateKey(value = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);

  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function getTimeZoneOffsetMs(value: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(value);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const hour = get('hour') === 24 ? 0 : get('hour');
  const representedAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
  return representedAsUtc - value.getTime();
}

function zonedMidnightToUtc(dateOnly: Date): Date {
  const year = dateOnly.getUTCFullYear();
  const month = dateOnly.getUTCMonth();
  const day = dateOnly.getUTCDate();
  const guess = new Date(Date.UTC(year, month, day));
  return new Date(guess.getTime() - getTimeZoneOffsetMs(guess));
}

function summarize(items: Array<{ soldQty: number; wasteQty: number; surplusQty: number }>): DailyCloseSummary {
  return {
    totalSold: items.reduce((sum, item) => sum + item.soldQty, 0),
    totalWaste: items.reduce((sum, item) => sum + item.wasteQty, 0),
    totalSurplus: items.reduce((sum, item) => sum + item.surplusQty, 0),
    productsClosed: items.length,
  };
}

@Injectable()
export class DailyCloseService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly inventoryLotsService?: InventoryLotsService,
  ) {}

  async preview(branchId: number, closeDate?: string) {
    const dateKey = closeDate || businessDateKey();
    const parsedCloseDate = this.validateCloseDate(dateKey);

    const existing = await this.prisma.dailyClose.findUnique({
      where: { branchId_closeDate: { branchId, closeDate: parsedCloseDate } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Ya existe un cierre para esta sucursal y fecha');
    }

    const products = await this.prisma.product.findMany({
      where: { inventories: { some: { branchId } } },
      select: {
        id: true,
        sku: true,
        name: true,
        isActive: true,
        stockUnitLabel: true,
        presentations: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        },
        inventories: {
          where: { branchId },
          select: { quantity: true, reserved: true, updatedAt: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const snapshotAt = new Date();
    return {
      branchId,
      closeDate: dateKey,
      snapshotAt: snapshotAt.toISOString(),
      items: products.map((product) => {
        const inventory = product.inventories[0];
        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          isActive: product.isActive,
          systemQty: inventory?.quantity ?? 0,
          reservedQty: inventory?.reserved ?? 0,
          countedQty: inventory?.quantity ?? 0,
          wasteQty: 0,
          stockUnitLabel: product.stockUnitLabel,
          presentations: product.presentations.map((presentation) => ({
            id: presentation.id,
            name: presentation.name,
            unitsInStock: presentation.unitsInStock,
            price: presentation.price === null ? null : Number(presentation.price),
            isForSale: presentation.isForSale,
            isForProduction: presentation.isForProduction,
            isDefault: presentation.isDefault,
            isActive: presentation.isActive,
            sortOrder: presentation.sortOrder,
          })),
          inventoryUpdatedAt: inventory?.updatedAt?.toISOString() ?? null,
        };
      }),
    };
  }

  async create(dto: CreateDailyCloseDto, branchId: number, userId: string) {
    const closeDate = this.validateCloseDate(dto.closeDate);
    const productIds = dto.items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      throw new BadRequestException('No se puede repetir un producto dentro del cierre');
    }
    const snapshotAt = new Date(dto.snapshotAt);
    if (Number.isNaN(snapshotAt.getTime())) {
      throw new BadRequestException('snapshotAt no es una fecha válida');
    }
    if (snapshotAt.getTime() > Date.now() + 60_000) {
      throw new BadRequestException('snapshotAt no puede estar en el futuro');
    }

    const laterInventoryChange = await this.findLaterInventoryChange(branchId, closeDate);
    if (laterInventoryChange) {
      throw new ConflictException(
        'No se puede cerrar esta fecha porque el inventario cambió después de esa jornada',
      );
    }

    try {
      const created = await this.executeWithRetry(() =>
        this.prisma.$transaction(async (tx) => {
          const duplicate = await tx.dailyClose.findUnique({
            where: { branchId_closeDate: { branchId, closeDate } },
            select: { id: true },
          });
          if (duplicate) {
            throw new ConflictException('Ya existe un cierre para esta sucursal y fecha');
          }

          const products = await tx.product.findMany({
            where: { id: { in: productIds } },
            select: {
              id: true,
              name: true,
              presentations: {
                where: { isActive: true },
                orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
              },
            },
          });
          const productMap = new Map(products.map((product) => [product.id, product]));
          const missingProduct = productIds.find((productId) => !productMap.has(productId));
          if (missingProduct) {
            throw new BadRequestException(`Producto no encontrado: ${missingProduct}`);
          }

          const inventories = await tx.inventory.findMany({
            where: { branchId, productId: { in: productIds } },
          });
          const inventoryMap = new Map(inventories.map((inventory) => [inventory.productId, inventory]));

          for (const inventory of inventories) {
            if (inventory.updatedAt > snapshotAt && closeDate.getTime() === parseDateOnly(businessDateKey()).getTime()) {
              throw new ConflictException(
                'El inventario cambió después del snapshot. Vuelve a cargar la vista previa.',
              );
            }
          }

          const close = await tx.dailyClose.create({
            data: {
              branchId,
              userId,
              closeDate,
              snapshotAt,
              note: dto.note,
            },
          });

          const referenceId = `CIERRE-${dto.closeDate}-B${branchId}`;
          const itemResults: Array<{
            productId: number;
            productName: string;
            systemQty: number;
            reservedQty: number;
            countedQty: number;
            wasteQty: number;
            soldQty: number;
            surplusQty: number;
          }> = [];

          for (const item of dto.items) {
            const inventory = inventoryMap.get(item.productId);
            const systemQty = inventory?.quantity ?? 0;
            const reservedQty = inventory?.reserved ?? 0;
            const product = productMap.get(item.productId)!;
            const countedQty = item.countedPresentations !== undefined
              ? calculateBaseQuantity(product.presentations, item.countedPresentations)
              : item.countedQty;
            const wasteQty = item.wastePresentations !== undefined
              ? calculateBaseQuantity(product.presentations, item.wastePresentations)
              : (item.wasteQty ?? 0);

            if (countedQty < reservedQty) {
              throw new BadRequestException(
                `El conteo de ${productMap.get(item.productId)!.name} no puede ser menor que las ${reservedQty} unidades reservadas`,
              );
            }
            if (wasteQty > systemQty) {
              throw new BadRequestException(
                `La merma de ${productMap.get(item.productId)!.name} no puede superar el inventario del sistema`,
              );
            }

            const afterWaste = systemQty - wasteQty;
            const soldQty = Math.max(afterWaste - countedQty, 0);
            const surplusQty = Math.max(countedQty - afterWaste, 0);
            const productName = product.name;

            if (inventory && inventory.updatedAt > snapshotAt && closeDate.getTime() === parseDateOnly(businessDateKey()).getTime()) {
              throw new ConflictException(
                'El inventario cambió después del snapshot. Vuelve a cargar la vista previa.',
              );
            }

            if (soldQty > 0) {
              const movement = await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  fromBranchId: branchId,
                  type: StockMovementType.VENTA,
                  quantity: soldQty,
                  userId,
                  dailyCloseId: close.id,
                  referenceId,
                  note: `Venta no registrada calculada en cierre ${dto.closeDate}`,
                },
              });
              if (this.inventoryLotsService) {
                await this.inventoryLotsService.consumeLots(tx, {
                  productId: item.productId,
                  branchId,
                  quantity: soldQty,
                  stockMovementId: movement.id,
                });
              }
            }
            if (wasteQty > 0) {
              const movement = await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  fromBranchId: branchId,
                  type: StockMovementType.MERMA,
                  quantity: wasteQty,
                  userId,
                  dailyCloseId: close.id,
                  referenceId,
                  note: `Merma declarada en cierre ${dto.closeDate}`,
                },
              });
              if (this.inventoryLotsService) {
                await this.inventoryLotsService.consumeLots(tx, {
                  productId: item.productId,
                  branchId,
                  quantity: wasteQty,
                  stockMovementId: movement.id,
                  allowExpired: true,
                });
              }
            }
            if (surplusQty > 0) {
              const movement = await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  toBranchId: branchId,
                  type: StockMovementType.SOBRANTE,
                  quantity: surplusQty,
                  userId,
                  dailyCloseId: close.id,
                  referenceId,
                  note: `Sobrante físico detectado en cierre ${dto.closeDate}`,
                },
              });
              if (this.inventoryLotsService) {
                await this.inventoryLotsService.createInboundLot(tx, {
                  productId: item.productId,
                  branchId,
                  quantity: surplusQty,
                  sourceType: InventoryLotSource.SOBRANTE,
                  sourceMovementId: movement.id,
                });
              }
            }

            if (inventory) {
              await tx.inventory.update({
                where: { id: inventory.id },
                data: { quantity: countedQty },
              });
            } else if (countedQty > 0) {
              await tx.inventory.create({
                data: { productId: item.productId, branchId, quantity: countedQty },
              });
            }

            await tx.dailyCloseItem.create({
              data: {
                dailyCloseId: close.id,
                productId: item.productId,
                productName,
                systemQty,
                reservedQty,
                countedQty,
                wasteQty,
                soldQty,
                surplusQty,
              },
            });

            itemResults.push({
              productId: item.productId,
              productName,
              systemQty,
              reservedQty,
              countedQty,
              wasteQty,
              soldQty,
              surplusQty,
            });
          }

          return { id: close.id, closeDate: dto.closeDate, branchId, userId, items: itemResults };
        }, {
          timeout: 10000,
          maxWait: 5000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }),
      );

      const summary = summarize(created.items);
      return {
        ...created,
        summary,
        items: created.items,
      };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Ya existe un cierre para esta sucursal y fecha');
      }
      throw error;
    }
  }

  async list(options: {
    branchId?: number;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, options.pageSize ?? 20));
    const where: Prisma.DailyCloseWhereInput = {};

    if (options.branchId) where.branchId = options.branchId;
    if (options.from || options.to) {
      where.closeDate = {};
      if (options.from) (where.closeDate as Prisma.DateTimeFilter).gte = parseDateOnly(options.from);
      if (options.to) (where.closeDate as Prisma.DateTimeFilter).lte = parseDateOnly(options.to);
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.dailyClose.count({ where }),
      this.prisma.dailyClose.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: { select: { soldQty: true, wasteQty: true, surplusQty: true } },
        },
        orderBy: [{ closeDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: data.map((close) => ({
        id: close.id,
        closeDate: formatDateOnly(close.closeDate),
        branch: close.branch,
        user: close.user,
        note: close.note,
        createdAt: close.createdAt,
        summary: summarize(close.items),
      })),
      meta: { total, pageCount: Math.ceil(total / pageSize) || 0, page, pageSize },
    };
  }

  async getDetail(id: number) {
    const close = await this.prisma.dailyClose.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: { orderBy: { productName: 'asc' } },
        stockMovements: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            fromBranch: { select: { id: true, name: true, slug: true } },
            toBranch: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!close) throw new NotFoundException('Cierre diario no encontrado');

    return {
      ...close,
      closeDate: formatDateOnly(close.closeDate),
      summary: summarize(close.items),
    };
  }

  private validateCloseDate(value: string): Date {
    const parsed = parseDateOnly(value);
    const today = parseDateOnly(businessDateKey());
    const differenceInDays = Math.round((today.getTime() - parsed.getTime()) / 86_400_000);
    const configuredMaxRetroDays = Number(process.env.DAILY_CLOSE_MAX_RETRO_DAYS);
    const maxRetroDays = Number.isInteger(configuredMaxRetroDays) && configuredMaxRetroDays >= 0
      ? configuredMaxRetroDays
      : DEFAULT_MAX_RETRO_DAYS;

    if (differenceInDays < 0) {
      throw new BadRequestException('No se puede cerrar una fecha futura');
    }
    if (differenceInDays > maxRetroDays) {
      throw new BadRequestException(`El cierre no puede registrar fechas con más de ${maxRetroDays} días de atraso`);
    }

    return parsed;
  }

  private async findLaterInventoryChange(branchId: number, closeDate: Date) {
    const nextBusinessDay = new Date(
      zonedMidnightToUtc(new Date(Date.UTC(closeDate.getUTCFullYear(), closeDate.getUTCMonth(), closeDate.getUTCDate() + 1))),
    );

    return this.prisma.inventory.findFirst({
      where: { branchId, updatedAt: { gt: nextBusinessDay } },
      select: { id: true },
    });
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        if (error?.code === 'P2034' && attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
          continue;
        }
        throw error;
      }
    }

    throw new Error('No se pudo completar el cierre de forma consistente');
  }
}
