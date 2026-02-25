import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto, UpdateCategoryDto, CategoryDto } from './dto/category.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { ProductsService } from '../products/products.service.js';
import { setPaginationHeaders } from '../common/utils/pagination.util.js';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Response } from 'express';

@Controller('categories')
@ApiTags('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Helper para obtener nombre del usuario desde la BD
   */
  private async getUserName(userId: string): Promise<string> {
    if (!userId) return 'Sistema';
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      });
      if (user) {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return name || user.email || 'Usuario';
      }
    } catch (e) {
      // Ignorar errores
    }
    return 'Sistema';
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías', description: 'Obtiene todas las categorías con conteo de productos.' })
  @ApiResponse({
    status: 200,
    description: 'Listado de categorías',
    type: [CategoryDto],
  })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Obtener categoría', description: 'Obtiene una categoría por su slug.' })
  @ApiResponse({
    status: 200,
    description: 'Categoría encontrada',
    type: CategoryDto,
  })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  findOne(@Param('slug') slug: string) {
    return this.categoriesService.findOne(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear categoría', description: 'Crea una nueva categoría. Requiere rol ADMIN.' })
  @ApiResponse({
    status: 201,
    description: 'Categoría creada',
    type: CategoryDto,
  })
  @ApiBadRequestResponse({ description: 'El slug ya existe' })
  async create(@Body() createCategoryDto: CreateCategoryDto, @Req() req: any) {
    const category = await this.categoriesService.create(createCategoryDto);
    
    // Registrar en auditoría
    const userName = await this.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'CREATE',
      entity: 'Category',
      entityId: String(category.id),
      entityName: category.name,
      details: { slug: category.slug },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    
    return category;
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar categoría', description: 'Actualiza una categoría. Requiere rol ADMIN.' })
  @ApiResponse({
    status: 200,
    description: 'Categoría actualizada',
    type: CategoryDto,
  })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  @ApiBadRequestResponse({ description: 'El slug ya existe' })
  async update(
    @Param('slug') slug: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: any,
  ) {
    const category = await this.categoriesService.update(slug, updateCategoryDto);
    
    // Registrar en auditoría
    const userName = await this.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'UPDATE',
      entity: 'Category',
      entityId: String(category.id),
      entityName: category.name,
      details: { changedFields: Object.keys(updateCategoryDto) },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    
    return category;
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar categoría', description: 'Elimina una categoría sin productos. Requiere rol ADMIN.' })
  @ApiResponse({
    status: 200,
    description: 'Categoría eliminada',
    schema: {
      properties: {
        deleted: { type: 'boolean' },
        slug: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  @ApiBadRequestResponse({ description: 'La categoría tiene productos asociados' })
  async remove(@Param('slug') slug: string, @Req() req: any) {
    // Obtener info de la categoría antes de eliminar
    const categoryInfo = await this.categoriesService.findOne(slug);
    const result = await this.categoriesService.remove(slug);
    
    // Registrar en auditoría
    const userName = await this.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'DELETE',
      entity: 'Category',
      entityId: slug,
      entityName: categoryInfo?.name,
      details: { deleted: true },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    
    return result;
  }

  @Get(':slug/products')
  @ApiOperation({ summary: 'Productos por categoría', description: 'Lista productos de una categoría específica.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'sort', required: false, description: 'precio-asc|precio-desc|nuevo' })
  @ApiResponse({
    status: 200,
    description: 'Productos de la categoría',
    schema: {
      type: 'object',
      properties: {
        category: { type: 'object' },
        data: { type: 'array' },
        meta: { type: 'object' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  productsByCategory(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sort') sort?: string,
  ) {
    const result = this.productsService.findByCategory(slug, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sort,
    });
    return Promise.resolve(result).then((r: any) => {
      setPaginationHeaders({
        res,
        baseUrl: req.originalUrl?.split('?')[0] || req.url,
        query: req.query || {},
        total: r.meta.total,
        page: r.meta.page,
        pageSize: r.meta.pageSize,
      });
      return r;
    });
  }
}
