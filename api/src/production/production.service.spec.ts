import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductionService } from './production.service.js';

/**
 * Unit tests para ProductionService.
 * 
 * Aplica: test-driven-development (cada test verifica un comportamiento específico)
 * Aplica: prisma-transactions-acid (verifica atomicidad y validaciones)
 * 
 * Se mockea PrismaService para aislar la lógica de negocio de la base de datos.
 * La transacción ($transaction) ejecuta el callback con el mismo mock,
 * simulando el comportamiento real de Prisma Interactive Transactions.
 */

// ─── Mock Factory ────────────────────────────────────────────────────────────

function createMockPrisma() {
  const mock: any = {
    recipe: {
      findUnique: jest.fn(),
    },
    branch: {
      findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Sucursal Central' }),
    },
    rawMaterialInventory: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    inventory: {
      upsert: jest.fn(),
    },
    productionLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    // $transaction ejecuta el callback pasándole el mismo mock como "tx"
    // Esto simula el Interactive Transaction de Prisma
    $transaction: jest.fn((fn, _options) => fn(mock)),
  };
  return mock;
}

// ─── Fixture Data ────────────────────────────────────────────────────────────

const RECIPE_FRANCES = {
  id: 1,
  productId: 10,
  name: 'Amasijo Estándar de Francés',
  standardTrays: 33,
  isActive: true,
  product: {
    id: 10,
    name: 'Pan Francés',
    slug: 'pan-frances',
    unitsPerTray: 36,
  },
  ingredients: [
    {
      id: 1,
      rawMaterialId: 100,
      quantity: 50, // 50 LB harina
      rawMaterial: { id: 100, name: 'Harina', baseUnit: 'LB' },
    },
    {
      id: 2,
      rawMaterialId: 101,
      quantity: 2,  // 2 LB levadura
      rawMaterial: { id: 101, name: 'Levadura', baseUnit: 'LB' },
    },
  ],
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ProductionService', () => {
  let service: ProductionService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  
  const mockNotificationsService = {
    checkThreshold: jest.fn().mockResolvedValue(false),
    sendByConfig: jest.fn().mockResolvedValue(undefined),
    sendToUser: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new ProductionService(mockPrisma, mockNotificationsService as any);
  });

  describe('registerProduction', () => {
    it('throws NotFoundException when recipe does not exist', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(null);

      await expect(
        service.registerProduction({ recipeId: 999, traysProduced: 10 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when recipe is inactive', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue({
        ...RECIPE_FRANCES,
        isActive: false,
      });

      await expect(
        service.registerProduction({ recipeId: 1, traysProduced: 10 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when product has no unitsPerTray', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue({
        ...RECIPE_FRANCES,
        product: { ...RECIPE_FRANCES.product, unitsPerTray: null },
      });

      await expect(
        service.registerProduction({ recipeId: 1, traysProduced: 10 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when user has no branchId and none provided', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(RECIPE_FRANCES);
      mockPrisma.user.findUnique.mockResolvedValue({ branchId: null });

      await expect(
        service.registerProduction({ recipeId: 1, traysProduced: 10 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when raw material inventory does not exist', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(RECIPE_FRANCES);
      mockPrisma.user.findUnique.mockResolvedValue({ branchId: 1 });
      mockPrisma.rawMaterialInventory.findUnique.mockResolvedValue(null);

      await expect(
        service.registerProduction({ recipeId: 1, traysProduced: 10 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when stock is insufficient', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(RECIPE_FRANCES);
      mockPrisma.user.findUnique.mockResolvedValue({ branchId: 1 });
      // Harina: necesita 50 LB, solo hay 20 LB
      mockPrisma.rawMaterialInventory.findUnique.mockResolvedValueOnce({ id: 1, quantity: 20 });

      await expect(
        service.registerProduction({ recipeId: 1, traysProduced: 1 }, 'user-1'),
      ).rejects.toThrow('Materia prima insuficiente');
    });

    it('correctly calculates unitsProduced from traysProduced × unitsPerTray', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(RECIPE_FRANCES);
      mockPrisma.user.findUnique.mockResolvedValue({ branchId: 1 });
      // Ambos ingredientes con suficiente stock
      mockPrisma.rawMaterialInventory.findUnique
        .mockResolvedValueOnce({ id: 1, quantity: 200 }) // harina: 200 LB
        .mockResolvedValueOnce({ id: 2, quantity: 50 });  // levadura: 50 LB
      mockPrisma.rawMaterialInventory.update.mockResolvedValue({});
      mockPrisma.inventory.upsert.mockResolvedValue({});
      mockPrisma.productionLog.create.mockResolvedValue({ id: 1 });
      mockPrisma.stockMovement.create.mockResolvedValue({});

      const result = await service.registerProduction(
        { recipeId: 1, traysProduced: 33 },
        'user-1',
      );

      // 33 latas × 36 unidades/lata = 1188 panes
      expect(result.unitsProduced).toBe(33 * 36);
      expect(result.traysProduced).toBe(33);
    });

    it('deducts raw materials correctly within the transaction', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(RECIPE_FRANCES);
      mockPrisma.user.findUnique.mockResolvedValue({ branchId: 1 });
      mockPrisma.rawMaterialInventory.findUnique
        .mockResolvedValueOnce({ id: 1, quantity: 200 }) // harina
        .mockResolvedValueOnce({ id: 2, quantity: 50 });  // levadura
      mockPrisma.rawMaterialInventory.update.mockResolvedValue({});
      mockPrisma.inventory.upsert.mockResolvedValue({});
      mockPrisma.productionLog.create.mockResolvedValue({ id: 1 });
      mockPrisma.stockMovement.create.mockResolvedValue({});

      await service.registerProduction({ recipeId: 1, traysProduced: 1 }, 'user-1');

      // Verify materia prima was deducted
      expect(mockPrisma.rawMaterialInventory.update).toHaveBeenCalledTimes(2);
      // Harina: 200 - 50 = 150
      expect(mockPrisma.rawMaterialInventory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantity: 150 },
      });
      // Levadura: 50 - 2 = 48
      expect(mockPrisma.rawMaterialInventory.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { quantity: 48 },
      });
    });

    it('creates inventory upsert with correct unitsProduced', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(RECIPE_FRANCES);
      mockPrisma.user.findUnique.mockResolvedValue({ branchId: 1 });
      mockPrisma.rawMaterialInventory.findUnique
        .mockResolvedValueOnce({ id: 1, quantity: 200 })
        .mockResolvedValueOnce({ id: 2, quantity: 50 });
      mockPrisma.rawMaterialInventory.update.mockResolvedValue({});
      mockPrisma.inventory.upsert.mockResolvedValue({});
      mockPrisma.productionLog.create.mockResolvedValue({ id: 1 });
      mockPrisma.stockMovement.create.mockResolvedValue({});

      await service.registerProduction({ recipeId: 1, traysProduced: 10 }, 'user-1');

      // 10 latas × 36 = 360 unidades
      expect(mockPrisma.inventory.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId_branchId: { productId: 10, branchId: 1 } },
          update: { quantity: { increment: 360 } },
          create: { productId: 10, branchId: 1, quantity: 360 },
        }),
      );
    });

    it('creates a StockMovement of type PRODUCCION linked to the log', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(RECIPE_FRANCES);
      mockPrisma.user.findUnique.mockResolvedValue({ branchId: 1 });
      mockPrisma.rawMaterialInventory.findUnique
        .mockResolvedValueOnce({ id: 1, quantity: 200 })
        .mockResolvedValueOnce({ id: 2, quantity: 50 });
      mockPrisma.rawMaterialInventory.update.mockResolvedValue({});
      mockPrisma.inventory.upsert.mockResolvedValue({});
      mockPrisma.productionLog.create.mockResolvedValue({ id: 42 });
      mockPrisma.stockMovement.create.mockResolvedValue({});

      await service.registerProduction({ recipeId: 1, traysProduced: 5 }, 'user-1');

      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: 10,
          toBranchId: 1,
          type: 'PRODUCCION',
          quantity: 5 * 36, // 180
          productionLogId: 42,
          userId: 'user-1',
        }),
      });
    });

    it('uses $transaction with Serializable isolation level', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(RECIPE_FRANCES);
      mockPrisma.user.findUnique.mockResolvedValue({ branchId: 1 });
      mockPrisma.rawMaterialInventory.findUnique
        .mockResolvedValueOnce({ id: 1, quantity: 200 })
        .mockResolvedValueOnce({ id: 2, quantity: 50 });
      mockPrisma.rawMaterialInventory.update.mockResolvedValue({});
      mockPrisma.inventory.upsert.mockResolvedValue({});
      mockPrisma.productionLog.create.mockResolvedValue({ id: 1 });
      mockPrisma.stockMovement.create.mockResolvedValue({});

      await service.registerProduction({ recipeId: 1, traysProduced: 1 }, 'user-1');

      // Verify $transaction was called with Serializable isolation
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: 'Serializable',
          timeout: 10000,
          maxWait: 5000,
        }),
      );
    });

    it('uses branchId from DTO when provided instead of user branch', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(RECIPE_FRANCES);
      // User has branch 1, but DTO says branch 2
      mockPrisma.rawMaterialInventory.findUnique
        .mockResolvedValueOnce({ id: 1, quantity: 200 })
        .mockResolvedValueOnce({ id: 2, quantity: 50 });
      mockPrisma.rawMaterialInventory.update.mockResolvedValue({});
      mockPrisma.inventory.upsert.mockResolvedValue({});
      mockPrisma.productionLog.create.mockResolvedValue({ id: 1 });
      mockPrisma.stockMovement.create.mockResolvedValue({});

      await service.registerProduction(
        { recipeId: 1, traysProduced: 1, branchId: 2 },
        'user-1',
      );

      // Should NOT call getUserBranch since branchId was provided
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns a meaningful response with production details', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(RECIPE_FRANCES);
      mockPrisma.user.findUnique.mockResolvedValue({ branchId: 1 });
      mockPrisma.rawMaterialInventory.findUnique
        .mockResolvedValueOnce({ id: 1, quantity: 200 })
        .mockResolvedValueOnce({ id: 2, quantity: 50 });
      mockPrisma.rawMaterialInventory.update.mockResolvedValue({});
      mockPrisma.inventory.upsert.mockResolvedValue({});
      mockPrisma.productionLog.create.mockResolvedValue({ id: 99 });
      mockPrisma.stockMovement.create.mockResolvedValue({});

      const result = await service.registerProduction(
        { recipeId: 1, traysProduced: 33 },
        'user-1',
      );

      expect(result).toEqual({
        id: 99,
        recipeName: 'Amasijo Estándar de Francés',
        productName: 'Pan Francés',
        traysProduced: 33,
        unitsProduced: 1188,
        message: expect.stringContaining('1,188'),
      });
    });
  });

  describe('getTodayProduction', () => {
    it('queries production logs from start of today', async () => {
      mockPrisma.productionLog.findMany.mockResolvedValue([]);

      await service.getTodayProduction(1);

      expect(mockPrisma.productionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({ gte: expect.any(Date) }),
            branchId: 1,
          }),
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('getHistory', () => {
    it('queries production logs with date range filter', async () => {
      mockPrisma.productionLog.findMany.mockResolvedValue([]);

      await service.getHistory('2026-01-01', '2026-01-31', 1);

      expect(mockPrisma.productionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
            branchId: 1,
          }),
          take: 100,
        }),
      );
    });

    it('queries without date filter when not provided', async () => {
      mockPrisma.productionLog.findMany.mockResolvedValue([]);

      await service.getHistory(undefined, undefined, undefined);

      expect(mockPrisma.productionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });
});
