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
import type { Response } from 'express';

@Controller('categories')
@ApiTags('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
  ) {}

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
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
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
  update(
    @Param('slug') slug: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(slug, updateCategoryDto);
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
  remove(@Param('slug') slug: string) {
    return this.categoriesService.remove(slug);
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
