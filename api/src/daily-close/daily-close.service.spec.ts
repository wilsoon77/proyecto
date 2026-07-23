import { BadRequestException } from '@nestjs/common';
import { DailyCloseService } from './daily-close.service.js';

function createMockPrisma() {
  const mock: any = {
    dailyClose: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 41 }),
    },
    product: {
      findMany: jest.fn(),
    },
    inventory: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
    },
    stockMovement: {
      create: jest.fn().mockResolvedValue({}),
    },
    dailyCloseItem: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn((operation: any) => {
      if (Array.isArray(operation)) return Promise.all(operation);
      return operation(mock);
    }),
  };
  return mock;
}

function currentBusinessDate() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Guatemala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

describe('DailyCloseService', () => {
  let service: DailyCloseService;
  let prisma: ReturnType<typeof createMockPrisma>;

  const closeDate = currentBusinessDate();
  const baseDto = {
    closeDate,
    snapshotAt: new Date(Date.now() - 60_000).toISOString(),
    items: [{ productId: 10, countedQty: 80, wasteQty: 5 }],
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new DailyCloseService(prisma);
    prisma.product.findMany.mockResolvedValue([{ id: 10, name: 'Pan francés' }]);
    prisma.inventory.findMany.mockResolvedValue([{
      id: 7,
      productId: 10,
      quantity: 100,
      reserved: 10,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);
  });

  it('calcula ventas no registradas, merma y actualiza el stock físico', async () => {
    const result = await service.create(baseDto as any, 1, 'user-1');

    expect(result.summary).toEqual({
      totalSold: 15,
      totalWaste: 5,
      totalSurplus: 0,
      productsClosed: 1,
    });
    expect(prisma.inventory.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { quantity: 80 },
    });
    expect(prisma.stockMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: 10,
        type: 'VENTA',
        quantity: 15,
        dailyCloseId: 41,
      }),
    });
    expect(prisma.stockMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: 10,
        type: 'MERMA',
        quantity: 5,
        dailyCloseId: 41,
      }),
    });
  });

  it('registra sobrante cuando el conteo supera el sistema después de la merma', async () => {
    prisma.inventory.findMany.mockResolvedValue([{
      id: 8,
      productId: 10,
      quantity: 10,
      reserved: 0,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);

    const result = await service.create({
      ...baseDto,
      items: [{ productId: 10, countedQty: 12, wasteQty: 1 }],
    } as any, 1, 'user-1');

    expect(result.summary.totalSurplus).toBe(3);
    expect(prisma.stockMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'SOBRANTE', quantity: 3 }),
    });
    expect(prisma.stockMovement.create).not.toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'VENTA' }),
    });
  });

  it('rechaza un conteo menor que las unidades reservadas', async () => {
    prisma.inventory.findMany.mockResolvedValue([{
      id: 7,
      productId: 10,
      quantity: 10,
      reserved: 5,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }]);

    await expect(service.create({
      ...baseDto,
      items: [{ productId: 10, countedQty: 4, wasteQty: 0 }],
    } as any, 1, 'user-1')).rejects.toThrow(BadRequestException);
    expect(prisma.stockMovement.create).not.toHaveBeenCalled();
  });

  it('rechaza productos duplicados antes de abrir la transacción', async () => {
    await expect(service.create({
      ...baseDto,
      items: [
        { productId: 10, countedQty: 80, wasteQty: 0 },
        { productId: 10, countedQty: 80, wasteQty: 0 },
      ],
    } as any, 1, 'user-1')).rejects.toThrow('No se puede repetir un producto');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
