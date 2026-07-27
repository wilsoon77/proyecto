import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { POSOrderDto, ReserveOrderDto } from './dto.js';
import { OrderStatus, Prisma, StockMovementType } from '@prisma/client';
import { LoggerService } from '../common/logger/logger.service.js';
import { SystemConfigService } from '../system-config/system-config.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { assertOrderTransition, FULFILLMENT_STATUSES, ORDER_STATUS_LABELS } from './order-state.js';

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
    private readonly systemConfig: SystemConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async reserve(dto: ReserveOrderDto, userId?: string) {
    // 1. Verificar modo mantenimiento
    if (await this.systemConfig.getBool('operations.maintenance_mode')) {
      throw new BadRequestException('El sistema se encuentra en mantenimiento. No se pueden realizar pedidos en este momento.');
    }

    // 2. Verificar si se aceptan pedidos
    if (!(await this.systemConfig.getBool('orders.accept_orders'))) {
      throw new BadRequestException('La tienda no está aceptando pedidos en línea en este momento.');
    }

    // 3. Validar cantidad máxima de items
    const maxItems = await this.systemConfig.getNumber('orders.max_items');
    const totalItems = dto.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    if (totalItems > maxItems) {
      throw new BadRequestException(`El pedido supera el límite máximo de ${maxItems} unidades.`);
    }

    const branch = await this.prisma.branch.findUnique({ where: { slug: dto.branchSlug } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    if (!dto.items?.length) throw new BadRequestException('Sin items');

    // Agrupar líneas repetidas antes de validar y reservar. Sin esta suma, dos
    // líneas del mismo producto podían superar el disponible de forma conjunta.
    const quantitiesBySlug = new Map<string, number>();
    for (const item of dto.items) {
      quantitiesBySlug.set(item.productSlug, (quantitiesBySlug.get(item.productSlug) ?? 0) + item.quantity);
    }
    const items = [...quantitiesBySlug.entries()].map(([productSlug, quantity]) => ({ productSlug, quantity }));
    const minAmount = await this.systemConfig.getNumber('orders.min_amount');

    // Resolve product slugs to IDs before the transaction
    const products = await this.prisma.product.findMany({ where: { slug: { in: items.map(i => i.productSlug) } } });
    const map = new Map(products.map(p => [p.slug, p]));

    // Validate all slugs exist before entering the transaction
    for (const item of items) {
      const product = map.get(item.productSlug);
      if (!product) throw new BadRequestException(`Producto no encontrado: ${item.productSlug}`);
      if (!product.isActive || !product.isAvailable) {
        throw new BadRequestException(`Producto no disponible: ${product.name}`);
      }
    }

    // Serializable + retry makes concurrent reservations compete correctly for
    // the same inventory rows instead of silently overselling.
    const order = await this.withSerializableRetry(() => this.prisma.$transaction(async (tx) => {
      // Re-check availability inside the transaction to prevent race conditions
      for (const item of items) {
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
          customerNotes: dto.customerNotes,
          shippingMethod: 'WEB',
          status: 'PENDING',
          userId: userId,
          items: { create: [] },
        } as any),
      });

      let subtotal = 0;
      for (const item of items) {
        const p = map.get(item.productSlug)!;
        await tx.inventory.update({
          where: { productId_branchId: { productId: p.id, branchId: branch.id } },
          data: { reserved: { increment: item.quantity } },
        });
        const price = Number(p.basePrice);
        subtotal += price * item.quantity;
        await tx.orderItem.create({ data: { orderId: created.id, productId: p.id, productName: p.name, quantity: item.quantity, unitPrice: p.basePrice } });
      }

      // Validar monto mínimo de pedido
      if (subtotal < minAmount) {
        throw new BadRequestException(`El monto del pedido (Q${subtotal.toFixed(2)}) es menor al pedido mínimo requerido (Q${minAmount.toFixed(2)}).`);
      }

      const updated = await tx.order.update({ where: { id: created.id }, data: { orderNumber: formatOrderNumber(created.id), subtotal, total: subtotal } });
      return updated;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    }));

    // Auditoría
    this.logger.auditOrderCreated(order.id, userId, Number(order.total));

    // Enviar notificación de nuevo pedido pendiente
    await this.notificationsService.sendByConfig('order.new_pending', {
      orderNumber: order.orderNumber,
      branchId: order.branchId,
    }, `/admin/ordenes/${order.id}`);

    return order;
  }

  async directSale(dto: POSOrderDto, userId?: string) {
    if (await this.systemConfig.getBool('operations.maintenance_mode')) {
      throw new BadRequestException('El sistema se encuentra en mantenimiento. No se pueden realizar ventas en este momento.');
    }
    const branch = await this.prisma.branch.findUnique({ where: { slug: dto.branchSlug } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    if (!dto.items?.length) throw new BadRequestException('Sin items');

    // Consolidar líneas repetidas para validar y descontar el stock una sola vez.
    const quantitiesBySlug = new Map<string, number>();
    for (const item of dto.items) {
      quantitiesBySlug.set(item.productSlug, (quantitiesBySlug.get(item.productSlug) ?? 0) + item.quantity);
    }
    const items = [...quantitiesBySlug.entries()].map(([productSlug, quantity]) => ({ productSlug, quantity }));
    const products = await this.prisma.product.findMany({ where: { slug: { in: items.map(i => i.productSlug) } } });
    const map = new Map(products.map(p => [p.slug, p]));

    for (const item of items) {
      const product = map.get(item.productSlug);
      if (!product) throw new BadRequestException(`Producto no encontrado: ${item.productSlug}`);
      if (!product.isActive || !product.isAvailable) {
        throw new BadRequestException(`Producto no disponible: ${product.name}`);
      }
    }

    const order = await this.withSerializableRetry(() => this.prisma.$transaction(async (tx) => {
      // Check availability (physical stock)
      for (const item of items) {
        const p = map.get(item.productSlug)!;
        const inv = await tx.inventory.findUnique({
          where: { productId_branchId: { productId: p.id, branchId: branch.id } },
        });
        const available = (inv?.quantity ?? 0) - (inv?.reserved ?? 0);
        if (available < item.quantity) {
          throw new BadRequestException(`Stock disponible insuficiente: ${p.name}`);
        }
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
          shippingMethod: 'POS',
          status: 'DELIVERED', // Instant delivery
          userId: userId,
          items: { create: [] },
        } as any),
      });

      let subtotal = 0;
      let totalDiscount = 0;

      for (const item of items) {
        const p = map.get(item.productSlug)!;

        // Calculate combos
        const basePrice = Number(p.basePrice);
        let itemTotal = basePrice * item.quantity;
        let discountForThisItem = 0;

        if (p.comboQuantity && p.comboPrice && p.comboQuantity > 0) {
          const comboQty = Number(p.comboQuantity);
          const comboPrice = Number(p.comboPrice);
          const nCombos = Math.floor(item.quantity / comboQty);
          const remainder = item.quantity % comboQty;

          const priceWithCombo = nCombos * comboPrice + remainder * basePrice;
          discountForThisItem = itemTotal - priceWithCombo;
        }

        subtotal += (basePrice * item.quantity);
        totalDiscount += discountForThisItem;

        // Deduct physical inventory directly
        await tx.inventory.update({
          where: { productId_branchId: { productId: p.id, branchId: branch.id } },
          data: { quantity: { decrement: item.quantity } },
        });

        // Add order item
        await tx.orderItem.create({
          data: {
             orderId: created.id,
             productId: p.id,
             productName: p.name,
             quantity: item.quantity,
             unitPrice: p.basePrice 
          }
        });

        // Create stock movement
        await tx.stockMovement.create({
          data: {
             productId: p.id,
             fromBranchId: branch.id,
             type: StockMovementType.VENTA,
             quantity: item.quantity,
             userId 
          }
        });
      }

      const total = subtotal - totalDiscount;

      const updated = await tx.order.update({
        where: { id: created.id },
        data: {
          orderNumber: formatOrderNumber(created.id),
          subtotal,
          discount: totalDiscount,
          total
        }
      });
      return updated;
    }, this.serializableOptions()));

    this.logger.auditOrderCreated(order.id, userId, Number(order.total));

    return order;
  }

  async cancel(orderId: number, userId?: string) {
    const order: any = await this.withSerializableRetry(() => this.prisma.$transaction(async (tx) => {
      const current: any = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, branch: true },
      });
      if (!current) throw new NotFoundException('Orden no encontrada');
      if (!current.branchId) throw new BadRequestException('Orden sin sucursal');

      assertOrderTransition(current.status, OrderStatus.CANCELLED);
      for (const item of current.items) {
        const inventory = await tx.inventory.findUnique({
          where: { productId_branchId: { productId: item.productId, branchId: current.branchId } },
        });
        if (!inventory || inventory.reserved < item.quantity) {
          throw new BadRequestException('La reserva de inventario no coincide con la orden');
        }
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { reserved: { decrement: item.quantity } },
        });
      }

      return tx.order.update({
        where: { id: current.id },
        data: { status: OrderStatus.CANCELLED },
        include: { items: true, branch: true },
      });
    }, this.serializableOptions()));

    this.logger.auditOrderCancelled(orderId, userId);
    await this.notifyStatusChange(order);
    await this.notificationsService.sendByConfig('order.cancelled', {
      orderNumber: order.orderNumber,
      branchId: order.branchId,
    }, `/admin/ordenes/${order.id}`);

    return normalizeOrder(order);
  }

  async pickup(orderId: number, userId?: string) {
    return this.fulfill(orderId, OrderStatus.READY, OrderStatus.PICKED_UP, userId);
  }

  async deliver(orderId: number, userId?: string) {
    return this.fulfill(orderId, OrderStatus.IN_DELIVERY, OrderStatus.DELIVERED, userId);
  }

  private async fulfill(
    orderId: number,
    expectedStatus: OrderStatus,
    finalStatus: OrderStatus,
    userId?: string,
  ) {
    const order: any = await this.withSerializableRetry(() => this.prisma.$transaction(async (tx) => {
      const current: any = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, branch: true },
      });
      if (!current) throw new NotFoundException('Orden no encontrada');
      if (!current.branchId) throw new BadRequestException('Orden sin sucursal');
      if (current.status !== expectedStatus) {
        throw new BadRequestException(`La orden debe estar en ${expectedStatus} para completar esta entrega`);
      }
      assertOrderTransition(current.status, finalStatus);

      for (const item of current.items) {
        const inventory = await tx.inventory.findUnique({
          where: { productId_branchId: { productId: item.productId, branchId: current.branchId } },
        });
        if (!inventory || inventory.reserved < item.quantity) {
          throw new BadRequestException('La reserva de inventario no coincide con la orden');
        }
        if (inventory.quantity < item.quantity) {
          throw new BadRequestException('Stock físico insuficiente');
        }

        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            reserved: { decrement: item.quantity },
            quantity: { decrement: item.quantity },
          },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            fromBranchId: current.branchId,
            type: StockMovementType.VENTA,
            quantity: item.quantity,
            userId,
          },
        });
      }

      return tx.order.update({
        where: { id: current.id },
        data: { status: finalStatus },
        include: { items: true, branch: true },
      });
    }, this.serializableOptions()));

    this.logger.auditOrderPickup(orderId, userId);
    await this.notifyStatusChange(order);
    await this.notifyLowStockAfterFulfillment(order);
    return normalizeOrder(order);
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
      this.prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: { items: true, branch: true } }),
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
    return this.transitionStatus(orderId, OrderStatus.CONFIRMED);
  }

  async updateStatus(orderId: number, newStatus: string) {
    if (!Object.values(OrderStatus).includes(newStatus as OrderStatus)) {
      throw new BadRequestException(`Estado inválido. Debe ser uno de: ${Object.values(OrderStatus).join(', ')}`);
    }

    const target = newStatus as OrderStatus;
    if (target === OrderStatus.CANCELLED) {
      throw new BadRequestException('Usa la acción de cancelación para liberar la reserva de inventario');
    }
    if (FULFILLMENT_STATUSES.has(target)) {
      throw new BadRequestException('Usa la acción de entrega o recogida para descontar inventario');
    }

    return this.transitionStatus(orderId, target);
  }

  private async transitionStatus(orderId: number, target: OrderStatus) {
    const updated: any = await this.withSerializableRetry(() => this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: orderId } });
      if (!current) throw new NotFoundException('Orden no encontrada');
      assertOrderTransition(current.status, target);
      return tx.order.update({ where: { id: current.id }, data: { status: target } });
    }, this.serializableOptions()));

    await this.notifyStatusChange(updated);
    return normalizeOrder(updated);
  }

  private async notifyStatusChange(order: { userId?: string | null; orderNumber: string; status: OrderStatus }) {
    if (!order.userId) return;

    await this.notificationsService.sendToUser(order.userId, 'order.status_changed', {
      orderNumber: order.orderNumber,
      status: ORDER_STATUS_LABELS[order.status],
    }, '/pedidos');
  }

  private async notifyLowStockAfterFulfillment(order: any) {
    if (!order.branchId) return;

    for (const item of order.items) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId_branchId: { productId: item.productId, branchId: order.branchId } },
      });
      if (!inventory) continue;

      await this.notificationsService.sendLowStockIfNeeded({
        alertType: 'PRODUCT_LOW',
        branchId: order.branchId,
        resourceKey: `product:${item.productId}`,
        configKey: 'inventory.low_stock',
        currentValue: inventory.quantity,
        placeholders: {
          productName: item.productName,
          current: inventory.quantity,
          branchName: order.branch?.name || 'Sucursal',
        },
        url: '/admin/inventario',
      });
    }
  }

  private serializableOptions() {
    return {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    };
  }

  private async withSerializableRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        if (error?.code !== 'P2034' || attempt === maxRetries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }

    throw new Error('No se pudo completar la transacción de la orden');
  }
}
