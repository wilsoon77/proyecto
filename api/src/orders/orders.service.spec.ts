import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrderStatus } from '@prisma/client';

describe('OrdersService State Machine & Reservation Lifecycle', () => {
  let prisma: any;
  let auditService: any;
  let systemConfig: any;
  let inventoryLotsService: any;
  let service: OrdersService;

  beforeEach(() => {
    jest.clearAllMocks();

    systemConfig = {
      getBool: jest.fn(async (key: string) => {
        if (key === 'operations.maintenance_mode') return false;
        if (key === 'orders.accept_orders') return true;
        if (key === 'orders.catalog_only') return false;
        return false;
      }),
      getNumber: jest.fn(async (key: string) => {
        if (key === 'orders.max_items') return 50;
        if (key === 'orders.min_amount') return 5;
        return 0;
      }),
    };

    prisma = {
      branch: {
        findUnique: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      inventory: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (callback: any) => callback(prisma)),
    };

    const logger = {
      auditOrderCancelled: jest.fn(),
      auditOrderStatusChanged: jest.fn(),
      auditOrderCreated: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };

    inventoryLotsService = {
      getSellableQuantity: jest.fn(),
      consumeLotsForOrder: jest.fn(),
    };

    service = new OrdersService(prisma, logger as any, systemConfig, inventoryLotsService);
  });

  describe('Reservation Validation', () => {
    it('rejects reservations while the public site is in catalog-only mode', async () => {
      systemConfig.getBool.mockImplementation(async (key: string) => {
        if (key === 'orders.catalog_only') return true;
        if (key === 'orders.accept_orders') return true;
        return false;
      });

      await expect(service.reserve({} as any)).rejects.toThrow(
        new BadRequestException('La tienda está en modo catálogo. Las compras están deshabilitadas en este momento.'),
      );
    });

    it('rejects reservations when total items exceed maximum limit', async () => {
      await expect(
        service.reserve({
          branchSlug: 'central',
          items: [{ productSlug: 'pan-frances', quantity: 60 }],
        } as any),
      ).rejects.toThrow(new BadRequestException('El pedido supera el límite máximo de 50 unidades.'));
    });

    it('rejects reservations when branch is not found or inactive', async () => {
      prisma.branch.findUnique.mockResolvedValue(null);

      await expect(
        service.reserve({
          branchSlug: 'inexistente',
          items: [{ productSlug: 'pan-frances', quantity: 5 }],
        } as any),
      ).rejects.toThrow(new NotFoundException('Sucursal no encontrada'));
    });

    it('rejects reservations without items', async () => {
      prisma.branch.findUnique.mockResolvedValue({ id: 1, slug: 'central', isActive: true });

      await expect(
        service.reserve({
          branchSlug: 'central',
          items: [],
        } as any),
      ).rejects.toThrow(new BadRequestException('Sin items'));
    });

    it('rejects reservations when product is inactive or unavailable', async () => {
      prisma.branch.findUnique.mockResolvedValue({ id: 1, slug: 'central', isActive: true });
      prisma.product.findMany.mockResolvedValue([
        {
          id: 10,
          slug: 'pan-frances',
          name: 'Pan Francés',
          isActive: false,
          isAvailable: true,
          presentations: [],
        },
      ]);

      await expect(
        service.reserve({
          branchSlug: 'central',
          items: [{ productSlug: 'pan-frances', quantity: 5 }],
        } as any),
      ).rejects.toThrow(new BadRequestException('Producto no disponible: Pan Francés'));
    });
  });

  describe('Order State Transitions', () => {
    it('confirms a pending order successfully', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 101,
        orderNumber: 'ORD-101',
        status: OrderStatus.PENDING,
        branchId: 1,
      });
      prisma.order.update.mockResolvedValue({
        id: 101,
        orderNumber: 'ORD-101',
        status: OrderStatus.CONFIRMED,
        branchId: 1,
      });

      const result = await service.confirm(101);
      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('marks a confirmed order as preparing via updateStatus', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 101,
        orderNumber: 'ORD-101',
        status: OrderStatus.CONFIRMED,
        branchId: 1,
      });
      prisma.order.update.mockResolvedValue({
        id: 101,
        orderNumber: 'ORD-101',
        status: OrderStatus.PREPARING,
        branchId: 1,
      });

      const result = await service.updateStatus(101, OrderStatus.PREPARING);
      expect(result.status).toBe(OrderStatus.PREPARING);
    });

    it('marks a preparing order as ready for pickup via updateStatus', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 101,
        orderNumber: 'ORD-101',
        status: OrderStatus.PREPARING,
        branchId: 1,
      });
      prisma.order.update.mockResolvedValue({
        id: 101,
        orderNumber: 'ORD-101',
        status: OrderStatus.READY,
        branchId: 1,
      });

      const result = await service.updateStatus(101, OrderStatus.READY);
      expect(result.status).toBe(OrderStatus.READY);
    });

    it('cancels a pending order and releases reserved inventory', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 101,
        orderNumber: 'ORD-101',
        status: OrderStatus.PENDING,
        branchId: 1,
        items: [{ productId: 5, quantity: 10, stockQuantity: 10 }],
      });
      prisma.inventory.findUnique.mockResolvedValue({
        id: 20,
        productId: 5,
        branchId: 1,
        quantity: 50,
        reserved: 10,
      });
      prisma.order.update.mockResolvedValue({
        id: 101,
        orderNumber: 'ORD-101',
        status: OrderStatus.CANCELLED,
      });

      const result = await service.cancel(101, 'user-1');
      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(prisma.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 20 },
          data: { reserved: { decrement: 10 } },
        }),
      );
    });

    it('rejects invalid state transition (PENDING -> PICKED_UP)', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 101,
        orderNumber: 'ORD-101',
        status: OrderStatus.PENDING,
        branchId: 1,
        items: [],
      });

      await expect(service.updateStatus(101, OrderStatus.PICKED_UP)).rejects.toThrow();
    });

    it('rejects invalid status string in updateStatus', async () => {
      await expect(service.updateStatus(101, 'ESTADO_INEXISTENTE')).rejects.toThrow(
        new BadRequestException('Estado inválido. Debe ser uno de: PENDING, CONFIRMED, PREPARING, READY, CANCELLED, PICKED_UP'),
      );
    });
  });
});
