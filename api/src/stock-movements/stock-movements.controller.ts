import { Controller, Post, Body, UseGuards, Get, Query, Req, Res, ForbiddenException } from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service.js';
import { CreateStockMovementDto, ReconcileInventoryDto } from './dto.js';
import { ApiTags, ApiBody, ApiBearerAuth, ApiQuery, ApiOperation, ApiResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { AuditService } from '../audit/audit.service.js';
import { getClientIp } from '../common/utils/audit.util.js';
import type { Response } from 'express';
import { setPaginationHeaders } from '../common/utils/pagination.util.js';
import { BranchScopeService } from '../branch-scope/branch-scope.service.js';

@Controller('stock-movements')
@ApiTags('stock-movements')
export class StockMovementsController {
  constructor(
    private readonly service: StockMovementsService,
    private readonly auditService: AuditService,
    private readonly branchScope: BranchScopeService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registrar movimiento',
    description: 'Crea un movimiento de inventario. ADMIN y MANAGER pueden registrar movimientos; MANAGER puede transferir entre cualquiera de las dos sucursales. El cierre diario solo bloquea nueva PRODUCCION de la fecha cerrada, no compras, mermas, pérdidas ni ajustes.',
  })
  @ApiBody({ type: CreateStockMovementDto })
  @ApiResponse({ status: 201, description: 'Movimiento creado', content: { 'application/json': { examples: { ejemplo: { value: { id: 1, type: 'PRODUCCION', quantity: 10 } } } } } })
  @ApiBadRequestResponse({ description: 'Validaciones de negocio', schema: { example: { statusCode: 400, error: 'Bad Request', message: 'fromBranchSlug requerido' } } })
  async create(@Req() req: any, @Body() dto: CreateStockMovementDto) {
    const scopedDto = await this.scopeMovementDto(dto, req.user);
    const movement = await this.service.create(scopedDto, req.user?.userId);
    
    // Registrar en auditoría
    const userName = await this.auditService.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'CREATE',
      entity: 'StockMovement',
      entityId: String(movement.id),
      entityName: `${dto.type} - ${dto.productSlug}`,
      details: {
        type: dto.type,
        productSlug: dto.productSlug,
        quantity: dto.quantity,
        fromBranch: scopedDto.fromBranchSlug,
        toBranch: scopedDto.toBranchSlug,
      },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });
    
    return movement;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar movimientos', description: 'Listado paginado de movimientos (solo ADMIN o MANAGER).' })
  @ApiQuery({ name: 'productSlug', required: false })
  @ApiQuery({ name: 'branchSlug', required: false, description: 'Slug de sucursal; MANAGER puede consultar cualquiera de las dos' })
  @ApiQuery({ name: 'type', required: false, enum: ['PRODUCCION', 'COMPRA', 'VENTA', 'TRANSFERENCIA', 'MERMA', 'PERDIDA_ROBO', 'SOBRANTE'] })
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
    const scopedBranchSlug = await this.branchScope.resolveBranchSlug(req.user, branchSlug);
    const result = this.service.list({ productSlug, branchSlug: scopedBranchSlug, type, from, to, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
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

  @Post('reconcile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reconciliar inventario', description: 'Compara conteo físico real vs sistema y genera ajustes automáticos (SOBRANTE o MERMA). Solo ADMIN o MANAGER.' })
  @ApiBody({ type: ReconcileInventoryDto })
  @ApiResponse({ status: 201, description: 'Reconciliación completada con resumen de ajustes' })
  @ApiBadRequestResponse({ description: 'Sucursal no encontrada o sin productos' })
  async reconcile(@Req() req: any, @Body() dto: ReconcileInventoryDto) {
    const branchSlug = await this.branchScope.resolveWriteBranchSlug(req.user, dto.branchSlug);
    const result = await this.service.reconcile({ ...dto, branchSlug: branchSlug ?? dto.branchSlug }, req.user?.userId);

    // Registrar en auditoría
    const userName = await this.auditService.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'CREATE',
      entity: 'StockMovement',
      entityName: `Reconciliación - ${result.branchName}`,
      details: {
        action: 'RECONCILE',
        branch: result.branchName,
        totalReviewed: result.totalReviewed,
        totalAdjusted: result.totalAdjusted,
        sobrantes: result.sobrantes,
        mermas: result.mermas,
      },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });

    return result;
  }

  @Get('activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resumen operativo de movimientos', description: 'Agrupa producción, ventas y mermas de los últimos días para el panel Operación.' })
  @ApiQuery({ name: 'branchSlug', required: false, description: 'Slug de sucursal; MANAGER puede consultar cualquiera de las dos' })
  @ApiQuery({ name: 'days', required: false, description: 'Cantidad de días a mostrar, entre 1 y 14' })
  async activity(@Req() req: any, @Query('branchSlug') branchSlug?: string, @Query('days') days?: string) {
    const scopedBranchSlug = await this.branchScope.resolveBranchSlug(req.user, branchSlug);
    return this.service.activity(scopedBranchSlug, days ? Number(days) : 7);
  }

  private async scopeMovementDto(dto: CreateStockMovementDto, actor: any): Promise<CreateStockMovementDto> {
    if (actor?.role === 'ADMIN') return dto;

    if (dto.type === 'TRANSFERENCIA') {
      if (actor?.role !== 'MANAGER') {
        throw new ForbiddenException('Solo ADMIN o MANAGER pueden transferir inventario entre sucursales');
      }
      const fromBranchSlug = await this.branchScope.resolveWriteBranchSlug(actor, dto.fromBranchSlug);
      const toBranchSlug = await this.branchScope.resolveWriteBranchSlug(actor, dto.toBranchSlug);
      return { ...dto, fromBranchSlug, toBranchSlug };
    }

    if (['VENTA', 'MERMA', 'PERDIDA_ROBO'].includes(dto.type)) {
      const fromBranchSlug = await this.branchScope.resolveWriteBranchSlug(actor, dto.fromBranchSlug);
      return { ...dto, fromBranchSlug };
    }

    const toBranchSlug = await this.branchScope.resolveWriteBranchSlug(actor, dto.toBranchSlug);
    return { ...dto, toBranchSlug };
  }
}
