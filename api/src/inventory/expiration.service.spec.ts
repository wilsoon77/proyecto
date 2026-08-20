import { ProductOrigin } from '@prisma/client';
import { ExpirationService } from './expiration.service.js';
import { addDays, dateKeyToUtcDate, todayBusinessDate } from '../common/time/business-date.js';

describe('ExpirationService', () => {
  it('envía una alerta por cada recordatorio vencido y no repite las futuras', async () => {
    const expiryKey = addDays(todayBusinessDate(), 10);
    const prisma = {
      inventoryLot: {
        findMany: jest.fn().mockResolvedValue([{
          id: 12,
          branchId: 2,
          availableQuantity: 20,
          expiresAt: dateKeyToUtcDate(expiryKey),
          createdAt: new Date(),
          product: {
            id: 4,
            name: 'Jugo',
            slug: 'jugo',
            origin: ProductOrigin.COMPRADO,
            expirationAlertDays: [30, 15, 3],
          },
          branch: { id: 2, name: 'Norte', slug: 'norte' },
        }]),
      },
    };
    const notifications = {
      sendExpirationIfNeeded: jest.fn().mockResolvedValue(true),
      resolveExpirationAlertsForLot: jest.fn(),
    };
    const service = new ExpirationService(prisma as never, notifications as never);

    const result = await service.scanAndNotify();

    expect(result.warningCount).toBe(2);
    expect(notifications.sendExpirationIfNeeded).toHaveBeenCalledTimes(2);
    expect(notifications.sendExpirationIfNeeded).toHaveBeenCalledWith(expect.objectContaining({ resourceKey: 'lot:12:warning:30' }));
    expect(notifications.sendExpirationIfNeeded).toHaveBeenCalledWith(expect.objectContaining({ resourceKey: 'lot:12:warning:15' }));
    expect(notifications.sendExpirationIfNeeded).not.toHaveBeenCalledWith(expect.objectContaining({ resourceKey: 'lot:12:warning:3' }));
  });
});
