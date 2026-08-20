import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ProductOrigin } from '@prisma/client';
import { addDays, dateKeyToUtcDate, todayBusinessDate } from '../common/time/business-date.js';

const DEFAULT_EXPIRATION_ALERT_DAYS = [3] as const;

function normalizeExpirationAlertDays(value: unknown): number[] {
  const values = Array.isArray(value)
    ? value
    : value === undefined || value === null
      ? [...DEFAULT_EXPIRATION_ALERT_DAYS]
      : [value];
  const normalized = [...new Set(values
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 3650))];
  return normalized.length > 0
    ? normalized.sort((a, b) => b - a)
    : [...DEFAULT_EXPIRATION_ALERT_DAYS];
}

@Injectable()
export class ExpirationService {
  private readonly logger = new Logger(ExpirationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async scanAndNotify(branchId?: number) {
    const todayKey = todayBusinessDate();
    const today = dateKeyToUtcDate(todayKey);
    const lots = await this.prisma.inventoryLot.findMany({
      where: {
        availableQuantity: { gt: 0 },
        ...(branchId ? { branchId } : {}),
        product: { origin: ProductOrigin.COMPRADO, tracksExpiration: true },
        expiresAt: { not: null },
      },
      include: {
        product: { select: { id: true, name: true, slug: true, expirationAlertDays: true } },
        branch: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }],
    });

    let warningCount = 0;
    let expiredCount = 0;
    for (const lot of lots) {
      if (!lot.expiresAt) continue;
      const expiresAt = dateKeyToUtcDate(lot.expiresAt.toISOString().slice(0, 10));
      const expiresAtKey = lot.expiresAt.toISOString().slice(0, 10);
      const daysLeft = Math.round((expiresAt.getTime() - today.getTime()) / 86_400_000);
      const isExpired = expiresAt.getTime() < today.getTime();
      if (isExpired) {
        // Los vencidos siguen visibles en Inventario, pero la alerta automática
        // solicitada por el cliente es únicamente la de próxima caducidad.
        expiredCount += 1;
        await this.notifications.resolveExpirationAlertsForLot(lot.branchId, lot.id);
        continue;
      }

      const reminderDays = normalizeExpirationAlertDays(lot.product.expirationAlertDays);
      for (const daysBefore of reminderDays) {
        const reminderKey = addDays(expiresAtKey, -daysBefore);
        const reminderAt = dateKeyToUtcDate(reminderKey);
        if (today.getTime() < reminderAt.getTime()) continue;

        const notified = await this.notifications.sendExpirationIfNeeded({
          branchId: lot.branchId,
          resourceKey: `lot:${lot.id}:warning:${daysBefore}`,
          configKey: 'inventory.expiration_warning',
          placeholders: {
            productName: lot.product.name,
            quantity: lot.availableQuantity,
            expiresAt: expiresAtKey,
            daysLeft: Math.max(0, daysLeft),
            daysBefore,
            branchName: lot.branch.name,
            branchId: lot.branchId,
          },
          url: `/admin/inventario/caducidades?lote=${lot.id}`,
        });

        if (notified) {
          warningCount += 1;
        }
      }
    }

    const result = { scanned: lots.length, warningCount, expiredCount, checkedAt: new Date().toISOString() };
    this.logger.log(`[Caducidad] ${result.scanned} lotes revisados, ${warningCount} avisos, ${expiredCount} vencidos`);
    return result;
  }
}
