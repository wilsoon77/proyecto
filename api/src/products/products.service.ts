import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { generateSlug } from '../common/utils/slug.util.js';
import { ProductOrigin } from '@prisma/client';
import { ProductPresentationInputDto } from './dto/presentation.dto.js';

function normalizeOrigin(value: string | undefined, fallback: ProductOrigin): ProductOrigin {
  if (value === undefined) return fallback;
  if (value !== ProductOrigin.PRODUCIDO && value !== ProductOrigin.COMPRADO) {
    throw new BadRequestException('El origen debe ser PRODUCIDO o COMPRADO');
  }
  return value;
}

const DEFAULT_EXPIRATION_ALERT_DAYS = [3] as const;

function normalizeExpirationAlertDays(value: unknown, origin: ProductOrigin, fallback?: unknown): number[] {
  if (origin !== ProductOrigin.COMPRADO) return [];

  const source = value === undefined || value === null ? fallback : value;
  const values = Array.isArray(source)
    ? source
    : source === undefined || source === null
      ? [...DEFAULT_EXPIRATION_ALERT_DAYS]
      : [source];
  const normalized = [...new Set(values
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 3650))];

  return normalized.length > 0
    ? normalized.sort((a, b) => b - a)
    : [...DEFAULT_EXPIRATION_ALERT_DAYS];
}

type PresentationInput = ProductPresentationInputDto;

function normalizePresentations(input: PresentationInput[] | undefined) {
  if (input === undefined) return undefined;

  const names = new Set<string>();
  const normalized = input.map((presentation, index) => {
    const name = presentation.name.trim();
    if (!name) throw new BadRequestException('El nombre de la presentación es obligatorio');
    const nameKey = name.toLocaleLowerCase();
    if (names.has(nameKey)) throw new BadRequestException(`La presentación "${name}" está repetida`);
    names.add(nameKey);
    if (!Number.isInteger(presentation.unitsInStock) || presentation.unitsInStock < 1) {
      throw new BadRequestException(`La presentación "${name}" debe consumir al menos una unidad`);
    }
    const isForSale = presentation.isForSale ?? true;
    const price = presentation.price === null || presentation.price === undefined ? null : Number(presentation.price);
    if (isForSale && (price === null || !Number.isFinite(price) || price < 0)) {
      throw new BadRequestException(`La presentación "${name}" necesita un precio de venta`);
    }
    return {
      name,
      unitsInStock: presentation.unitsInStock,
      price,
      isForSale,
      isForProduction: presentation.isForProduction ?? false,
      isDefault: presentation.isDefault ?? false,
      isActive: presentation.isActive ?? true,
      sortOrder: presentation.sortOrder ?? index,
    };
  });

  const salePresentations = normalized.filter((presentation) => presentation.isForSale && presentation.isActive);
  const defaults = salePresentations.filter((presentation) => presentation.isDefault);
  if (defaults.length > 1) throw new BadRequestException('Solo puede existir una presentación de venta predeterminada');
  if (salePresentations.length > 0 && defaults.length === 0) {
    salePresentations[0].isDefault = true;
  }

  return normalized;
}

function mapPresentations(presentations: any[] | undefined, available: number) {
  return (presentations ?? []).map((presentation) => ({
    id: presentation.id,
    name: presentation.name,
    unitsInStock: presentation.unitsInStock,
    price: presentation.price === null || presentation.price === undefined ? null : Number(presentation.price),
    isForSale: presentation.isForSale,
    isForProduction: presentation.isForProduction,
    isDefault: presentation.isDefault,
    isActive: presentation.isActive,
    sortOrder: presentation.sortOrder,
    available: Math.max(0, Math.floor(available / presentation.unitsInStock)),
  }));
}

