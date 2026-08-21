import { BadRequestException } from '@nestjs/common';
import { InventoryLotSource, ProductOrigin } from '@prisma/client';
import { InventoryLotsService } from './inventory-lots.service.js';

function createTransactionMock() {
  return {
    product: {
      findUnique: jest.fn(),
    },
    inventoryLot: {
      create: jest.fn().mockResolvedValue({ id: 10 }),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    inventoryLotConsumption: {
      create: jest.fn(),
    },
    alertState: {
      updateMany: jest.fn(),
    },
  } as any;
}

describe('InventoryLotsService', () => {
  let service: InventoryLotsService;

  beforeEach(() => {
    service = new InventoryLotsService();
  });

  it('no solicita caducidad para un producto producido', async () => {
    const tx = createTransactionMock();
    tx.product.findUnique.mockResolvedValue({ origin: ProductOrigin.PRODUCIDO, tracksExpiration: true, expirationAlertDays: [3] });

    await service.createInboundLot(tx, {
      productId: 1,
      branchId: 2,
      quantity: 36,
      sourceType: InventoryLotSource.PRODUCCION,
    });

    expect(tx.inventoryLot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sourceType: InventoryLotSource.PRODUCCION,
        expiresAt: undefined,
        alertAt: undefined,
      }),
    });
  });

  it('ignora fechas de caducidad para productos producidos aunque el movimiento sea una compra', async () => {
    const tx = createTransactionMock();
    tx.product.findUnique.mockResolvedValue({ origin: ProductOrigin.PRODUCIDO, tracksExpiration: true, expirationAlertDays: [3] });

    await service.createInboundLot(tx, {
      productId: 1,
      branchId: 2,
      quantity: 12,
      sourceType: InventoryLotSource.COMPRA,
      expiresAt: '2026-08-20',
    });

    expect(tx.inventoryLot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ expiresAt: undefined, alertAt: undefined }),
    });
  });

  it('exige caducidad únicamente para compras de productos configurados', async () => {
    const tx = createTransactionMock();
    tx.product.findUnique.mockResolvedValue({ origin: ProductOrigin.COMPRADO, tracksExpiration: true, expirationAlertDays: [3] });

    await expect(service.createInboundLot(tx, {
      productId: 1,
      branchId: 2,
      quantity: 12,
      sourceType: InventoryLotSource.COMPRA,
    })).rejects.toThrow(BadRequestException);
  });

  it('calcula la fecha de alerta a partir de la caducidad de una compra', async () => {
    const tx = createTransactionMock();
    tx.product.findUnique.mockResolvedValue({ origin: ProductOrigin.COMPRADO, tracksExpiration: true, expirationAlertDays: [5] });

    await service.createInboundLot(tx, {
      productId: 1,
      branchId: 2,
      quantity: 12,
      sourceType: InventoryLotSource.COMPRA,
      expiresAt: '2026-08-20',
    });

    expect(tx.inventoryLot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        expiresAt: new Date('2026-08-20T00:00:00.000Z'),
        alertAt: new Date('2026-08-15T00:00:00.000Z'),
      }),
    });
  });

  it('conserva como alertAt la primera fecha cuando hay varios recordatorios', async () => {
    const tx = createTransactionMock();
    tx.product.findUnique.mockResolvedValue({ origin: ProductOrigin.COMPRADO, tracksExpiration: true, expirationAlertDays: [30, 15, 3] });

    await service.createInboundLot(tx, {
      productId: 1,
      branchId: 2,
      quantity: 12,
      sourceType: InventoryLotSource.COMPRA,
      expiresAt: '2026-09-01',
    });

    expect(tx.inventoryLot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        expiresAt: new Date('2026-09-01T00:00:00.000Z'),
        alertAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
    });
  });

  it('permite retirar un lote vencido cuando se registra una merma', async () => {
    const tx = createTransactionMock();
    tx.product.findUnique.mockResolvedValue({ origin: ProductOrigin.COMPRADO, tracksExpiration: true });
    tx.inventoryLot.findMany.mockResolvedValue([{
      id: 10,
      availableQuantity: 4,
      expiresAt: new Date('2026-08-01T00:00:00.000Z'),
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
    }]);

    await service.consumeLots(tx, {
      productId: 1,
      branchId: 2,
      quantity: 2,
      stockMovementId: 99,
      allowExpired: true,
    });

    expect(tx.inventoryLot.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { availableQuantity: { decrement: 2 } },
    });
    expect(tx.inventoryLotConsumption.create).toHaveBeenCalledWith({
      data: { lotId: 10, stockMovementId: 99, quantity: 2 },
    });
  });

  it('rechaza vender unidades cuando solo existen lotes vencidos', async () => {
    const tx = createTransactionMock();
    tx.product.findUnique.mockResolvedValue({ origin: ProductOrigin.COMPRADO, tracksExpiration: true });
    tx.inventoryLot.findMany
      .mockResolvedValueOnce([]) // lotes vigentes
      .mockResolvedValueOnce([]); // lotes sin fecha

    await expect(service.consumeLots(tx, {
      productId: 1,
      branchId: 2,
      quantity: 1,
      stockMovementId: 100,
    })).rejects.toThrow('No hay suficientes unidades vigentes');
    expect(tx.inventoryLot.update).not.toHaveBeenCalled();
    expect(tx.inventoryLotConsumption.create).not.toHaveBeenCalled();
  });

  it('calcula el stock vendible ignorando lotes vencidos', async () => {
    const tx = createTransactionMock();
    tx.product.findUnique.mockResolvedValue({ origin: ProductOrigin.COMPRADO, tracksExpiration: true });
    tx.inventoryLot.findMany.mockResolvedValue([
      { availableQuantity: 5 },
      { availableQuantity: 2 },
    ]);

    await expect(service.getSellableQuantity(tx, 1, 2)).resolves.toBe(7);
    expect(tx.inventoryLot.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        productId: 1,
        branchId: 2,
        OR: expect.any(Array),
      }),
    }));
  });
});
