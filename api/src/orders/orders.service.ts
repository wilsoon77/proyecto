import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReserveOrderDto } from './dto.js';
import { StockMovementType } from '@prisma/client';

function formatOrderNumber(id: number) {
  return 'ORD-' + id.toString().padStart(6, '0');
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async reserve(dto: ReserveOrderDto, userId?: string) {
    const branch = await this.prisma.branch.findUnique({ where: { slug: dto.branchSlug } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    if (!dto.items?.length) throw new BadRequestException('Sin items');

    // Pre-validate availability
    const products = await this.prisma.product.findMany({ where: { slug: { in: dto.items.map(i => i.productSlug) } } });
    const map = new Map(products.map(p => [p.slug, p]));

    // Check availability per product in selected branch
    for (const item of dto.items) {
      const p = map.get(item.productSlug);
      if (!p) throw new BadRequestException(`Producto no encontrado: ${item.productSlug}`);
      const inv = await this.prisma.inventory.findUnique({ where: { productId_branchId: { productId: p.id, branchId: branch.id } } });
      const available = (inv?.quantity ?? 0) - (inv?.reserved ?? 0);
      if (available < item.quantity) throw new BadRequestException(`Stock insuficiente: ${p.name}`);
    }

    // Create order + increase reserved atomically
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: ({
          orderNumber: 'temp',
          branchId: branch.id,
          subtotal: 0,
          deliveryFee: 0,
          discount: 0,
          total: 0,
          paymentMethod: dto.paymentMethod,
          status: 'PENDING',
          userId: userId,
          items: { create: [] },
        } as any),
      });

      let subtotal = 0;
      for (const item of dto.items) {
        const p = map.get(item.productSlug)!;
        const inv = await tx.inventory.upsert({
          where: { productId_branchId: { productId: p.id, branchId: branch.id } },
          update: { reserved: { increment: item.quantity } },
          create: { productId: p.id, branchId: branch.id, quantity: 0, reserved: item.quantity },
        });
        const price = Number(p.price);
        subtotal += price * item.quantity;
        await tx.orderItem.create({ data: { orderId: created.id, productId: p.id, quantity: item.quantity, unitPrice: p.price } });
      }
      const updated = await tx.order.update({ where: { id: created.id }, data: { orderNumber: formatOrderNumber(created.id), subtotal, total: subtotal } });
      return updated;
    });

    return order;
  }

  async cancel(orderId: number, userId?: string) {
    const order: any = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } as any });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (!order.branchId) throw new BadRequestException('Orden sin sucursal');

    await this.prisma.$transaction(async (tx) => {
      for (const it of order.items) {
        const inv = await tx.inventory.findUnique({ where: { productId_branchId: { productId: it.productId, branchId: order.branchId } } });
        if (inv && inv.reserved >= it.quantity) {
          await tx.inventory.update({ where: { id: inv.id }, data: { reserved: inv.reserved - it.quantity } });
        }
      }
      await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED', userId: userId ?? order.userId } });
    });

    return { ok: true };
  }

  async pickup(orderId: number, userId?: string) {
    const order: any = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } as any });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (!order.branchId) throw new BadRequestException('Orden sin sucursal');

    await this.prisma.$transaction(async (tx) => {
      for (const it of order.items) {
        const inv = await tx.inventory.findUnique({ where: { productId_branchId: { productId: it.productId, branchId: order.branchId } } });
        if (!inv || inv.reserved < it.quantity) throw new BadRequestException('Reservado insuficiente');
        await tx.inventory.update({ where: { id: inv.id }, data: { reserved: inv.reserved - it.quantity } });
        // VENTA: disminuir quantity
        await tx.stockMovement.create({ data: { productId: it.productId, fromBranchId: order.branchId, type: StockMovementType.VENTA, quantity: it.quantity, userId } });
        const after = await tx.inventory.findUnique({ where: { productId_branchId: { productId: it.productId, branchId: order.branchId } } });
        if (!after || after.quantity < 0) throw new BadRequestException('Inventario negativo');
      }
      await tx.order.update({ where: { id: order.id }, data: { status: 'DELIVERED', userId: userId ?? order.userId } });
    });

    return { ok: true };
  }

  async list(filters: { branchSlug?: string; status?: string; page?: number; pageSize?: number }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.branchSlug) {
      const branch = await this.prisma.branch.findUnique({ where: { slug: filters.branchSlug } });
      if (!branch) return [];
      where.branchId = branch.id;
    }
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 10));
    const [total, data] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { items: true } }),
    ]);
    return {
      data,
      meta: { total, pageCount: Math.ceil(total / pageSize) || 0, page, pageSize },
    };
  }

  async detail(id: number) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true, branch: true } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }
}
