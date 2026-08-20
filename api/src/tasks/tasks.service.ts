import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditService } from '../audit/audit.service.js';
import { assertOrderTransition } from '../orders/order-state.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Limpieza de reservas que nunca fueron confirmadas.
 *
 * Esta tarea no aplica una fecha límite de retiro: solo libera inventario de
 * pedidos que permanecen PENDING durante el tiempo configurado. Los pedidos
 * CONFIRMED, PREPARING y READY no se modifican automáticamente.
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async expireStaleReservations() {
    const expiryHours = this.getReservationExpiryHours();
    const cutoff = new Date(Date.now() - expiryHours * 60 * 60 * 1000);
    const now = new Date();
    const staleOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        OR: [
          { expiresAt: { lte: now } },
          // Legacy rows without expiresAt remain covered during rollout.
          { expiresAt: null, createdAt: { lt: cutoff } },
        ],
      },
      select: { id: true, orderNumber: true, expiresAt: true },
    });

    if (staleOrders.length === 0) return;

    this.logger.log(`[Reservations] ${staleOrders.length} pending reservations to release.`);
    let cancelled = 0;
    let errors = 0;

    for (const candidate of staleOrders) {
      try {
        const cancelledOrder = await this.withSerializableRetry(() => this.prisma.$transaction(async (tx) => {
          const current = await tx.order.findUnique({
            where: { id: candidate.id },
            include: { items: true },
          });

          // It may have been confirmed after the initial scan; leave it alone.
          const expired = current?.expiresAt ? current.expiresAt <= now : Boolean(current && current.createdAt < cutoff);
          if (!current || current.status !== OrderStatus.PENDING || !expired) return null;
          if (!current.branchId) throw new Error(`Order ${current.id} has no branch`);

          assertOrderTransition(current.status, OrderStatus.CANCELLED);
          for (const item of current.items) {
            const inventory = await tx.inventory.findUnique({
              where: {
                productId_branchId: {
                  productId: item.productId,
                  branchId: current.branchId,
                },
              },
            });
            const reservedQuantity = item.stockQuantity ?? item.quantity;
            if (!inventory || inventory.reserved < reservedQuantity) {
              throw new Error(`Reserved inventory is inconsistent for order ${current.id}`);
            }
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { reserved: { decrement: reservedQuantity } },
            });
          }

          return tx.order.update({
            where: { id: current.id },
            data: { status: OrderStatus.CANCELLED },
          });
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        }));

        if (!cancelledOrder) continue;

        await this.auditService.log({
          userName: 'Sistema (Limpieza de reservas)',
          action: 'UPDATE',
          entity: 'Order',
          entityId: String(cancelledOrder.id),
          entityName: cancelledOrder.orderNumber,
          details: {
            action: 'AUTO_CANCEL_PENDING',
            previousStatus: OrderStatus.PENDING,
            newStatus: OrderStatus.CANCELLED,
            reason: `Reserva PENDING sin confirmar durante ${expiryHours} hora(s)`,
            createdAt: cancelledOrder.createdAt.toISOString(),
          },
        });
        cancelled++;
      } catch (error) {
        errors++;
        this.logger.error(`[Reservations] Error cancelling order ${candidate.orderNumber}`, error as string);
      }
    }

    this.logger.log(`[Reservations] Result: ${cancelled} cancelled, ${errors} errors.`);
  }

  /**
   * Inventory is intentionally kept as a fast aggregate while lots preserve
   * FEFO/expiration history. This check detects drift without inventing a new
   * user notification type; the actionable alerts remain the two agreed ones.
   */
  @Cron('0 30 3 * * *')
  async reconcileInventorySummaries() {
    const [inventories, lotTotals] = await Promise.all([
      this.prisma.inventory.findMany({
        select: {
          productId: true,
          branchId: true,
          quantity: true,
          reserved: true,
          product: { select: { name: true } },
          branch: { select: { name: true } },
        },
      }),
      this.prisma.inventoryLot.groupBy({
        by: ['productId', 'branchId'],
        _sum: { availableQuantity: true },
      }),
    ]);

    const totals = new Map(lotTotals.map((row) => [`${row.productId}:${row.branchId}`, row._sum.availableQuantity ?? 0]));
    let mismatches = 0;

    for (const inventory of inventories) {
      const key = `${inventory.productId}:${inventory.branchId}`;
      if (!totals.has(key)) continue; // Legacy aggregate without lot history.
      const lotQuantity = totals.get(key)!;
      if (lotQuantity === inventory.quantity) continue;

      mismatches++;
      const details = {
        productId: inventory.productId,
        productName: inventory.product.name,
        branchId: inventory.branchId,
        branchName: inventory.branch.name,
        aggregateQuantity: inventory.quantity,
        lotQuantity,
        reserved: inventory.reserved,
      };
      this.logger.error(`[Inventory] Aggregate/lot mismatch: ${JSON.stringify(details)}`);
      await this.auditService.log({
        userName: 'Sistema (Reconciliación de inventario)',
        action: 'RECONCILE',
        entity: 'Inventory',
        entityId: `${inventory.productId}:${inventory.branchId}`,
        entityName: `${inventory.product.name} · ${inventory.branch.name}`,
        details,
      });
    }

    this.logger.log(`[Inventory] Reconciliation complete: ${mismatches} mismatches.`);
    return { checked: inventories.length, mismatches };
  }

  /**
   * Keep operational/security history bounded without touching active data.
   * Retention can be tuned per deployment through the RETENTION_*_DAYS vars.
   */
  @Cron('0 0 4 * * *')
  async purgeExpiredData() {
    const now = new Date();
    const loginCutoff = this.daysAgo(this.retentionDays('LOGIN_ATTEMPTS', 90), now);
    const notificationCutoff = this.daysAgo(this.retentionDays('NOTIFICATIONS', 90), now);
    const refreshCutoff = this.daysAgo(this.retentionDays('REFRESH_TOKENS', 30), now);
    const telegramCutoff = this.daysAgo(this.retentionDays('TELEGRAM_UPDATES', 30), now);
    const auditCutoff = this.daysAgo(this.retentionDays('AUDIT_LOGS', 365), now);

    const [loginAttempts, notifications, refreshTokens, telegramUpdates, auditLogs] = await this.prisma.$transaction([
      this.prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: loginCutoff } } }),
      this.prisma.notification.deleteMany({ where: { createdAt: { lt: notificationCutoff } } }),
      this.prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: refreshCutoff } },
            { revokedAt: { lt: refreshCutoff } },
          ],
        },
      }),
      this.prisma.telegramUpdate.deleteMany({ where: { receivedAt: { lt: telegramCutoff } } }),
      this.prisma.auditLog.deleteMany({ where: { createdAt: { lt: auditCutoff } } }),
    ]);

    const result = {
      loginAttempts: loginAttempts.count,
      notifications: notifications.count,
      refreshTokens: refreshTokens.count,
      telegramUpdates: telegramUpdates.count,
      auditLogs: auditLogs.count,
    };
    this.logger.log(`[Retention] Purged historical rows: ${JSON.stringify(result)}`);
    return result;
  }

  private getReservationExpiryHours(): number {
    const configured = Number(process.env.ORDER_RESERVATION_EXPIRY_HOURS);
    return Number.isFinite(configured) && configured > 0 ? configured : 2;
  }

  private retentionDays(key: string, fallback: number): number {
    const configured = Number(process.env[`RETENTION_${key}_DAYS`]);
    return Number.isFinite(configured) && configured > 0 ? configured : fallback;
  }

  private daysAgo(days: number, from: Date): Date {
    return new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private async withSerializableRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        if (error?.code !== 'P2034' || attempt === maxRetries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }

    throw new Error('Unable to expire reservation consistently');
  }
}
