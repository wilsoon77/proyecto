import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';

describe('OrdersService purchase availability', () => {
  const systemConfig = {
    getBool: jest.fn(),
    getNumber: jest.fn(),
  };

  let service: OrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrdersService({} as any, {} as any, systemConfig as any, {} as any);
  });

  it('rejects reservations while the public site is in catalog-only mode', async () => {
    systemConfig.getBool.mockImplementation(async (key: string) => {
      if (key === 'operations.maintenance_mode') return false;
      if (key === 'orders.accept_orders') return true;
      if (key === 'orders.catalog_only') return true;
      return false;
    });

    await expect(service.reserve({} as any)).rejects.toThrow(
      new BadRequestException('La tienda está en modo catálogo. Las compras están deshabilitadas en este momento.'),
    );
    expect(systemConfig.getBool).toHaveBeenCalledWith('orders.catalog_only');
  });

  it('does not consult catalog-only mode when accepting orders is already disabled', async () => {
    systemConfig.getBool.mockImplementation(async (key: string) => {
      if (key === 'operations.maintenance_mode') return false;
      if (key === 'orders.accept_orders') return false;
      return false;
    });

    await expect(service.reserve({} as any)).rejects.toThrow(
      new BadRequestException('La tienda no está aceptando pedidos en línea en este momento.'),
    );
    expect(systemConfig.getBool).not.toHaveBeenCalledWith('orders.catalog_only');
  });
});
