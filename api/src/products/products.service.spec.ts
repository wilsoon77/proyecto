import { ProductOrigin } from '@prisma/client';
import { ProductsService } from './products.service.js';

describe('ProductsService availability', () => {
  it('no publica como vendible la existencia de lotes vencidos', async () => {
    const product = {
      id: 1,
      sku: 'JUGO-1',
      name: 'Jugo',
      slug: 'jugo',
      description: null,
      basePrice: 5,
      categoryId: 1,
      category: { id: 1, name: 'Bebidas', slug: 'bebidas', isActive: true },
      images: [],
      presentations: [],
      origin: ProductOrigin.COMPRADO,
      tracksExpiration: true,
      expirationAlertDays: [3],
      isNew: false,
      isActive: true,
      isAvailable: true,
      comboQuantity: null,
      comboPrice: null,
      unitsPerTray: null,
      stockUnitLabel: 'unidades',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const prisma = {
      product: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([product]),
      },
      inventory: {
        findMany: jest.fn().mockResolvedValue([
          { productId: 1, branchId: 2, quantity: 10, reserved: 1 },
        ]),
      },
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue([
          { productId: 1, branchId: 2, availableQuantity: 6, expiresAt: new Date('2020-01-01T00:00:00.000Z') },
          { productId: 1, branchId: 2, availableQuantity: 4, expiresAt: new Date('2099-01-01T00:00:00.000Z') },
        ]),
      },
      $transaction: jest.fn().mockImplementation((operations: Promise<unknown>[]) => Promise.all(operations)),
    };
    const service = new ProductsService(prisma as never);

    const result = await service.findAll({ page: 1, pageSize: 10 });

    expect(result.data[0].available).toBe(3);
  });
});
