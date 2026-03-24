import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductionLogDto } from './dto/production.dto.js';

@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registrar un horneado (producción).
   * 
   * Transacción atómica:
   * 1. Validar receta y producto
   * 2. Restar materia prima de RawMaterialInventory
   * 3. Sumar producto terminado a Inventory
   * 4. Crear StockMovement de tipo PRODUCCION
   * 5. Crear ProductionLog
   */
  async registerProduction(dto: CreateProductionLogDto, userId: string) {
    // 1. Obtener receta con ingredientes y producto
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

    // Determinar sucursal
    const branchId = dto.branchId || (await this.getUserBranch(userId));
    if (!branchId) throw new BadRequestException('No se pudo determinar la sucursal. Asigna una sucursal al usuario o envía branchId.');

    const traysProduced = dto.traysProduced;
    const unitsProduced = traysProduced * recipe.product.unitsPerTray;

    // 2-5. Transacción atómica
    const result = await this.prisma.$transaction(async (tx) => {
      // 2. Restar materia prima del inventario de la sucursal
      for (const ingredient of recipe.ingredients) {
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

        const newQty = Number(inv.quantity) - Number(ingredient.quantity);
        if (newQty < 0) {
          throw new BadRequestException(
            `Materia prima insuficiente: "${ingredient.rawMaterial.name}". ` +
            `Necesitas ${ingredient.quantity} ${ingredient.rawMaterial.baseUnit}, ` +
            `solo hay ${inv.quantity} ${ingredient.rawMaterial.baseUnit}.`,
          );
        }

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
    });

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
   * Obtener producción de HOY para una sucursal/usuario
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

  private async getUserBranch(userId: string): Promise<number | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { branchId: true },
    });
    return user?.branchId ?? null;
  }
}
