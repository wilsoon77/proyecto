import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface ProductDTO {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  category: string;
  isNew?: boolean;
  discount?: number;
  available?: number; // stock disponible (quantity - reserved)
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { search?: string; category?: string; min?: number; max?: number; sort?: string; branch?: string; page?: number; pageSize?: number }) {
    const where: any = {};
    where.isActive = true;

    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.search) {
      const s = query.search;
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ];
    }
    if (query.min !== undefined || query.max !== undefined) {
      where.price = {};
      if (query.min !== undefined) where.price.gte = query.min;
      if (query.max !== undefined) where.price.lte = query.max;
    }

    let orderBy: any = undefined;
    switch (query.sort) {
      case 'precio-asc':
        orderBy = { price: 'asc' };
        break;
      case 'precio-desc':
        orderBy = { price: 'desc' };
        break;
      case 'nuevo':
        orderBy = { createdAt: 'desc' };
        break;
    }

    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 10));

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
      where,
      orderBy,
      include: { category: true, images: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Pre-cargar inventarios según branch filtrada o agregados
    let inventoriesByProduct: Record<number, { quantity: number; reserved: number }[]> = {};
    if (products.length) {
      if (query.branch) {
        const branch = await this.prisma.branch.findUnique({ where: { slug: query.branch } });
        if (branch) {
          const inv = await this.prisma.inventory.findMany({ where: { branchId: branch.id, productId: { in: products.map(p => p.id) } } });
          inventoriesByProduct = inv.reduce((acc, i) => {
            acc[i.productId] = [{ quantity: i.quantity, reserved: i.reserved }];
            return acc;
          }, {} as Record<number, { quantity: number; reserved: number }[]>);
        }
      } else {
        const invAll = await this.prisma.inventory.findMany({ where: { productId: { in: products.map(p => p.id) } } });
        inventoriesByProduct = invAll.reduce((acc, i) => {
          (acc[i.productId] ||= []).push({ quantity: i.quantity, reserved: i.reserved });
          return acc;
        }, {} as Record<number, { quantity: number; reserved: number }[]>);
      }
    }

    const mapped = products.map(p => {
      const list = inventoriesByProduct[p.id] || [];
      const available = list.reduce((sum, r) => sum + (r.quantity - r.reserved), 0);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description ?? undefined,
        price: Number(p.price),
        category: p.category.name,
        isNew: p.isNew ?? undefined,
        discount: p.discountPct ?? undefined,
        available,
        images: p.images.map(img => ({ id: img.id, url: img.url, position: img.position })),
      };
    });

    return {
      data: mapped,
      meta: {
        total,
        pageCount: Math.ceil(total / pageSize) || 0,
        page,
        pageSize,
      },
    };
  }

  async findOne(slug: string) {
    const p = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!p || !p.isActive) return null;
    const inv = await this.prisma.inventory.findMany({ where: { productId: p.id } });
    const available = inv.reduce((sum, i) => sum + (i.quantity - i.reserved), 0);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? undefined,
      price: Number(p.price),
      category: p.category.name,
      categorySlug: p.category.slug,
      isNew: p.isNew ?? undefined,
      discount: p.discountPct ?? undefined,
      available,
    };
  }

  // ==================== MÉTODOS POR ID ====================
  
  async findById(id: number) {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true },
    });
    if (!p) return null;
    const inv = await this.prisma.inventory.findMany({ where: { productId: p.id } });
    const available = inv.reduce((sum, i) => sum + (i.quantity - i.reserved), 0);
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      description: p.description ?? undefined,
      price: Number(p.price),
      category: p.category.name,
      categorySlug: p.category.slug,
      categoryId: p.categoryId,
      origin: p.origin,
      isNew: p.isNew ?? false,
      isActive: p.isActive,
      isAvailable: p.isAvailable,
      discountPct: p.discountPct ?? undefined,
      images: p.images.map(img => ({ id: img.id, url: img.url, position: img.position })),
      available,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async updateById(id: number, data: { sku?: string; name?: string; slug?: string; description?: string; price?: number; discountPct?: number; categorySlug?: string; origin?: string; isNew?: boolean; isActive?: boolean; isAvailable?: boolean; imageUrl?: string }) {
    const prod = await this.prisma.product.findUnique({ where: { id } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    
    // Validar SKU único si cambia
    if (data.sku && data.sku !== prod.sku) {
      const existingSku = await this.prisma.product.findUnique({ where: { sku: data.sku } });
      if (existingSku) throw new BadRequestException('SKU ya existe');
    }
    
    // Validar slug único si cambia
    if (data.slug && data.slug !== prod.slug) {
      const existingSlug = await this.prisma.product.findUnique({ where: { slug: data.slug } });
      if (existingSlug) throw new BadRequestException('Slug ya existe');
    }
    
    let categoryId = prod.categoryId;
    if (data.categorySlug) {
      const category = await this.prisma.category.findUnique({ where: { slug: data.categorySlug } });
      if (!category) throw new BadRequestException('Categoría no encontrada');
      categoryId = category.id;
    }
    
    const updated = await this.prisma.product.update({ 
      where: { id }, 
      data: { 
        sku: data.sku, 
        name: data.name,
        slug: data.slug,
        description: data.description, 
        price: data.price, 
        discountPct: data.discountPct, 
        categoryId, 
        origin: (data.origin as any) ?? undefined, 
        isNew: data.isNew, 
        isActive: data.isActive, 
        isAvailable: data.isAvailable 
      },
      include: { category: true },
    });
    
    // Actualizar imagen si se proporciona URL
    if (data.imageUrl) {
      // Eliminar imágenes anteriores y crear nueva
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      await this.prisma.productImage.create({
        data: {
          productId: id,
          url: data.imageUrl,
          position: 0,
        }
      });
    }
    
    return {
      id: updated.id,
      sku: updated.sku,
      name: updated.name,
      slug: updated.slug,
      description: updated.description ?? undefined,
      price: Number(updated.price),
      category: updated.category.name,
      categorySlug: updated.category.slug,
      isNew: updated.isNew,
      isActive: updated.isActive,
    };
  }

  async deactivateById(id: number) {
    const prod = await this.prisma.product.findUnique({ where: { id } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  async deleteById(id: number) {
    const prod = await this.prisma.product.findUnique({ where: { id }, include: { orderItems: true } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    if (prod.orderItems.length) throw new BadRequestException('No se puede eliminar: producto referenciado en órdenes');
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true, id };
  }

  // Helper reutilizable
  async getAvailableStock(productId: number, branchSlug?: string) {
    if (branchSlug) {
      const branch = await this.prisma.branch.findUnique({ where: { slug: branchSlug } });
      if (!branch) return 0;
      const inv = await this.prisma.inventory.findUnique({ where: { productId_branchId: { productId, branchId: branch.id } } });
      if (!inv) return 0;
      return inv.quantity - inv.reserved;
    }
    const invAll = await this.prisma.inventory.findMany({ where: { productId } });
    return invAll.reduce((sum, i) => sum + (i.quantity - i.reserved), 0);
  }

  async create(data: { sku: string; name: string; slug: string; description?: string; price: number; categorySlug: string; origin?: string; isNew?: boolean; isAvailable?: boolean; imageUrl?: string }) {
    const category = await this.prisma.category.findUnique({ where: { slug: data.categorySlug } });
    if (!category) throw new BadRequestException('Categoría no encontrada');
    const existing = await this.prisma.product.findUnique({ where: { slug: data.slug } });
    if (existing) throw new BadRequestException('Slug ya existe');
    const existingSku = await this.prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) throw new BadRequestException('SKU ya existe');
    
    const product = await this.prisma.product.create({ 
      data: { 
        sku: data.sku, 
        name: data.name, 
        slug: data.slug, 
        description: data.description, 
        price: data.price, 
        categoryId: category.id, 
        origin: (data.origin as any) ?? undefined, 
        isNew: data.isNew ?? false, 
        isAvailable: data.isAvailable ?? true 
      } 
    });
    
    // Crear imagen si se proporciona URL
    if (data.imageUrl) {
      await this.prisma.productImage.create({
        data: {
          productId: product.id,
          url: data.imageUrl,
          position: 0,
        }
      });
    }
    
    return product;
  }

  async update(slug: string, data: { sku?: string; name?: string; description?: string; price?: number; discountPct?: number; categorySlug?: string; origin?: string; isNew?: boolean; isActive?: boolean; isAvailable?: boolean }) {
    const prod = await this.prisma.product.findUnique({ where: { slug } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    if (data.sku && data.sku !== prod.sku) {
      const existingSku = await this.prisma.product.findUnique({ where: { sku: data.sku } });
      if (existingSku) throw new BadRequestException('SKU ya existe');
    }
    let categoryId = prod.categoryId;
    if (data.categorySlug) {
      const category = await this.prisma.category.findUnique({ where: { slug: data.categorySlug } });
      if (!category) throw new BadRequestException('Categoría no encontrada');
      categoryId = category.id;
    }
    const updated = await this.prisma.product.update({ where: { id: prod.id }, data: { sku: data.sku, name: data.name, description: data.description, price: data.price, discountPct: data.discountPct, categoryId, origin: (data.origin as any) ?? undefined, isNew: data.isNew, isActive: data.isActive, isAvailable: data.isAvailable } });
    return updated;
  }

  async deactivate(slug: string) {
    const prod = await this.prisma.product.findUnique({ where: { slug } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    return this.prisma.product.update({ where: { id: prod.id }, data: { isActive: false } });
  }

  async hardDelete(slug: string) {
    const prod = await this.prisma.product.findUnique({ where: { slug }, include: { orderItems: true } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    if (prod.orderItems.length) throw new BadRequestException('No se puede eliminar: producto referenciado en órdenes');
    await this.prisma.product.delete({ where: { id: prod.id } });
    return { deleted: true, slug };
  }

  async putUpdate(slug: string, data: { name: string; description?: string; price: number; categorySlug: string; origin?: string; isNew?: boolean; discountPct?: number }) {
    const prod = await this.prisma.product.findUnique({ where: { slug } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    const category = await this.prisma.category.findUnique({ where: { slug: data.categorySlug } });
    if (!category) throw new BadRequestException('Categoría no encontrada');
    const updated = await this.prisma.product.update({ where: { id: prod.id }, data: {
      name: data.name,
      description: data.description,
      price: data.price,
      categoryId: category.id,
      origin: (data.origin as any) ?? prod.origin,
      isNew: data.isNew ?? false,
      discountPct: data.discountPct,
    }});
    return updated;
  }

  async findFeatured(limit: number = 10) {
    // Productos destacados: nuevos o con descuento, activos y disponibles
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isAvailable: true,
        OR: [
          { isNew: true },
          { discountPct: { gt: 0 } },
        ],
      },
      include: { category: true },
      orderBy: [
        { isNew: 'desc' },
        { discountPct: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Cargar inventarios agregados
    let inventoriesByProduct: Record<number, { quantity: number; reserved: number }[]> = {};
    if (products.length) {
      const invAll = await this.prisma.inventory.findMany({ 
        where: { productId: { in: products.map(p => p.id) } } 
      });
      inventoriesByProduct = invAll.reduce((acc, i) => {
        (acc[i.productId] ||= []).push({ quantity: i.quantity, reserved: i.reserved });
        return acc;
      }, {} as Record<number, { quantity: number; reserved: number }[]>);
    }

    return products.map(p => {
      const list = inventoriesByProduct[p.id] || [];
      const available = list.reduce((sum, r) => sum + (r.quantity - r.reserved), 0);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description ?? undefined,
        price: Number(p.price),
        category: p.category.name,
        isNew: p.isNew ?? undefined,
        discount: p.discountPct ?? undefined,
        available,
      };
    });
  }

  async findByCategory(categorySlug: string, query: { page?: number; pageSize?: number; sort?: string }) {
    const category = await this.prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw new NotFoundException(`Categoría "${categorySlug}" no encontrada`);

    const where: any = { 
      categoryId: category.id,
      isActive: true,
    };

    let orderBy: any = undefined;
    switch (query.sort) {
      case 'precio-asc':
        orderBy = { price: 'asc' };
        break;
      case 'precio-desc':
        orderBy = { price: 'desc' };
        break;
      case 'nuevo':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { name: 'asc' };
    }

    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 20));

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        include: { category: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Cargar inventarios
    let inventoriesByProduct: Record<number, { quantity: number; reserved: number }[]> = {};
    if (products.length) {
      const invAll = await this.prisma.inventory.findMany({ 
        where: { productId: { in: products.map(p => p.id) } } 
      });
      inventoriesByProduct = invAll.reduce((acc, i) => {
        (acc[i.productId] ||= []).push({ quantity: i.quantity, reserved: i.reserved });
        return acc;
      }, {} as Record<number, { quantity: number; reserved: number }[]>);
    }

    const mapped = products.map(p => {
      const list = inventoriesByProduct[p.id] || [];
      const available = list.reduce((sum, r) => sum + (r.quantity - r.reserved), 0);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description ?? undefined,
        price: Number(p.price),
        category: p.category.name,
        isNew: p.isNew ?? undefined,
        discount: p.discountPct ?? undefined,
        available,
      };
    });

    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
      data: mapped,
      meta: { total, pageCount: Math.ceil(total / pageSize) || 0, page, pageSize },
    };
  }
}
