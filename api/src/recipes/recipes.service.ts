import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/recipe.dto.js';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly = true) {
    return this.prisma.recipe.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        product: { select: { id: true, name: true, slug: true, unitsPerTray: true } },
        ingredients: {
          include: {
            rawMaterial: { select: { id: true, name: true, baseUnit: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, slug: true, unitsPerTray: true } },
        ingredients: {
          include: {
            rawMaterial: { select: { id: true, name: true, baseUnit: true, costPerUnit: true } },
          },
        },
      },
    });
    if (!recipe) throw new NotFoundException(`Receta con ID ${id} no encontrada`);
    return recipe;
  }

  async create(dto: CreateRecipeDto) {
    return this.prisma.recipe.create({
      data: {
        name: dto.name,
        productId: dto.productId,
        standardTrays: dto.standardTrays,
        ingredients: {
          create: dto.ingredients.map(ing => ({
            rawMaterialId: ing.rawMaterialId,
            quantity: ing.quantity,
          })),
        },
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        ingredients: {
          include: {
            rawMaterial: { select: { id: true, name: true, baseUnit: true } },
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateRecipeDto) {
    // Verify recipe exists
    await this.findOne(id);

    // If ingredients are provided, replace them all (delete + create)
    if (dto.ingredients) {
      await this.prisma.$transaction(async (tx) => {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
        await tx.recipe.update({
          where: { id },
          data: {
            name: dto.name,
            standardTrays: dto.standardTrays,
            isActive: dto.isActive,
            ingredients: {
              create: dto.ingredients!.map(ing => ({
                rawMaterialId: ing.rawMaterialId,
                quantity: ing.quantity,
              })),
            },
          },
        });
      });
    } else {
      await this.prisma.recipe.update({
        where: { id },
        data: {
          name: dto.name,
          standardTrays: dto.standardTrays,
          isActive: dto.isActive,
        },
      });
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.recipe.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
