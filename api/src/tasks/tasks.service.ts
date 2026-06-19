import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';

/**
 * TasksService — Tareas programadas del sistema.
 * 
 * Incluye:
 * - Expiración automática de reservas web no confirmadas (cada 15 min)
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  /** Tiempo máximo (en horas) que una orden PENDING puede existir antes de auto-cancelarse */
  private readonly RESERVATION_EXPIRY_HOURS = 2;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Ejecuta cada 15 minutos: busca órdenes PENDING creadas hace más de X horas
   * y las cancela, liberando el stock reservado.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async expireStaleReservations() {
    const cutoff = new Date(Date.now() - this.RESERVATION_EXPIRY_HOURS * 60 * 60 * 1000);

    // Buscar órdenes PENDING más antiguas que el cutoff
    const staleOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoff },
      },
      include: { items: true },
    });

    if (staleOrders.length === 0) return;

    this.logger.log(`[Expiración] Encontradas ${staleOrders.length} reservas vencidas (> ${this.RESERVATION_EXPIRY_HOURS}h). Cancelando...`);

    let cancelled = 0;
    let errors = 0;

    for (const order of staleOrders) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Liberar stock reservado de cada item
          for (const item of (order as any).items) {
            if (!order.branchId) continue;
            const inv = await tx.inventory.findUnique({
              where: { productId_branchId: { productId: item.productId, branchId: order.branchId } },
            });
            if (inv && inv.reserved >= item.quantity) {
              await tx.inventory.update({
                where: { id: inv.id },
                data: { reserved: { decrement: item.quantity } },
              });
            }
          }
          // Marcar como cancelada
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'CANCELLED' },
          });
        });

        // Registrar en auditoría
        await this.auditService.log({
          userName: 'Sistema (Auto-Expiración)',
          action: 'UPDATE',
          entity: 'Order',
          entityId: String(order.id),
          entityName: order.orderNumber,
          details: {
            action: 'AUTO_EXPIRE',
            previousStatus: 'PENDING',
            newStatus: 'CANCELLED',
            reason: `Reserva expirada (${this.RESERVATION_EXPIRY_HOURS}h sin confirmar)`,
            createdAt: order.createdAt.toISOString(),
          },
        });

        cancelled++;
      } catch (err) {
        errors++;
        this.logger.error(`[Expiración] Error cancelando orden ${order.orderNumber}:`, err);
      }
    }

    this.logger.log(`[Expiración] Resultado: ${cancelled} canceladas, ${errors} errores.`);
  }
}
