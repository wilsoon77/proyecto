import { AssistantReadService } from './assistant-read.service.js';
import { addDays, todayBusinessDate } from '../common/time/business-date.js';

describe('AssistantReadService', () => {
  const context = {
    userId: 'owner-1',
    role: 'MANAGER' as const,
    firstName: 'Dueña',
    branches: [
      { id: 1, name: 'Sucursal Central', slug: 'central' },
      { id: 2, name: 'Sucursal Norte', slug: 'norte' },
    ],
    branchIds: [1, 2],
    timezone: 'America/Guatemala',
  };

  it('encuentra una materia prima aunque la consulta cambie acentos o mayúsculas', async () => {
    const prisma = {
      rawMaterial: {
        findMany: jest.fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([{ id: 7, name: 'Azúcar', baseUnit: 'LB', minStock: 5 }]),
      },
      rawMaterialInventory: {
        findMany: jest.fn().mockResolvedValue([{
          rawMaterial: { id: 7, name: 'Azúcar', baseUnit: 'LB', minStock: 5 },
          branch: { id: 2, name: 'Sucursal Norte' },
          quantity: 18,
          updatedAt: new Date('2026-08-20T12:00:00Z'),
        }]),
      },
    };
    const service = new AssistantReadService(prisma as never);

    const result = await service.rawMaterialInventory(context, { materialQuery: 'azucar', branch: 'sucursal norte' });

    expect(result.items).toEqual([expect.objectContaining({ materialName: 'Azúcar', quantity: 18, branchName: 'Sucursal Norte' })]);
  });

  it('reporta disponible vendible separado de unidades vencidas', async () => {
    const prisma = {
      product: {
        findMany: jest.fn().mockResolvedValue([{ id: 4, name: 'Galletas', slug: 'galletas', isActive: false, stockUnitLabel: 'paquetes' }]),
      },
      inventory: {
        findMany: jest.fn().mockResolvedValue([{
          product: { id: 4, name: 'Galletas', slug: 'galletas', isActive: false, stockUnitLabel: 'paquetes' },
          branch: { id: 1, name: 'Sucursal Central' },
          quantity: 10,
          reserved: 1,
          updatedAt: new Date('2026-08-20T12:00:00Z'),
        }]),
      },
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue([{ productId: 4, branchId: 1, availableQuantity: 4 }]),
      },
    };
    const service = new AssistantReadService(prisma as never);

    const result = await service.productInventory(context, { productQuery: 'galletas', branch: 'central' });

    expect(result.items[0]).toEqual(expect.objectContaining({
      quantity: 10,
      reserved: 1,
      expiredQuantity: 4,
      available: 5,
      stockUnitLabel: 'paquetes',
    }));
  });

  it('agrega producción por rango, sucursal y producto', async () => {
    const prisma = {
      productionLog: {
        findMany: jest.fn().mockResolvedValue([
          {
            traysProduced: 2,
            unitsProduced: 72,
            createdAt: new Date('2026-08-10T15:00:00Z'),
            branch: { id: 1, name: 'Sucursal Central' },
            recipe: { name: 'Pan francés', product: { name: 'Pan francés' } },
          },
          {
            traysProduced: 1,
            unitsProduced: 36,
            createdAt: new Date('2026-08-11T15:00:00Z'),
            branch: { id: 1, name: 'Sucursal Central' },
            recipe: { name: 'Pan dulce', product: { name: 'Pan dulce' } },
          },
        ]),
      },
    };
    const service = new AssistantReadService(prisma as never);

    const result = await service.productionSummary(context, { fromDate: '2026-08-10', toDate: '2026-08-11' });

    expect(result).toEqual(expect.objectContaining({ totalUnits: 108, totalTrays: 3, totalRecords: 2 }));
    expect(result.byBranch[0]).toEqual(expect.objectContaining({ branchName: 'Sucursal Central', unitsProduced: 108 }));
    expect(result.byProduct).toHaveLength(2);
  });

  it('consulta lotes próximos a vencer dentro del rango solicitado', async () => {
    const today = todayBusinessDate();
    const expirationDate = addDays(today, 5);
    const prisma = {
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue([{
          id: 9,
          availableQuantity: 12,
          expiresAt: new Date(`${expirationDate}T00:00:00Z`),
          product: { id: 8, name: 'Jugo de naranja', slug: 'jugo-naranja' },
          branch: { id: 2, name: 'Sucursal Norte' },
        }]),
      },
    };
    const service = new AssistantReadService(prisma as never);

    const result = await service.expirationSummary(context, {
      fromDate: today,
      toDate: addDays(today, 10),
      branch: 'norte',
    });

    expect(result.items).toEqual([expect.objectContaining({
      productName: 'Jugo de naranja',
      branchName: 'Sucursal Norte',
      quantity: 12,
      expiresAt: expirationDate,
      status: 'EXPIRING_SOON',
    })]);
  });
});
