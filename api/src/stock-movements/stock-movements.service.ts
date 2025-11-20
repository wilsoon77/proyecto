import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStockMovementDto } from './dto.js';
import { StockMovementType } from '@prisma/client';

@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (tx) => {
      const adjust = async (branchId: number, delta: number) => {
        const existing = await tx.inventory.findUnique({
          where: { productId_branchId: { productId: product.id, branchId } },
        });
        if (!existing) {
          await tx.inventory.create({ data: { productId: product.id, branchId, quantity: delta > 0 ? delta : 0 } });
          if (delta < 0) throw new BadRequestException('Inventario insuficiente');
        } else {
          const newQuantity = existing.quantity + delta;
          if (newQuantity < 0) throw new BadRequestException('Inventario insuficiente');
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
      return movement;
    });
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
}
