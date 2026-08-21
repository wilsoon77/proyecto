import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStockMovementDto, ReconcileInventoryDto, CreateBulkTransferDto } from './dto.js';
import { InventoryLotSource, Prisma, StockMovementType } from '@prisma/client';
import { LoggerService } from '../common/logger/logger.service.js';
import { InventoryLotsService } from '../inventory/inventory-lots.service.js';
import { addDays, businessDateStartUtc, dateKeysBetween, formatBusinessDate, todayBusinessDate } from '../common/time/business-date.js';
import { calculateBaseQuantity } from '../products/presentation.helpers.js';

@Injectable()
export class StockMovementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly inventoryLotsService: InventoryLotsService,
  ) {}

  private async assertSellableOutbound(
    tx: Prisma.TransactionClient,
    productId: number,
    branchId: number,
    quantity: number,
    productName: string,
  ) {
    const inventory = await tx.inventory.findUnique({
      where: { productId_branchId: { productId, branchId } },
    });
    const sellableLots = await this.inventoryLotsService.getSellableQuantity(tx, productId, branchId);
    const available = (sellableLots ?? inventory?.quantity ?? 0) - (inventory?.reserved ?? 0);
    if (available < quantity) {
      throw new BadRequestException(
        `No hay suficientes unidades vigentes de ${productName}. Disponible: ${Math.max(0, available)}, solicitado: ${quantity}. Registra como MERMA las unidades vencidas.`,
      );
    }
  }

  async create(dto: CreateStockMovementDto, userId?: string) {
    const product = await this.prisma.product.findUnique({ where: { slug: dto.productSlug } });
    if (!product) throw new BadRequestException('Producto no encontrado');

    const fromBranch = dto.fromBranchSlug
      ? await this.prisma.branch.findUnique({ where: { slug: dto.fromBranchSlug } })
      : null;
    const toBranch = dto.toBranchSlug
      ? await this.prisma.branch.findUnique({ where: { slug: dto.toBranchSlug } })
      : null;

    // Validaciones según tipo
    switch (dto.type) {
      case StockMovementType.PRODUCCION:
      case StockMovementType.COMPRA:
      case StockMovementType.SOBRANTE:
        if (!toBranch) throw new BadRequestException('toBranchSlug requerido');
        break;
      case StockMovementType.VENTA:
      case StockMovementType.MERMA:
      case StockMovementType.PERDIDA_ROBO:
        if (!fromBranch) throw new BadRequestException('fromBranchSlug requerido');
        break;
      case StockMovementType.TRANSFERENCIA:
        if (!fromBranch || !toBranch) throw new BadRequestException('fromBranchSlug y toBranchSlug requeridos');
        if (fromBranch.id === toBranch.id) throw new BadRequestException('Sucursales deben ser distintas');
        break;
    }

    const movement = await this.prisma.$transaction(async (tx) => {
      const adjust = async (branchId: number, delta: number) => {
        const existing = await tx.inventory.findUnique({
          where: { productId_branchId: { productId: product.id, branchId } },
        });
        if (!existing) {
          if (delta < 0) throw new BadRequestException('Inventario insuficiente');
          await tx.inventory.create({ data: { productId: product.id, branchId, quantity: delta } });
        } else {
          const newQuantity = existing.quantity + delta;
          if (newQuantity < existing.reserved) {
            throw new BadRequestException('Inventario disponible insuficiente; hay unidades reservadas');
          }
          await tx.inventory.update({ where: { id: existing.id }, data: { quantity: newQuantity } });
        }
      };

      // Aplicar reglas de signo
      switch (dto.type) {
        case StockMovementType.PRODUCCION:
        case StockMovementType.COMPRA:
        case StockMovementType.SOBRANTE:
          await adjust(toBranch!.id, dto.quantity);
          break;
        case StockMovementType.VENTA:
          await this.assertSellableOutbound(tx, product.id, fromBranch!.id, dto.quantity, product.name);
          await adjust(fromBranch!.id, -dto.quantity);
          break;
        case StockMovementType.MERMA:
        case StockMovementType.PERDIDA_ROBO:
          await adjust(fromBranch!.id, -dto.quantity);
          break;
        case StockMovementType.TRANSFERENCIA:
          await this.assertSellableOutbound(tx, product.id, fromBranch!.id, dto.quantity, product.name);
          await adjust(fromBranch!.id, -dto.quantity);
          await adjust(toBranch!.id, dto.quantity);
          break;
      }

      const movement = await tx.stockMovement.create({
        data: {
          productId: product.id,
          fromBranchId: fromBranch?.id,
          toBranchId: toBranch?.id,
          type: dto.type,
          quantity: dto.quantity,
          // La fecha solo pertenece a una entrada de COMPRA de un producto
          // comprado con control de caducidad. Nunca se registra para panes
          // PRODUCIDO, aunque un cliente envíe el campo manualmente.
          expiresAt: dto.type === StockMovementType.COMPRA && product.origin === 'COMPRADO' && product.tracksExpiration && dto.expiresAt
            ? new Date(dto.expiresAt)
            : undefined,
          userId: userId,
          referenceId: dto.referenceId,
          note: dto.note,
        },
      });

      if (dto.type === StockMovementType.TRANSFERENCIA) {
        await this.inventoryLotsService.transferLots(tx, {
          productId: product.id,
          fromBranchId: fromBranch!.id,
          toBranchId: toBranch!.id,
          quantity: dto.quantity,
          stockMovementId: movement.id,
        });
      } else if (
        dto.type === StockMovementType.PRODUCCION ||
        dto.type === StockMovementType.COMPRA ||
        dto.type === StockMovementType.SOBRANTE
      ) {
        const sourceType = dto.type === StockMovementType.PRODUCCION
          ? InventoryLotSource.PRODUCCION
          : dto.type === StockMovementType.COMPRA
            ? InventoryLotSource.COMPRA
            : InventoryLotSource.SOBRANTE;
        await this.inventoryLotsService.createInboundLot(tx, {
          productId: product.id,
          branchId: toBranch!.id,
          quantity: dto.quantity,
          sourceType,
          sourceMovementId: movement.id,
          expiresAt: dto.expiresAt,
          alertAt: dto.alertAt,
        });
      } else {
        await this.inventoryLotsService.consumeLots(tx, {
          productId: product.id,
          branchId: fromBranch!.id,
          quantity: dto.quantity,
          stockMovementId: movement.id,
          allowExpired: dto.type === StockMovementType.MERMA || dto.type === StockMovementType.PERDIDA_ROBO,
        });
      }

      // Auditoría
      this.logger.auditStockMovement(
        product.id,
        dto.type,
        dto.quantity,
        fromBranch?.id,
        toBranch?.id,
        userId
      );

      return movement;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    });

    // Las alertas automáticas se generan exclusivamente para materia prima baja y caducidad próxima.
    return movement;
  }

  async transferBulk(dto: CreateBulkTransferDto, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Debe incluir al menos un producto a transferir');
    }
    const fromBranch = await this.prisma.branch.findUnique({ where: { slug: dto.fromBranchSlug } });
    if (!fromBranch) throw new BadRequestException('Sucursal de origen no encontrada');
    const toBranch = await this.prisma.branch.findUnique({ where: { slug: dto.toBranchSlug } });
    if (!toBranch) throw new BadRequestException('Sucursal de destino no encontrada');

    if (fromBranch.id === toBranch.id) {
      throw new BadRequestException('Las sucursales de origen y destino deben ser distintas');
    }

    const slugs = dto.items.map((i) => i.productSlug);
    const products = await this.prisma.product.findMany({
      where: { slug: { in: slugs } },
    });
    const productMap = new Map(products.map((p) => [p.slug, p]));
    const missing = slugs.find((s) => !productMap.has(s));
    if (missing) {
      throw new BadRequestException(`Producto no encontrado: ${missing}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const results: Array<{ productId: number; productName: string; quantity: number; movementId: number }> = [];

      for (const item of dto.items) {
        const product = productMap.get(item.productSlug)!;
        const sourceInventory = await tx.inventory.findUnique({
          where: { productId_branchId: { productId: product.id, branchId: fromBranch.id } },
        });

        await this.assertSellableOutbound(tx, product.id, fromBranch.id, item.quantity, `${product.name} en ${fromBranch.name}`);

        // Descontar origen
        await tx.inventory.update({
          where: { id: sourceInventory!.id },
          data: { quantity: { decrement: item.quantity } },
        });

        // Aumentar o crear destino
        const targetInventory = await tx.inventory.findUnique({
          where: { productId_branchId: { productId: product.id, branchId: toBranch.id } },
        });
        if (!targetInventory) {
          await tx.inventory.create({
            data: { productId: product.id, branchId: toBranch.id, quantity: item.quantity },
          });
        } else {
          await tx.inventory.update({
            where: { id: targetInventory.id },
            data: { quantity: { increment: item.quantity } },
          });
        }

        // Crear registro de movimiento
        const movement = await tx.stockMovement.create({
          data: {
            productId: product.id,
            fromBranchId: fromBranch.id,
            toBranchId: toBranch.id,
            type: StockMovementType.TRANSFERENCIA,
            quantity: item.quantity,
            userId,
            referenceId: dto.referenceId,
            note: dto.note,
          },
        });

        // Transferir lotes FIFO
        await this.inventoryLotsService.transferLots(tx, {
          productId: product.id,
          fromBranchId: fromBranch.id,
          toBranchId: toBranch.id,
          quantity: item.quantity,
          stockMovementId: movement.id,
        });

        this.logger.auditStockMovement(
          product.id,
          StockMovementType.TRANSFERENCIA,
          item.quantity,
          fromBranch.id,
          toBranch.id,
          userId,
        );

        results.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          movementId: movement.id,
        });
      }

      return {
        fromBranch: fromBranch.name,
        toBranch: toBranch.name,
        transferredCount: results.length,
        items: results,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 15000,
    });
  }

  async list(filters: { productSlug?: string; branchSlug?: string; type?: string; from?: string; to?: string; page?: number; pageSize?: number }) {
    const where: any = {};
    if (filters.type) where.type = filters.type as StockMovementType;
    if (filters.productSlug) {
      const product = await this.prisma.product.findUnique({ where: { slug: filters.productSlug } });
      if (!product) return { data: [], meta: { total: 0, pageCount: 0, page: 1, pageSize: 10 } };
      where.productId = product.id;
    }
    if (filters.branchSlug) {
      const branch = await this.prisma.branch.findUnique({ where: { slug: filters.branchSlug } });
      if (!branch) return { data: [], meta: { total: 0, pageCount: 0, page: 1, pageSize: 10 } };
      where.OR = [{ fromBranchId: branch.id }, { toBranchId: branch.id }];
    }
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 10));
    const [total, data] = await this.prisma.$transaction([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return { data, meta: { total, pageCount: Math.ceil(total / pageSize) || 0, page, pageSize } };
  }

  async activity(branchSlug?: string, days = 7) {
    const normalizedDays = Math.max(1, Math.min(14, Math.floor(days) || 7));
    const to = todayBusinessDate();
    const from = addDays(to, 1 - normalizedDays);
    const branch = branchSlug
      ? await this.prisma.branch.findUnique({ where: { slug: branchSlug }, select: { id: true } })
      : null;

    if (branchSlug && !branch) {
      return { from, to, data: dateKeysBetween(from, to).map((date) => ({ date, produced: 0, sold: 0, waste: 0 })) };
    }

    const movements = await this.prisma.stockMovement.findMany({
      where: {
        createdAt: {
          gte: businessDateStartUtc(from),
          lt: businessDateStartUtc(addDays(to, 1)),
        },
        ...(branch ? { OR: [{ fromBranchId: branch.id }, { toBranchId: branch.id }] } : {}),
      },
      select: { type: true, quantity: true, createdAt: true },
    });

    const totals = new Map(dateKeysBetween(from, to).map((date) => [date, { date, produced: 0, sold: 0, waste: 0 }]));
    for (const movement of movements) {
      const row = totals.get(formatBusinessDate(movement.createdAt));
      if (!row) continue;
      if (movement.type === StockMovementType.PRODUCCION) row.produced += movement.quantity;
      if (movement.type === StockMovementType.VENTA) row.sold += movement.quantity;
      if (movement.type === StockMovementType.MERMA || movement.type === StockMovementType.PERDIDA_ROBO) {
        row.waste += movement.quantity;
      }
    }

    return { from, to, data: [...totals.values()] };
  }

  /**
   * Reconciliación masiva: compara conteo físico real vs sistema.
   * Genera movimientos SOBRANTE (si hay más de lo esperado) o MERMA (si hay menos).
   * Retorna un resumen de los ajustes realizados.
   */
  async reconcile(dto: ReconcileInventoryDto, userId?: string) {
    const branch = await this.prisma.branch.findUnique({ where: { slug: dto.branchSlug } });
    if (!branch) throw new BadRequestException('Sucursal no encontrada');
    if (!dto.items?.length) throw new BadRequestException('Sin productos para reconciliar');

    const results: Array<{
      productId: number;
      productName: string;
      systemQuantity: number;
      actualQuantity: number;
      difference: number;
      adjustmentType: 'SOBRANTE' | 'MERMA' | 'SIN_CAMBIO';
    }> = [];

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { presentations: { where: { isActive: true } } },
        });
        if (!product) continue;

        const actualQuantity = item.presentationCounts?.length
          ? calculateBaseQuantity(product.presentations, item.presentationCounts)
          : item.actualQuantity;
        if (actualQuantity === undefined) {
          throw new BadRequestException(`Falta el conteo físico de ${product.name}`);
        }

        const inv = await tx.inventory.findUnique({
          where: { productId_branchId: { productId: item.productId, branchId: branch.id } },
        });

        const systemQty = inv?.quantity ?? 0;
        if (inv && actualQuantity < inv.reserved) {
          throw new BadRequestException(
            `El conteo de ${product.name} no puede ser menor que las ${inv.reserved} unidades reservadas`,
          );
        }
        const diff = actualQuantity - systemQty;

        if (diff === 0) {
          results.push({
            productId: item.productId,
            productName: product.name,
            systemQuantity: systemQty,
            actualQuantity,
            difference: 0,
            adjustmentType: 'SIN_CAMBIO',
          });
          continue;
        }

        const movementType = diff > 0 ? StockMovementType.SOBRANTE : StockMovementType.MERMA;
        const absQty = Math.abs(diff);

        // Ajustar inventario
        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: actualQuantity },
          });
        } else {
          await tx.inventory.create({
            data: { productId: item.productId, branchId: branch.id, quantity: actualQuantity },
          });
        }

        // Registrar movimiento
        const movement = await tx.stockMovement.create({
          data: {
            productId: item.productId,
            fromBranchId: diff < 0 ? branch.id : undefined,
            toBranchId: diff > 0 ? branch.id : undefined,
            type: movementType,
            quantity: absQty,
            userId,
            note: dto.note ? `[Conteo] ${dto.note}` : '[Conteo] Ajuste por reconciliación de inventario',
          },
        });

        if (diff < 0) {
          await this.inventoryLotsService.consumeLots(tx, {
            productId: item.productId,
            branchId: branch.id,
            quantity: absQty,
            stockMovementId: movement.id,
            allowExpired: true,
          });
        } else {
          await this.inventoryLotsService.createInboundLot(tx, {
            productId: item.productId,
            branchId: branch.id,
            quantity: absQty,
            sourceType: InventoryLotSource.SOBRANTE,
            sourceMovementId: movement.id,
          });
        }

        results.push({
          productId: item.productId,
          productName: product.name,
          systemQuantity: systemQty,
          actualQuantity,
          difference: diff,
          adjustmentType: diff > 0 ? 'SOBRANTE' : 'MERMA',
        });
      }
    });

    const adjusted = results.filter(r => r.adjustmentType !== 'SIN_CAMBIO');
    this.logger.log(`[Reconciliación] Sucursal ${branch.name}: ${adjusted.length} ajustes de ${results.length} productos revisados`);

    return {
      branchName: branch.name,
      totalReviewed: results.length,
      totalAdjusted: adjusted.length,
      sobrantes: results.filter(r => r.adjustmentType === 'SOBRANTE').length,
      mermas: results.filter(r => r.adjustmentType === 'MERMA').length,
      sinCambio: results.filter(r => r.adjustmentType === 'SIN_CAMBIO').length,
      details: results,
    };
  }
}
