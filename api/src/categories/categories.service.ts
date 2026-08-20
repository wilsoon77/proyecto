import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      isActive: cat.isActive,
      productCount: cat._count.products,
    }));
  }

  async findOne(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.isActive,
      productCount: category._count.products,
    };
  }

  async create(data: CreateCategoryDto) {
    // Verificar que el slug no exista
    const existing = await this.prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new BadRequestException('El slug ya existe');
    }

    const category = await this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
      },
    });

    return category;
  }

  async update(slug: string, data: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // Si se actualiza el slug, verificar que no exista
    if (data.slug && data.slug !== slug) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: data.slug },
      });

      if (existing) {
        throw new BadRequestException('El nuevo slug ya existe');
      }
    }

    const updated = await this.prisma.category.update({
      where: { id: category.id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        isActive: data.isActive,
      },
    });

    return updated;
  }

  async remove(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // No permitir eliminar si tiene productos
    if (category._count.products > 0) {
      throw new BadRequestException(
        `No se puede eliminar: tiene ${category._count.products} producto(s) asociado(s)`,
      );
    }

    return this.deactivate(slug);
  }

  async deactivate(slug: string) {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    const deactivated = await this.prisma.category.update({
      where: { id: category.id },
      data: { isActive: false },
    });
    return { deleted: true, deactivated: true, slug: deactivated.slug, isActive: deactivated.isActive };
  }
}
