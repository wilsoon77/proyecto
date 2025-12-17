import { Controller, Post, Body, UseGuards, Get, Query, Req, Res } from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service.js';
import { CreateStockMovementDto } from './dto.js';
import { ApiTags, ApiBody, ApiBearerAuth, ApiQuery, ApiOperation, ApiResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import type { Response } from 'express';
import { setPaginationHeaders } from '../common/utils/pagination.util.js';

@Controller('stock-movements')
@ApiTags('stock-movements')
export class StockMovementsController {
  constructor(private readonly service: StockMovementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EMPLOYEE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar movimiento', description: 'Crea un movimiento de inventario (solo ADMIN o EMPLOYEE).' })
  @ApiBody({ type: CreateStockMovementDto })
  @ApiResponse({ status: 201, description: 'Movimiento creado', content: { 'application/json': { examples: { ejemplo: { value: { id: 1, type: 'PRODUCCION', quantity: 10 } } } } } })
  @ApiBadRequestResponse({ description: 'Validaciones de negocio', schema: { example: { statusCode: 400, error: 'Bad Request', message: 'fromBranchSlug requerido' } } })
  async create(@Req() req: any, @Body() dto: CreateStockMovementDto) {
    return this.service.create(dto, req.user?.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EMPLOYEE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar movimientos', description: 'Listado paginado de movimientos (solo ADMIN o EMPLOYEE).' })
  @ApiQuery({ name: 'productSlug', required: false })
  @ApiQuery({ name: 'branchSlug', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date desde' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date hasta' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de movimientos',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { type: 'object' } },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            pageCount: { type: 'integer' },
            page: { type: 'integer' },
            pageSize: { type: 'integer' },
          },
        },
      },
    },
  })
  async list(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Query('productSlug') productSlug?: string,
    @Query('branchSlug') branchSlug?: string,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    // userId not required for filtering, but could be used for role-based scoping later
    const result = this.service.list({ productSlug, branchSlug, type, from, to, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
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