function mapProduct(product: any, available: number) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description ?? undefined,
    basePrice: Number(product.basePrice),
    category: product.category?.name,
    categorySlug: product.category?.slug,
    categoryId: product.categoryId,
    origin: product.origin,
    isNew: product.isNew ?? false,
    isActive: product.isActive,
    isAvailable: product.isAvailable,
    comboQuantity: product.comboQuantity ?? undefined,
    comboPrice: product.comboPrice === null || product.comboPrice === undefined ? undefined : Number(product.comboPrice),
    unitsPerTray: product.unitsPerTray ?? undefined,
    tracksExpiration: product.tracksExpiration,
    expirationAlertDays: normalizeExpirationAlertDays(product.expirationAlertDays, product.origin),
    stockUnitLabel: product.stockUnitLabel ?? 'unidades',
    available,
    presentations: mapPresentations(product.presentations, available),
    images: (product.images ?? []).map((img: any) => ({ id: img.id, url: img.url, position: img.position })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export interface ProductDTO {
  id: number;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  category: string;
  origin?: string;
  isNew?: boolean;
  isActive?: boolean;
  isAvailable?: boolean;
  comboQuantity?: number;
  comboPrice?: number;
  unitsPerTray?: number;
  tracksExpiration?: boolean;
  expirationAlertDays?: number[];
  available?: number; // stock disponible (quantity - reserved)
  stockUnitLabel?: string;
  presentations?: ReturnType<typeof mapPresentations>;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { search?: string; category?: string; min?: number; max?: number; sort?: string; branch?: string; page?: number; pageSize?: number; all?: boolean; status?: string }, visibility: 'public' | 'admin' = 'public'): Promise<any> {
    const where: any = {};
    const isAdminListing = visibility === 'admin';
    const includeInactiveCategories = isAdminListing && (query.status === 'all' || query.all === true);
    if (!isAdminListing) {
      // This path is used by the public catalog and must never expose hidden products.
      where.isActive = true;
    } else if (query.status === 'active') {
      where.isActive = true;
    } else if (query.status === 'inactive') {
      where.isActive = false;
    } else if (query.status === 'all' || query.all) {
      // No filter on isActive, show all
    } else {
      // Default behavior (compatibility with public store)
      where.isActive = true;
    }

    if (query.category) {
      where.category = { slug: query.category, ...(includeInactiveCategories ? {} : { isActive: true }) };
    } else if (!includeInactiveCategories) {
      where.category = { isActive: true };
    }
    if (query.search) {
      const s = query.search;
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ];
    }
    if (query.min !== undefined || query.max !== undefined) {
      where.basePrice = {};
      if (query.min !== undefined) where.basePrice.gte = query.min;
      if (query.max !== undefined) where.basePrice.lte = query.max;
    }

    let orderBy: any = undefined;
    switch (query.sort) {
      case 'precio-asc':
        orderBy = { basePrice: 'asc' };
        break;
      case 'precio-desc':
        orderBy = { basePrice: 'desc' };
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
      include: {
        category: true,
        images: true,
        presentations: {
          where: { isActive: true, isForSale: true },
          orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
        },
      },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Pre-cargar inventarios según branch filtrada o agregados
    let inventoriesByProduct: Record<number, { quantity: number; reserved: number }[]> = {};
    if (products.length) {
      if (query.branch) {
        const branch = await this.prisma.branch.findUnique({ where: { slug: query.branch } });
        if (branch?.isActive) {
          const inv = await this.prisma.inventory.findMany({ where: { branchId: branch.id, productId: { in: products.map(p => p.id) } } });
          inventoriesByProduct = inv.reduce((acc, i) => {
            acc[i.productId] = [{ quantity: i.quantity, reserved: i.reserved }];
            return acc;
          }, {} as Record<number, { quantity: number; reserved: number }[]>);
        }
      } else {
        const invAll = await this.prisma.inventory.findMany({
          // El catálogo público no debe sumar existencias de sucursales inactivas.
          where: { productId: { in: products.map(p => p.id) }, branch: { isActive: true } },
        });
        inventoriesByProduct = invAll.reduce((acc, i) => {
          (acc[i.productId] ||= []).push({ quantity: i.quantity, reserved: i.reserved });
          return acc;
        }, {} as Record<number, { quantity: number; reserved: number }[]>);
      }
    }

    const mapped = products.map(p => {
      const list = inventoriesByProduct[p.id] || [];
      const available = list.reduce((sum, r) => sum + (r.quantity - r.reserved), 0);
      return mapProduct(p, available);
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

  async findOne(slug: string, branch?: string) {
    const p = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: true,
        presentations: {
          where: { isActive: true, isForSale: true },
          orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
        },
      },
    });
    if (!p || !p.isActive || !p.category?.isActive) return null;
    
    let whereInv: any = { productId: p.id, branch: { isActive: true } };
    if (branch) {
      const b = await this.prisma.branch.findUnique({ where: { slug: branch } });
      // Una sucursal inexistente o inactiva no debe devolver inventario
      // agregado de todas las sucursales en el endpoint público.
      whereInv = { productId: p.id, branchId: b?.isActive ? b.id : -1 };
    }
    
    const inv = await this.prisma.inventory.findMany({ where: whereInv });
    const available = inv.reduce((sum, i) => sum + (i.quantity - i.reserved), 0);
    return mapProduct(p, available);
  }

  // ==================== MÉTODOS POR ID ====================
  
  async findById(id: number, branch?: string) {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true, presentations: true },
    });
    if (!p) return null;
    
    let whereInv: any = { productId: p.id };
    if (branch) {
      const b = await this.prisma.branch.findUnique({ where: { slug: branch } });
      if (b) whereInv.branchId = b.id;
    }
    
    const inv = await this.prisma.inventory.findMany({ where: whereInv });
    const available = inv.reduce((sum, i) => sum + (i.quantity - i.reserved), 0);
    return mapProduct(p, available);
  }

  async updateById(id: number, data: { sku?: string; name?: string; slug?: string; description?: string; basePrice?: number; comboQuantity?: number; comboPrice?: number; unitsPerTray?: number; categorySlug?: string; origin?: string; isNew?: boolean; isActive?: boolean; isAvailable?: boolean; tracksExpiration?: boolean; expirationAlertDays?: number[]; stockUnitLabel?: string; presentations?: ProductPresentationInputDto[]; imageUrl?: string }) {
    const prod = await this.prisma.product.findUnique({ where: { id } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    
    // Validar SKU único si cambia
    if (data.sku && data.sku !== prod.sku) {
      const existingSku = await this.prisma.product.findUnique({ where: { sku: data.sku } });
      if (existingSku) throw new BadRequestException('SKU ya existe');
    }
    
    // Use the supplied slug when present; otherwise regenerate it when the name changes.
    let newSlug: string | undefined;
    if (data.slug || (data.name && data.name !== prod.name)) {
      let base = generateSlug(data.slug || data.name || prod.slug);
      if (!base) base = prod.slug;
      newSlug = base;
      let suffix = 1;
      while (await this.prisma.product.findFirst({ where: { slug: newSlug, NOT: { id: prod.id } } })) {
        newSlug = `${base}-${suffix++}`;
      }
    }
    
    let categoryId = prod.categoryId;
    if (data.categorySlug) {
      const category = await this.prisma.category.findUnique({ where: { slug: data.categorySlug } });
      if (category && !category.isActive) throw new BadRequestException('Categoría inactiva');
      if (!category) throw new BadRequestException('Categoría no encontrada');
      categoryId = category.id;
    }

    const nextOrigin = normalizeOrigin(data.origin, prod.origin);
    const tracksExpiration = nextOrigin === ProductOrigin.COMPRADO
      ? (data.tracksExpiration ?? prod.tracksExpiration)
      : false;
    const expirationAlertDays = normalizeExpirationAlertDays(data.expirationAlertDays, nextOrigin, prod.expirationAlertDays);
    const presentationData = normalizePresentations(data.presentations);
    
    const updated = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          sku: data.sku,
          name: data.name,
          slug: newSlug,
          description: data.description,
          basePrice: data.basePrice,
          comboQuantity: data.comboQuantity,
          comboPrice: data.comboPrice,
          unitsPerTray: nextOrigin === ProductOrigin.COMPRADO ? null : data.unitsPerTray,
          stockUnitLabel: data.stockUnitLabel?.trim() || undefined,
          categoryId,
          origin: nextOrigin,
          tracksExpiration,
          expirationAlertDays,
          isNew: data.isNew,
          isActive: data.isActive,
          isAvailable: data.isAvailable,
        },
      });
      if (presentationData !== undefined) {
        await tx.productPresentation.deleteMany({ where: { productId: id } });
        if (presentationData.length > 0) {
          await tx.productPresentation.createMany({ data: presentationData.map((presentation) => ({ productId: id, ...presentation })) });
        }
      }
      return product;
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
    
    const result = await this.findById(updated.id);
    if (!result) throw new NotFoundException('Producto actualizado no encontrado');
    return result;
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

    // Eliminar registros dependientes y producto en una transacción
    await this.prisma.$transaction([
      this.prisma.stockMovement.deleteMany({ where: { productId: id } }),
      this.prisma.inventory.deleteMany({ where: { productId: id } }),
      this.prisma.productImage.deleteMany({ where: { productId: id } }),
      this.prisma.product.delete({ where: { id } }),
    ]);
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

  async create(data: { sku: string; name: string; slug?: string; description?: string; basePrice: number; comboQuantity?: number; comboPrice?: number; unitsPerTray?: number; categorySlug: string; origin?: string; isNew?: boolean; isActive?: boolean; isAvailable?: boolean; tracksExpiration?: boolean; expirationAlertDays?: number[]; stockUnitLabel?: string; presentations?: ProductPresentationInputDto[]; imageUrl?: string }) {
    const category = await this.prisma.category.findUnique({ where: { slug: data.categorySlug } });
    if (category && !category.isActive) throw new BadRequestException('Categoría inactiva');
    if (!category) throw new BadRequestException('Categoría no encontrada');
    
    const existingSku = await this.prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) throw new BadRequestException('SKU ya existe');

    // Generate a unique slug from the requested value or the product name.
    let baseSlug = generateSlug(data.slug || data.name);
    if (!baseSlug) baseSlug = data.sku.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    let slug = baseSlug;
    let suffix = 1;
    while (await this.prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const origin = normalizeOrigin(data.origin, ProductOrigin.PRODUCIDO);
    const tracksExpiration = origin === ProductOrigin.COMPRADO && (data.tracksExpiration ?? false);
    const expirationAlertDays = normalizeExpirationAlertDays(data.expirationAlertDays, origin);
    const presentationData = normalizePresentations(
      data.presentations ?? (data.comboQuantity && data.comboPrice !== undefined
        ? [{ name: `Combo de ${data.comboQuantity}`, unitsInStock: data.comboQuantity, price: data.comboPrice, isDefault: true }]
        : undefined),
    );
    
    // Usar transacción para crear producto + inventarios en todas las sucursales
    const created = await this.prisma.$transaction(async (tx) => {
      // Paso 1: Crear el producto
      const product = await tx.product.create({ 
        data: { 
          sku: data.sku, 
          name: data.name, 
          slug, 
          description: data.description, 
          basePrice: data.basePrice, 
          comboQuantity: data.comboQuantity, 
          comboPrice: data.comboPrice, 
          stockUnitLabel: data.stockUnitLabel?.trim() || 'unidades',
          unitsPerTray: origin === ProductOrigin.COMPRADO ? null : data.unitsPerTray,
          categoryId: category.id, 
          origin,
          tracksExpiration,
          expirationAlertDays,
          isNew: data.isNew ?? false,
          isActive: data.isActive ?? true,
          isAvailable: data.isAvailable ?? true,
          presentations: presentationData ? { create: presentationData } : undefined,
        } 
      });
      
      // Paso 2: Crear imagen si se proporciona URL
      if (data.imageUrl) {
        await tx.productImage.create({
          data: {
            productId: product.id,
            url: data.imageUrl,
            position: 0,
          }
        });
      }
      
      // Paso 3: Buscar todas las sucursales activas
      const branches = await tx.branch.findMany();
      
      // Paso 4: Crear registro de Inventory para cada sucursal con stock 0
      if (branches.length > 0) {
        await tx.inventory.createMany({
          data: branches.map(branch => ({
            productId: product.id,
            branchId: branch.id,
            quantity: 0,
            reserved: 0,
          })),
        });
      }
      
      return product;
    });
    const result = await this.findById(created.id);
    if (!result) throw new NotFoundException('Producto creado no encontrado');
    return result;
  }

  async update(slug: string, data: { sku?: string; name?: string; slug?: string; description?: string; basePrice?: number; comboQuantity?: number; comboPrice?: number; unitsPerTray?: number; categorySlug?: string; origin?: string; isNew?: boolean; isActive?: boolean; isAvailable?: boolean; tracksExpiration?: boolean; expirationAlertDays?: number[]; stockUnitLabel?: string; presentations?: ProductPresentationInputDto[] }) {
    const prod = await this.prisma.product.findUnique({ where: { slug } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    if (data.presentations !== undefined || data.stockUnitLabel !== undefined) {
      return this.updateById(prod.id, data);
    }
    if (data.sku && data.sku !== prod.sku) {
      const existingSku = await this.prisma.product.findUnique({ where: { sku: data.sku } });
      if (existingSku) throw new BadRequestException('SKU ya existe');
    }
    // Use a supplied slug, or regenerate it when the name changes.
    let newSlug: string | undefined;
    if (data.slug || (data.name && data.name !== prod.name)) {
      let base = generateSlug(data.slug || data.name || prod.slug);
      if (!base) base = prod.slug;
      newSlug = base;
      let suffix = 1;
      while (await this.prisma.product.findFirst({ where: { slug: newSlug, NOT: { id: prod.id } } })) {
        newSlug = `${base}-${suffix++}`;
      }
    }
    let categoryId = prod.categoryId;
    if (data.categorySlug) {
      const category = await this.prisma.category.findUnique({ where: { slug: data.categorySlug } });
      if (category && !category.isActive) throw new BadRequestException('Categoría inactiva');
      if (!category) throw new BadRequestException('Categoría no encontrada');
      categoryId = category.id;
    }
    const nextOrigin = normalizeOrigin(data.origin, prod.origin);
    const tracksExpiration = nextOrigin === ProductOrigin.COMPRADO
      ? (data.tracksExpiration ?? prod.tracksExpiration)
      : false;
    const expirationAlertDays = normalizeExpirationAlertDays(data.expirationAlertDays, nextOrigin, prod.expirationAlertDays);
    const updated = await this.prisma.product.update({ where: { id: prod.id }, data: { sku: data.sku, name: data.name, slug: newSlug, description: data.description, basePrice: data.basePrice, comboQuantity: data.comboQuantity, comboPrice: data.comboPrice, unitsPerTray: nextOrigin === ProductOrigin.COMPRADO ? null : data.unitsPerTray, categoryId, origin: nextOrigin, tracksExpiration, expirationAlertDays, isNew: data.isNew, isActive: data.isActive, isAvailable: data.isAvailable } });
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

    // Eliminar registros dependientes y producto en una transacción
    await this.prisma.$transaction([
      this.prisma.stockMovement.deleteMany({ where: { productId: prod.id } }),
      this.prisma.inventory.deleteMany({ where: { productId: prod.id } }),
      this.prisma.productImage.deleteMany({ where: { productId: prod.id } }),
      this.prisma.product.delete({ where: { id: prod.id } }),
    ]);
    return { deleted: true, slug };
  }

  async putUpdate(slug: string, data: { name: string; slug?: string; description?: string; basePrice: number; comboQuantity?: number; comboPrice?: number; unitsPerTray?: number; categorySlug: string; origin?: string; isNew?: boolean; tracksExpiration?: boolean; expirationAlertDays?: number[]; stockUnitLabel?: string; presentations?: ProductPresentationInputDto[] }) {
    const prod = await this.prisma.product.findUnique({ where: { slug } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    if (data.presentations !== undefined || data.stockUnitLabel !== undefined) {
      return this.updateById(prod.id, data);
    }
    const category = await this.prisma.category.findUnique({ where: { slug: data.categorySlug } });
    if (category && !category.isActive) throw new BadRequestException('Categoría inactiva');
    if (!category) throw new BadRequestException('Categoría no encontrada');
    const nextOrigin = normalizeOrigin(data.origin, prod.origin);
    const tracksExpiration = nextOrigin === ProductOrigin.COMPRADO
      ? (data.tracksExpiration ?? prod.tracksExpiration)
      : false;
    const expirationAlertDays = normalizeExpirationAlertDays(data.expirationAlertDays, nextOrigin, prod.expirationAlertDays);
    let newSlug: string | undefined;
    if (data.slug) {
      const base = generateSlug(data.slug) || prod.slug;
      newSlug = base;
      let suffix = 1;
      while (await this.prisma.product.findFirst({ where: { slug: newSlug, NOT: { id: prod.id } } })) {
        newSlug = `${base}-${suffix++}`;
      }
    }
    const updated = await this.prisma.product.update({ where: { id: prod.id }, data: {
      name: data.name,
      slug: newSlug,
      description: data.description,
      basePrice: data.basePrice,
      comboQuantity: data.comboQuantity,
      comboPrice: data.comboPrice,
      unitsPerTray: nextOrigin === ProductOrigin.COMPRADO ? null : data.unitsPerTray,
      categoryId: category.id,
      origin: nextOrigin,
      tracksExpiration,
      expirationAlertDays,
      isNew: data.isNew ?? false,
    }});
    return updated;
  }

  async findFeatured(limit: number = 10, branch?: string) {
    // Productos destacados: nuevos o con combo, activos y disponibles
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isAvailable: true,
        category: { isActive: true },
        OR: [
          { isNew: true },
          { comboQuantity: { not: null } },
        ],
      },
      include: {
        category: true,
        images: true,
        presentations: {
          where: { isActive: true, isForSale: true },
          orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: [
        { isNew: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Cargar inventarios agregados
    let inventoriesByProduct: Record<number, { quantity: number; reserved: number }[]> = {};
    if (products.length) {
      let invWhere: any = {
        productId: { in: products.map(p => p.id) },
        branch: { isActive: true },
      };
      
      if (branch) {
        const b = await this.prisma.branch.findUnique({ where: { slug: branch } });
        // Evita filtrar silenciosamente a todas las sucursales cuando el
        // catálogo recibe una sucursal inválida o inactiva.
        invWhere = {
          productId: { in: products.map(p => p.id) },
          branchId: b?.isActive ? b.id : -1,
        };
      }
      
      const invAll = await this.prisma.inventory.findMany({ 
        where: invWhere
      });
      inventoriesByProduct = invAll.reduce((acc, i) => {
        (acc[i.productId] ||= []).push({ quantity: i.quantity, reserved: i.reserved });
        return acc;
      }, {} as Record<number, { quantity: number; reserved: number }[]>);
    }

    return products.map(p => {
      const list = inventoriesByProduct[p.id] || [];
      const available = list.reduce((sum, r) => sum + (r.quantity - r.reserved), 0);
      return mapProduct(p, available);
    });
  }

  async findByCategory(categorySlug: string, query: { page?: number; pageSize?: number; sort?: string }) {
    const category = await this.prisma.category.findUnique({ where: { slug: categorySlug } });
    if (category && !category.isActive) throw new NotFoundException('Categoría no encontrada');
    if (!category) throw new NotFoundException(`Categoría "${categorySlug}" no encontrada`);

    const where: any = { 
      categoryId: category.id,
      isActive: true,
    };

    let orderBy: any = undefined;
    switch (query.sort) {
      case 'precio-asc':
        orderBy = { basePrice: 'asc' };
        break;
      case 'precio-desc':
        orderBy = { basePrice: 'desc' };
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
        include: {
          category: true,
          presentations: {
            where: { isActive: true, isForSale: true },
            orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Cargar inventarios
    let inventoriesByProduct: Record<number, { quantity: number; reserved: number }[]> = {};
    if (products.length) {
      const invAll = await this.prisma.inventory.findMany({ 
        where: { productId: { in: products.map(p => p.id) }, branch: { isActive: true } }
      });
      inventoriesByProduct = invAll.reduce((acc, i) => {
        (acc[i.productId] ||= []).push({ quantity: i.quantity, reserved: i.reserved });
        return acc;
      }, {} as Record<number, { quantity: number; reserved: number }[]>);
    }

    const mapped = products.map(p => {
      const list = inventoriesByProduct[p.id] || [];
      const available = list.reduce((sum, r) => sum + (r.quantity - r.reserved), 0);
      return mapProduct(p, available);
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
