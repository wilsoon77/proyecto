import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReserveOrderDto } from './dto.js';
import { StockMovementType } from '@prisma/client';
import { LoggerService } from '../common/logger/logger.service.js';

function formatOrderNumber(id: number) {
  return 'ORD-' + id.toString().padStart(6, '0');
}

/** Normalize Prisma Decimal fields to numbers for JSON serialization */
function normalizeOrder(order: any) {
  if (!order) return order;
  return {
    ...order,
    subtotal: order.subtotal !== undefined ? Number(order.subtotal) : order.subtotal,
    deliveryFee: order.deliveryFee !== undefined ? Number(order.deliveryFee) : order.deliveryFee,
    discount: order.discount !== undefined ? Number(order.discount) : order.discount,
    total: order.total !== undefined ? Number(order.total) : order.total,
    items: order.items?.map((it: any) => ({
      ...it,
      unitPrice: it.unitPrice !== undefined ? Number(it.unitPrice) : it.unitPrice,
    })),
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async reserve(dto: ReserveOrderDto, userId?: string) {
    const branch = await this.prisma.branch.findUnique({ where: { slug: dto.branchSlug } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    if (!dto.items?.length) throw new BadRequestException('Sin items');

    // Resolve product slugs to IDs before the transaction
    const products = await this.prisma.product.findMany({ where: { slug: { in: dto.items.map(i => i.productSlug) } } });
    const map = new Map(products.map(p => [p.slug, p]));

    // Validate all slugs exist before entering the transaction
    for (const item of dto.items) {
      if (!map.get(item.productSlug)) throw new BadRequestException(`Producto no encontrado: ${item.productSlug}`);
    }

    // Create order + validate availability + increase reserved atomically
    const order = await this.prisma.$transaction(async (tx) => {
      // Re-check availability inside the transaction to prevent race conditions
      for (const item of dto.items) {
        const p = map.get(item.productSlug)!;
        const inv = await tx.inventory.findUnique({
          where: { productId_branchId: { productId: p.id, branchId: branch.id } },
        });
        const available = (inv?.quantity ?? 0) - (inv?.reserved ?? 0);
        if (available < item.quantity) throw new BadRequestException(`Stock insuficiente: ${p.name}`);
      }

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
        await tx.inventory.upsert({
          where: { productId_branchId: { productId: p.id, branchId: branch.id } },
          update: { reserved: { increment: item.quantity } },
          create: { productId: p.id, branchId: branch.id, quantity: 0, reserved: item.quantity },
        });
        const price = Number(p.price);
        subtotal += price * item.quantity;
        await tx.orderItem.create({ data: { orderId: created.id, productId: p.id, productName: p.name, quantity: item.quantity, unitPrice: p.price } });
      }
      const updated = await tx.order.update({ where: { id: created.id }, data: { orderNumber: formatOrderNumber(created.id), subtotal, total: subtotal } });
      return updated;
    });

    // Auditoría
    this.logger.auditOrderCreated(order.id, userId, Number(order.total));

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

    // Auditoría
    this.logger.auditOrderCancelled(orderId, userId);

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
        if (inv.quantity < it.quantity) throw new BadRequestException('Stock físico insuficiente');
        // Descontar tanto el reservado como el stock físico
        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            reserved: { decrement: it.quantity },
            quantity: { decrement: it.quantity },
          },
        });
        await tx.stockMovement.create({ data: { productId: it.productId, fromBranchId: order.branchId, type: StockMovementType.VENTA, quantity: it.quantity, userId } });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: 'DELIVERED', userId: userId ?? order.userId } });
    });

    // Auditoría
    this.logger.auditOrderPickup(orderId, userId);

    return { ok: true };
  }

  async list(filters: { branchSlug?: string; status?: string; page?: number; pageSize?: number }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.branchSlug) {
      const branch = await this.prisma.branch.findUnique({ where: { slug: filters.branchSlug } });
      if (!branch) {
        const page = Math.max(1, filters.page ?? 1);
        const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 10));
        return { data: [], meta: { total: 0, pageCount: 0, page, pageSize } };
      }
      where.branchId = branch.id;
    }
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 10));
    const [total, data] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { items: true } }),
    ]);
    return {
      data: data.map(normalizeOrder),
      meta: { total, pageCount: Math.ceil(total / pageSize) || 0, page, pageSize },
    };
  }

  async detail(id: number, userId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true, branch: true } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    
    if (userId && order.userId !== userId) {
      throw new NotFoundException('Orden no encontrada');
    }
    
    return normalizeOrder(order);
  }

  async findByUser(userId: string, filters: { status?: string; page?: number; pageSize?: number }) {
    const where: any = { userId };
    if (filters.status) where.status = filters.status;
    
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 10));
    const [total, data] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({ 
        where, 
        orderBy: { createdAt: 'desc' }, 
        skip: (page - 1) * pageSize, 
        take: pageSize, 
        include: { items: true, branch: true } 
      }),
    ]);
    return {
      data: data.map(normalizeOrder),
      meta: { total, pageCount: Math.ceil(total / pageSize) || 0, page, pageSize },
    };
  }

  async confirm(orderId: number) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.status !== 'PENDING') throw new BadRequestException('Solo se pueden confirmar órdenes PENDING');
    
    return normalizeOrder(await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    }));
  }

  async updateStatus(orderId: number, newStatus: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'IN_DELIVERY', 'DELIVERED', 'CANCELLED', 'PICKED_UP'];
    if (!validStatuses.includes(newStatus)) {
      throw new BadRequestException(`Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`);
    }
    
    return normalizeOrder(await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus as any },
    }));
  }
}
