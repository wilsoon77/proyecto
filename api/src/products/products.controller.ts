import { Controller, Get, Param, Query, Post, Body, Patch, Put, Delete, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBearerAuth, ApiBody, ApiResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiOperation, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateProductDto, ProductDto, UpdateProductDto, PutProductDto } from './dto/product.dto.js';
import { PaginatedMetaDto } from '../common/dto/pagination.dto.js';
import { setPaginationHeaders } from '../common/utils/pagination.util.js';
import { AuditService } from '../audit/audit.service.js';
import type { Response } from 'express';

@Controller('products')
@ApiTags('products')
@ApiExtraModels(PaginatedMetaDto, ProductDto)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos activos', description: 'Devuelve productos activos con buscador, filtros y paginación.' })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de productos',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: getSchemaPath(ProductDto) } },
        meta: { $ref: getSchemaPath(PaginatedMetaDto) as any },
      },
      example: {
        data: [
          { id: 1, name: 'Concha', slug: 'concha', description: 'Pan dulce tradicional', price: 10.5, category: 'Pan dulce', isNew: true, discount: 10, available: 24 },
        ],
        meta: { total: 1, pageCount: 1, page: 1, pageSize: 10 },
      },
    },
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'min', required: false })
  @ApiQuery({ name: 'max', required: false })
  @ApiQuery({ name: 'sort', required: false, description: 'precio-asc|precio-desc|nuevo' })
  @ApiQuery({ name: 'branch', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  findAll(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('min') min?: string,
    @Query('max') max?: string,
    @Query('sort') sort?: string,
    @Query('branch') branch?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = this.productsService.findAll({
      search,
      category,
      min: min ? Number(min) : undefined,
      max: max ? Number(max) : undefined,
      sort,
      branch,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    // Set headers when promise resolves
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

  @Get('featured')
  @ApiOperation({ summary: 'Productos destacados', description: 'Productos nuevos o con descuento para homepage.' })
  @ApiQuery({ name: 'limit', required: false, description: 'Cantidad de productos (default: 10, max: 50)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos destacados',
    type: [ProductDto],
  })
  findFeatured(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Math.min(50, Number(limit)) : 10;
    return this.productsService.findFeatured(parsedLimit);
  }

  // ==================== ENDPOINTS POR ID (para admin) ====================

  @Get('by-id/:id')
  @ApiOperation({ summary: 'Obtener producto por ID', description: 'Obtiene información completa de un producto por su ID numérico.' })
  @ApiResponse({ status: 200, description: 'Producto encontrado', type: ProductDto })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  async findOneById(@Param('id') id: string) {
    const prod = await this.productsService.findById(Number(id));
    if (!prod) return { message: 'Producto no encontrado' };
    return prod;
  }

  @Patch('by-id/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar producto por ID', description: 'Actualiza parcialmente un producto por ID. Requiere rol ADMIN.' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Producto actualizado', type: ProductDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  updateById(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.productsService.updateById(Number(id), body);
  }

  @Post('by-id/:id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Desactivar producto por ID', description: 'Desactiva un producto (soft delete). Requiere rol ADMIN.' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Producto desactivado' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  deactivateById(@Param('id') id: string) {
    return this.productsService.deactivateById(Number(id));
  }

  @Delete('by-id/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar producto por ID', description: 'Elimina físicamente si no está referenciado. Requiere rol ADMIN.' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Producto eliminado' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  @ApiBadRequestResponse({ description: 'No se puede eliminar: referenciado' })
  removeById(@Param('id') id: string) {
    return this.productsService.deleteById(Number(id));
  }

  // ==================== ENDPOINTS POR SLUG (compatibilidad) ====================

  @Get(':slug')
  @ApiOperation({ summary: 'Obtener detalle de producto', description: 'Obtiene información completa de un producto por su slug.' })
  @ApiResponse({ status: 200, description: 'Producto encontrado', type: ProductDto })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  async findOne(@Param('slug') slug: string) {
    const prod = await this.productsService.findOne(slug);
    if (!prod) return { message: 'Producto no encontrado' };
    return prod;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear producto', description: 'Crea un nuevo producto. Requiere rol ADMIN.' })
  @ApiBearerAuth()
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 201,
    description: 'Producto creado',
    type: ProductDto,
    content: {
      'application/json': {
        examples: {
          ejemplo: {
            summary: 'Creación exitosa',
            value: { id: 12, name: 'Oreja', slug: 'oreja', description: 'Hojaldre azucarado', price: 8.5, category: 'Pan dulce', isNew: false, discount: null, available: 0 },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos', schema: { example: { statusCode: 400, error: 'Bad Request', message: 'Categoría no encontrada' } } })
  async create(@Body() body: CreateProductDto, @Req() req: any) {
    const product = await this.productsService.create(body);
    
    // Registrar en auditoría
    await this.auditService.log({
      userId: req.user?.sub,
      userName: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || req.user?.email || 'Sistema',
      action: 'CREATE',
      entity: 'Product',
      entityId: String(product.id),
      entityName: product.name,
      details: { sku: body.sku, price: body.price, category: body.categorySlug },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    
    return product;
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar producto', description: 'Actualiza parcialmente un producto por slug. Requiere rol ADMIN.' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Producto actualizado', type: ProductDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  async update(@Param('slug') slug: string, @Body() body: UpdateProductDto, @Req() req: any) {
    const product = await this.productsService.update(slug, body);
    
    // Registrar en auditoría
    await this.auditService.log({
      userId: req.user?.sub,
      userName: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || req.user?.email || 'Sistema',
      action: 'UPDATE',
      entity: 'Product',
      entityId: String(product.id),
      entityName: product.name,
      details: { changedFields: Object.keys(body) },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    
    return product;
  }

  @Post(':slug/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Desactivar producto', description: 'Desactiva un producto (soft delete). Requiere rol ADMIN.' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Producto desactivado', schema: { properties: { id: { type: 'integer' }, slug: { type: 'string' }, isActive: { type: 'boolean' } } } })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  async deactivate(@Param('slug') slug: string, @Req() req: any) {
    const product = await this.productsService.deactivate(slug);
    
    // Registrar en auditoría
    await this.auditService.log({
      userId: req.user?.sub,
      userName: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || req.user?.email || 'Sistema',
      action: 'UPDATE',
      entity: 'Product',
      entityId: String(product.id),
      entityName: product.name,
      details: { action: 'DEACTIVATE' },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    
    return product;
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar producto', description: 'Elimina físicamente si no está referenciado. Requiere rol ADMIN.' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Producto eliminado', schema: { properties: { deleted: { type: 'boolean' }, slug: { type: 'string' } } } })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  @ApiBadRequestResponse({ description: 'No se puede eliminar: referenciado' })
  async remove(@Param('slug') slug: string, @Req() req: any) {
    // Obtener info del producto antes de eliminar
    const productInfo = await this.productsService.findOne(slug);
    const result = await this.productsService.hardDelete(slug);
    
    // Registrar en auditoría
    await this.auditService.log({
      userId: req.user?.sub,
      userName: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || req.user?.email || 'Sistema',
      action: 'DELETE',
      entity: 'Product',
      entityId: slug,
      entityName: productInfo?.name,
      details: { deleted: true },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    
    return result;
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reemplazar producto (PUT)', description: 'Reemplazo idempotente de todos los campos. Requiere rol ADMIN.' })
  @ApiBearerAuth()
  @ApiBody({ type: PutProductDto })
  @ApiResponse({ status: 200, description: 'Producto reemplazado', type: ProductDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  replace(@Param('slug') slug: string, @Body() body: PutProductDto) {
    return this.productsService.putUpdate(slug, body);
  }
}
