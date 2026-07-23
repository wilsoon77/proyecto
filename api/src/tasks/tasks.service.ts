import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditService } from '../audit/audit.service.js';
import { assertOrderTransition } from '../orders/order-state.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Tareas programadas del sistema.
 *
 * La expiracion de una reserva vuelve a verificar el estado dentro de una
 * transaccion serializable: un pedido confirmado en paralelo nunca libera
 * inventario ni regresa a CANCELLED por error.
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly RESERVATION_EXPIRY_HOURS = 2;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async expireStaleReservations() {
    const cutoff = new Date(Date.now() - this.RESERVATION_EXPIRY_HOURS * 60 * 60 * 1000);
    const staleOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        createdAt: { lt: cutoff },
      },
      select: { id: true, orderNumber: true },
    });

    if (staleOrders.length === 0) return;

    this.logger.log(`[Expiration] ${staleOrders.length} expired reservations found.`);
    let cancelled = 0;
    let errors = 0;

    for (const candidate of staleOrders) {
      try {
        const cancelledOrder = await this.withSerializableRetry(() => this.prisma.$transaction(async (tx) => {
          const current = await tx.order.findUnique({
            where: { id: candidate.id },
            include: { items: true },
          });

          // It may have been confirmed after the initial scan; that is normal.
          if (!current || current.status !== OrderStatus.PENDING || current.createdAt >= cutoff) return null;
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
            if (!inventory || inventory.reserved < item.quantity) {
              throw new Error(`Reserved inventory is inconsistent for order ${current.id}`);
            }
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { reserved: { decrement: item.quantity } },
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
          userName: 'Sistema (Auto-Expiracion)',
          action: 'UPDATE',
          entity: 'Order',
          entityId: String(cancelledOrder.id),
          entityName: cancelledOrder.orderNumber,
          details: {
            action: 'AUTO_EXPIRE',
            previousStatus: OrderStatus.PENDING,
            newStatus: OrderStatus.CANCELLED,
            reason: `Reserva expirada (${this.RESERVATION_EXPIRY_HOURS}h sin confirmar)`,
            createdAt: cancelledOrder.createdAt.toISOString(),
          },
        });
        cancelled++;
      } catch (error) {
        errors++;
        this.logger.error(`[Expiration] Error cancelling order ${candidate.orderNumber}`, error as string);
      }
    }

    this.logger.log(`[Expiration] Result: ${cancelled} cancelled, ${errors} errors.`);
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
