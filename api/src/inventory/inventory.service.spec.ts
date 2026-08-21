import { NotFoundException } from '@nestjs/common';
import { ProductOrigin } from '@prisma/client';
import { InventoryService } from './inventory.service.js';

/**
 * Unit tests para InventoryService.
 * 
 * Aplica: test-driven-development (verificar comportamiento, no implementación)
 * Aplica: nestjs-service-layer (servicio aislado de HTTP)
 */

function createMockPrisma() {
  return {
    product: {
      findUnique: jest.fn(),
    },
    branch: {
      findUnique: jest.fn(),
    },
    inventory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    inventoryLot: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  } as any;
}

const INVENTORY_ITEMS = [
  {
    id: 1,
    productId: 10,
    branchId: 1,
    quantity: 100,
    reserved: 5,
    updatedAt: new Date('2026-03-01'),
    product: { id: 10, name: 'Pan Francés', slug: 'pan-frances' },
    branch: { id: 1, name: 'Central', slug: 'central' },
  },
  {
    id: 2,
    productId: 11,
    branchId: 1,
    quantity: 8,
    reserved: 2,
    updatedAt: new Date('2026-03-01'),
    product: { id: 11, name: 'Pan Dulce', slug: 'pan-dulce' },
    branch: { id: 1, name: 'Central', slug: 'central' },
  },
];

describe('InventoryService', () => {
  let service: InventoryService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new InventoryService(mockPrisma);
  });

  describe('list', () => {
    it('returns all inventory items when no filters provided', async () => {
      mockPrisma.inventory.findMany.mockResolvedValue(INVENTORY_ITEMS);

      const result = await service.list();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        product: { id: 10, name: 'Pan Francés', slug: 'pan-frances' },
        quantity: 100,
        reserved: 5,
        available: 95,
      }));
    });

    it('filters by product slug when provided', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 10 });
      mockPrisma.inventory.findMany.mockResolvedValue([INVENTORY_ITEMS[0]]);

      const result = await service.list('pan-frances');

      expect(mockPrisma.inventory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 10 },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('returns empty array when product slug does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const result = await service.list('producto-inexistente');

      expect(result).toEqual([]);
      expect(mockPrisma.inventory.findMany).not.toHaveBeenCalled();
    });

    it('filters by branch slug when provided', async () => {
      mockPrisma.branch.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.inventory.findMany.mockResolvedValue(INVENTORY_ITEMS);

      await service.list(undefined, 'central');

      expect(mockPrisma.inventory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { branchId: 1 },
        }),
      );
    });

    it('returns empty array when branch slug does not exist', async () => {
      mockPrisma.branch.findUnique.mockResolvedValue(null);

      const result = await service.list(undefined, 'sucursal-fantasma');

      expect(result).toEqual([]);
    });

    it('calculates available = quantity - reserved correctly', async () => {
      mockPrisma.inventory.findMany.mockResolvedValue(INVENTORY_ITEMS);

      const result = await service.list();

      expect(result[0].available).toBe(95);  // 100 - 5
      expect(result[1].available).toBe(6);   // 8 - 2
    });

    it('expone como disponible solo el lote vigente y conserva el vencido para merma', async () => {
      mockPrisma.inventory.findMany.mockResolvedValue([{
        productId: 1,
        branchId: 2,
        quantity: 10,
        reserved: 1,
        updatedAt: new Date(),
        product: {
          id: 1,
          name: 'Jugo',
          slug: 'jugo',
          origin: ProductOrigin.COMPRADO,
          tracksExpiration: true,
          presentations: [],
        },
        branch: { id: 2, name: 'Centro', slug: 'centro' },
      }]);
      mockPrisma.inventoryLot.findMany.mockResolvedValue([
        { productId: 1, branchId: 2, availableQuantity: 6, expiresAt: new Date('2020-01-01T00:00:00.000Z') },
        { productId: 1, branchId: 2, availableQuantity: 4, expiresAt: new Date('2099-01-01T00:00:00.000Z') },
      ]);

      const [result] = await service.list();

      expect(result).toMatchObject({
        quantity: 10,
        reserved: 1,
        available: 3,
        expiredQuantity: 6,
      });
    });
  });

  describe('getByProductAndBranch', () => {
    it('returns inventory for a specific product-branch combination', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(INVENTORY_ITEMS[0]);

      const result = await service.getByProductAndBranch(10, 1);

      expect(result.product.id).toBe(10);
      expect(result.branch.id).toBe(1);
      expect(result.available).toBe(95);
    });

    it('throws NotFoundException when inventory record does not exist', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(null);

      await expect(
        service.getByProductAndBranch(999, 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLowStock', () => {
    it('returns only items with available stock below threshold', async () => {
      mockPrisma.inventory.findMany.mockResolvedValue(INVENTORY_ITEMS);

      // Threshold 10: Pan Francés (95 available) should NOT be included
      // Pan Dulce (6 available) SHOULD be included
      const result = await service.getLowStock(undefined, 10);

      expect(result).toHaveLength(1);
      expect(result[0].product.name).toBe('Pan Dulce');
    });

    it('returns empty array when all items are above threshold', async () => {
      mockPrisma.inventory.findMany.mockResolvedValue(INVENTORY_ITEMS);

      const result = await service.getLowStock(undefined, 1);

      expect(result).toEqual([]);
    });

    it('filters by branchId when provided', async () => {
      mockPrisma.inventory.findMany.mockResolvedValue([]);

      await service.getLowStock(1, 10);

      expect(mockPrisma.inventory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { branchId: 1 },
        }),
      );
    });
  });
});
