import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductionLogDto } from './dto/production.dto.js';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';

/**
 * ProductionService — Motor de producción del sistema PanaderIA.
 * 
 * Aplica: prisma-transactions-acid (ACID, isolation, retry)
 * Aplica: nestjs-service-layer (SRP, sin HTTP concerns)
 * 
 * La lógica de producción garantiza atomicidad:
 *   1. Validar receta y stock
 *   2. RESTAR materia prima de RawMaterialInventory
 *   3. SUMAR producto terminado a Inventory
 *   4. Crear ProductionLog + StockMovement
 * 
 * Si cualquier paso falla, TODO se revierte (rollback).
 */
@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Registrar un horneado (producción) de forma atómica.
   * 
   * Usa transacción interactiva con:
   * - Serializable isolation: previene race conditions si dos usuarios
   *   registran producción simultáneamente con la misma materia prima.
   * - Timeout configurado: 10s máximo para evitar locks prolongados.
   * - Retry automático: reintenta en caso de conflicto de serialización (P2034).
   */
  async registerProduction(dto: CreateProductionLogDto, userId: string) {
    // 1. Obtener receta con ingredientes y producto ANTES de la transacción
    //    (prisma-transactions-acid: fetch external data before starting transaction)
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: dto.recipeId },
      include: {
        product: true,
        ingredients: {
          include: { rawMaterial: true },
        },
      },
    });

    if (!recipe) throw new NotFoundException('Receta no encontrada');
    if (!recipe.isActive) throw new BadRequestException('Esta receta está desactivada');
    if (!recipe.product.unitsPerTray) {
      throw new BadRequestException(`El producto "${recipe.product.name}" no tiene configurado unitsPerTray`);
    }

    // Determinar sucursal ANTES de la transacción
    const branchId = dto.branchId || (await this.getUserBranch(userId));
    if (!branchId) throw new BadRequestException('No se pudo determinar la sucursal. Asigna una sucursal al usuario o envía branchId.');

    const traysProduced = dto.traysProduced;
    const unitsProduced = traysProduced * recipe.product.unitsPerTray;

    // 2-5. Transacción atómica con retry para conflictos de serialización
    const result = await this.executeWithRetry(() =>
      this.prisma.$transaction(async (tx) => {
        // 2. Restar materia prima del inventario de la sucursal
        for (const ingredient of recipe.ingredients) {
          // Leer el inventario actual dentro de la transacción
          // Con Serializable, esto bloquea la fila para prevenir lecturas fantasma
          const inv = await tx.rawMaterialInventory.findUnique({
            where: {
              rawMaterialId_branchId: {
                rawMaterialId: ingredient.rawMaterialId,
                branchId,
              },
            },
          });

          if (!inv) {
            throw new BadRequestException(
              `No hay inventario de "${ingredient.rawMaterial.name}" en esta sucursal`,
            );
          }

          const currentQty = Number(inv.quantity);
          const requiredQty = Number(ingredient.quantity);
          const newQty = currentQty - requiredQty;

          if (newQty < 0) {
            throw new BadRequestException(
              `Materia prima insuficiente: "${ingredient.rawMaterial.name}". ` +
              `Necesitas ${requiredQty} ${ingredient.rawMaterial.baseUnit}, ` +
              `solo hay ${currentQty} ${ingredient.rawMaterial.baseUnit}.`,
            );
          }

          // Usar tx (no prisma) — prisma-transactions-acid rule
          await tx.rawMaterialInventory.update({
            where: { id: inv.id },
            data: { quantity: newQty },
          });
        }

        // 3. Sumar producto terminado al inventario de la sucursal
        await tx.inventory.upsert({
          where: {
            productId_branchId: {
              productId: recipe.productId,
              branchId,
            },
          },
          update: {
            quantity: { increment: unitsProduced },
          },
          create: {
            productId: recipe.productId,
            branchId,
            quantity: unitsProduced,
          },
        });

        // 4. Crear ProductionLog
        const log = await tx.productionLog.create({
          data: {
            recipeId: recipe.id,
            branchId,
            userId,
            traysProduced,
            unitsProduced,
            note: dto.note,
          },
        });

        // 5. Crear StockMovement de tipo PRODUCCION
        await tx.stockMovement.create({
          data: {
            productId: recipe.productId,
            toBranchId: branchId,
            type: 'PRODUCCION',
            quantity: unitsProduced,
            productionLogId: log.id,
            userId,
            note: `Amasijo: ${recipe.name} — ${traysProduced} latas`,
          },
        });

        return log;
      }, {
        timeout: 10000,    // 10 segundos máximo para la transacción
        maxWait: 5000,     // 5 segundos para obtener conexión del pool
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }),
    );

    // Obtener información de la sucursal para las notificaciones
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    const branchName = branch?.name || 'Sucursal';

    // Verificar si las materias primas utilizadas quedaron bajas
    for (const ingredient of recipe.ingredients) {
      const currentInv = await this.prisma.rawMaterialInventory.findUnique({
        where: {
          rawMaterialId_branchId: {
            rawMaterialId: ingredient.rawMaterialId,
            branchId,
          },
        },
        include: { rawMaterial: true },
      });

      if (currentInv) {
        const currentQty = Number(currentInv.quantity);
        await this.notificationsService.sendLowStockIfNeeded({
          alertType: 'RAW_MATERIAL_LOW',
          branchId,
          resourceKey: `raw-material:${currentInv.rawMaterial.id}`,
          configKey: 'inventory.raw_material_low',
          currentValue: currentQty,
          threshold: currentInv.rawMaterial.minStock ? Number(currentInv.rawMaterial.minStock) : null,
          placeholders: {
            materialName: currentInv.rawMaterial.name,
            current: currentQty.toFixed(1),
            unit: currentInv.rawMaterial.baseUnit,
            branchName,
          },
          url: `/admin/inventario/materias-primas`,
        });
      }
    }

    // Enviar notificación de producción asignada (horneado completado)
    await this.notificationsService.sendByConfig('production.assigned', {
      recipeName: recipe.name,
      branchName,
      branchId,
    }, `/admin/produccion`);

    return {
      id: result.id,
      recipeName: recipe.name,
      productName: recipe.product.name,
      traysProduced,
      unitsProduced,
      message: `¡Amasijo registrado! Se agregaron ${unitsProduced.toLocaleString()} ${recipe.product.name} al inventario.`,
    };
  }

  /**
   * Obtener producción de HOY para una sucursal
   */
  async getTodayProduction(branchId?: number, userId?: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const where: any = {
      createdAt: { gte: startOfDay },
    };
    if (branchId) where.branchId = branchId;

    return this.prisma.productionLog.findMany({
      where,
      include: {
        recipe: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
        },
        user: { select: { firstName: true, lastName: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Historial de producción con filtros de fecha
   */
  async getHistory(from?: string, to?: string, branchId?: number) {
    const where: any = {};

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    if (branchId) where.branchId = branchId;

    return this.prisma.productionLog.findMany({
      where,
      include: {
        recipe: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
        user: { select: { firstName: true, lastName: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Retry wrapper para transacciones serializables.
   * Reintenta automáticamente en caso de P2034 (conflicto de serialización).
   * 
   * Aplica: prisma-transactions-acid (retry on serialization failure)
   */
  private async executeWithRetry<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        // P2034 = Transaction conflict / serialization failure
        const isSerializationError = error?.code === 'P2034';
        const isLastAttempt = attempt === maxRetries - 1;

        if (isSerializationError && !isLastAttempt) {
          // Backoff exponencial: 100ms, 200ms, 400ms...
          const delay = 100 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw new Error('Max transaction retries exceeded');
  }

  private async getUserBranch(userId: string): Promise<number | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { branchId: true },
    });
    return user?.branchId ?? null;
  }
}
