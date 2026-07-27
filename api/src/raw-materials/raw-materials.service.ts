import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRawMaterialDto, UpdateRawMaterialDto, PurchaseRawMaterialDto } from './dto/raw-material.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';

// Tabla de conversión: unidad de compra → multiplicador a unidad base
const UNIT_CONVERSION: Record<string, number> = {
  // Sólidos → LB
  QUINTAL: 100,
  ARROBA: 25,
  LIBRA: 1,
  // Líquidos → ML
  LITRO: 1000,
  GALON: 3785,
  // Discretos → UNIT
  CARTON: 30,
  UNIDAD: 1,
};

@Injectable()
export class RawMaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(activeOnly = true) {
    return this.prisma.rawMaterial.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const material = await this.prisma.rawMaterial.findUnique({ where: { id } });
    if (!material) throw new NotFoundException(`Materia prima con ID ${id} no encontrada`);
    return material;
  }

  async create(dto: CreateRawMaterialDto) {
    return this.prisma.rawMaterial.create({
      data: {
        name: dto.name,
        baseUnit: dto.baseUnit,
        costPerUnit: dto.costPerUnit,
        minStock: dto.minStock,
      },
    });
  }

  async update(id: number, dto: UpdateRawMaterialDto) {
    await this.findOne(id);
    return this.prisma.rawMaterial.update({
      where: { id },
      data: {
        name: dto.name,
        costPerUnit: dto.costPerUnit,
        minStock: dto.minStock,
        isActive: dto.isActive,
      },
    });
  }

  /**
   * Obtener inventario de materia prima por sucursal
   */
  async getInventory(branchId?: number) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    const inventory = await this.prisma.rawMaterialInventory.findMany({
      where,
      include: {
        rawMaterial: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { rawMaterial: { name: 'asc' } },
    });

    return inventory.map(inv => ({
      id: inv.id,
      rawMaterial: {
        id: inv.rawMaterial.id,
        name: inv.rawMaterial.name,
        baseUnit: inv.rawMaterial.baseUnit,
        minStock: inv.rawMaterial.minStock,
      },
      branch: inv.branch,
      quantity: inv.quantity,
      isLow: inv.rawMaterial.minStock ? Number(inv.quantity) <= Number(inv.rawMaterial.minStock) : false,
    }));
  }

  /**
   * Registrar una compra de materia prima.
   * Convierte la unidad de compra a unidad base y suma al inventario.
   */
  async registerPurchase(dto: PurchaseRawMaterialDto, userId?: string) {
    const material = await this.findOne(dto.rawMaterialId);

    const multiplier = UNIT_CONVERSION[dto.unitOfPurchase];
    if (!multiplier) {
      throw new BadRequestException(`Unidad de compra "${dto.unitOfPurchase}" no reconocida`);
    }

    const baseQuantity = dto.purchaseQuantity * multiplier;

    // Upsert: crear o actualizar inventario
    await this.prisma.rawMaterialInventory.upsert({
      where: {
        rawMaterialId_branchId: {
          rawMaterialId: dto.rawMaterialId,
          branchId: dto.branchId,
        },
      },
      update: {
        quantity: { increment: baseQuantity },
      },
      create: {
        rawMaterialId: dto.rawMaterialId,
        branchId: dto.branchId,
        quantity: baseQuantity,
      },
    });

    const current = await this.prisma.rawMaterialInventory.findUnique({
      where: {
        rawMaterialId_branchId: {
          rawMaterialId: dto.rawMaterialId,
          branchId: dto.branchId,
        },
      },
    });
    if (current) {
      await this.notificationsService.sendLowStockIfNeeded({
        alertType: 'RAW_MATERIAL_LOW',
        branchId: dto.branchId,
        resourceKey: `raw-material:${dto.rawMaterialId}`,
        configKey: 'inventory.raw_material_low',
        currentValue: Number(current.quantity),
        threshold: material.minStock ? Number(material.minStock) : null,
        placeholders: {
          materialName: material.name,
          current: Number(current.quantity).toFixed(1),
          unit: material.baseUnit,
          branchName: (await this.prisma.branch.findUnique({ where: { id: dto.branchId }, select: { name: true } }))?.name || 'Sucursal',
        },
        url: '/admin/inventario/materias-primas',
      });
    }

    return {
      rawMaterial: material.name,
      purchased: `${dto.purchaseQuantity} ${dto.unitOfPurchase}`,
      converted: `${baseQuantity} ${material.baseUnit}`,
      message: `Se registraron ${baseQuantity} ${material.baseUnit} de ${material.name} en el inventario.`,
    };
  }
}
