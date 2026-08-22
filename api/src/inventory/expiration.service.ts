import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ProductOrigin } from '@prisma/client';
import { addDays, dateKeyToUtcDate, todayBusinessDate } from '../common/time/business-date.js';
import { isCustomExpirationAlert, normalizeExpirationAlertDays } from './expiration-alerts.js';

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
      const hasCustomAlert = isCustomExpirationAlert(lot.expiresAt, lot.alertAt, reminderDays);

      // alertAt puede ser la fecha de referencia calculada al crear el lote.
      // Solo una fecha distinta a esa referencia reemplaza los recordatorios del producto.
      if (hasCustomAlert && lot.alertAt) {
        const customAlertKey = lot.alertAt.toISOString().slice(0, 10);
        const customAlertAt = dateKeyToUtcDate(customAlertKey);
        if (today.getTime() >= customAlertAt.getTime()) {
          const daysBefore = Math.max(0, Math.round((expiresAt.getTime() - customAlertAt.getTime()) / 86_400_000));
          const notified = await this.notifications.sendExpirationIfNeeded({
            branchId: lot.branchId,
            resourceKey: `lot:${lot.id}:custom`,
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
      } else {
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
    }

    const result = { scanned: lots.length, warningCount, expiredCount, checkedAt: new Date().toISOString() };
    this.logger.log(`[Caducidad] ${result.scanned} lotes revisados, ${warningCount} avisos, ${expiredCount} vencidos`);
    return result;
  }
}
