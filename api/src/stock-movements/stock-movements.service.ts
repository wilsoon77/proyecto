import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStockMovementDto, ReconcileInventoryDto } from './dto.js';
import { StockMovementType } from '@prisma/client';
import { LoggerService } from '../common/logger/logger.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class StockMovementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
        case StockMovementType.MERMA:
        case StockMovementType.PERDIDA_ROBO:
          await adjust(fromBranch!.id, -dto.quantity);
          break;
        case StockMovementType.TRANSFERENCIA:
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
          userId: userId,
          referenceId: dto.referenceId,
          note: dto.note,
        },
      });

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
    });

    // Enviar alertas si hay merma o robo
    if (dto.type === StockMovementType.MERMA || dto.type === StockMovementType.PERDIDA_ROBO) {
      const typeLabel = dto.type === StockMovementType.MERMA ? 'MERMA' : 'PÉRDIDA/ROBO';
      await this.notificationsService.sendByConfig('inventory.loss_detected', {
        productName: product.name,
        quantity: dto.quantity,
        type: typeLabel,
        branchName: fromBranch?.name || 'Sucursal',
        branchId: fromBranch?.id,
      }, `/admin/inventario/movimiento`);

      // Verificar si bajó el stock físico
      if (fromBranch) {
        const currentInv = await this.prisma.inventory.findUnique({
          where: { productId_branchId: { productId: product.id, branchId: fromBranch.id } },
        });
        if (currentInv) {
          await this.notificationsService.sendLowStockIfNeeded({
            alertType: 'PRODUCT_LOW',
            branchId: fromBranch.id,
            resourceKey: `product:${product.id}`,
            configKey: 'inventory.low_stock',
            currentValue: currentInv.quantity,
            placeholders: {
              productName: product.name,
              current: currentInv.quantity,
              branchName: fromBranch.name,
            },
            url: `/admin/inventario`,
          });
        }
      }
    }

    // Verificar stock físico bajo en ventas manuales
    if (dto.type === StockMovementType.VENTA && fromBranch) {
      const currentInv = await this.prisma.inventory.findUnique({
        where: { productId_branchId: { productId: product.id, branchId: fromBranch.id } },
      });
      if (currentInv) {
        await this.notificationsService.sendLowStockIfNeeded({
          alertType: 'PRODUCT_LOW',
          branchId: fromBranch.id,
          resourceKey: `product:${product.id}`,
          configKey: 'inventory.low_stock',
          currentValue: currentInv.quantity,
          placeholders: {
            productName: product.name,
            current: currentInv.quantity,
            branchName: fromBranch.name,
          },
          url: `/admin/inventario`,
        });
      }
    }

    return movement;
  }



  async list(filters: { productSlug?: string; branchSlug?: string; type?: string; from?: string; to?: string; page?: number; pageSize?: number }) {
    const where: any = {};
    if (filters.type) where.type = filters.type as StockMovementType;
    if (filters.productSlug) {
      const product = await this.prisma.product.findUnique({ where: { slug: filters.productSlug } });
      if (!product) return [];
      where.productId = product.id;
    }
    if (filters.branchSlug) {
      const branch = await this.prisma.branch.findUnique({ where: { slug: filters.branchSlug } });
      if (!branch) return [];
      // movement can be from or to this branch
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
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;

        const inv = await tx.inventory.findUnique({
          where: { productId_branchId: { productId: item.productId, branchId: branch.id } },
        });

        const systemQty = inv?.quantity ?? 0;
        if (inv && item.actualQuantity < inv.reserved) {
          throw new BadRequestException(
            `El conteo de ${product.name} no puede ser menor que las ${inv.reserved} unidades reservadas`,
          );
        }
        const diff = item.actualQuantity - systemQty;

        if (diff === 0) {
          results.push({
            productId: item.productId,
            productName: product.name,
            systemQuantity: systemQty,
            actualQuantity: item.actualQuantity,
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
            data: { quantity: item.actualQuantity },
          });
        } else {
          await tx.inventory.create({
            data: { productId: item.productId, branchId: branch.id, quantity: item.actualQuantity },
          });
        }

        // Registrar movimiento
        await tx.stockMovement.create({
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

        results.push({
          productId: item.productId,
          productName: product.name,
          systemQuantity: systemQty,
          actualQuantity: item.actualQuantity,
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
