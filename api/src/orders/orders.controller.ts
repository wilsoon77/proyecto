import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { OrdersService } from './orders.service.js';
import { ReserveOrderDto } from './dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { setPaginationHeaders } from '../common/utils/pagination.util.js';
import { AuditService } from '../audit/audit.service.js';
import { getClientIp } from '../common/utils/audit.util.js';
import { BranchScopeService } from '../branch-scope/branch-scope.service.js';

const ORDER_OPERATOR_ROLES = new Set(['MANAGER']);

@Controller('orders')
@ApiTags('orders')
export class OrdersController {
  constructor(
    private readonly service: OrdersService,
    private readonly auditService: AuditService,
    private readonly branchScope: BranchScopeService,
  ) {}

  @Post('reserve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reservar pedido para recoger en sucursal',
    description: 'Crea una reserva para retiro en la sucursal indicada y descuenta el stock disponible. Si permanece en PENDING sin confirmarse, se cancela automáticamente después de 2 horas por defecto y libera la reserva.',
  })
  @ApiBody({ type: ReserveOrderDto })
  @ApiResponse({ status: 201, description: 'Pedido creado y stock reservado' })
  @ApiBadRequestResponse({ description: 'Validación o stock insuficiente' })
  async reserve(@Req() req: any, @Body() dto: ReserveOrderDto) {
    const branchSlug = ORDER_OPERATOR_ROLES.has(req.user?.role) || req.user?.role === 'BAKER'
      ? await this.branchScope.resolveBranchSlug(req.user, dto.branchSlug)
      : dto.branchSlug;
    const order = await this.service.reserve(
      { ...dto, branchSlug: branchSlug ?? dto.branchSlug },
      req.user?.userId,
    );

    const userName = await this.auditService.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'CREATE',
      entity: 'Order',
      entityId: String(order.id),
      entityName: order.orderNumber,
      details: {
        branchSlug: branchSlug ?? dto.branchSlug,
        itemsCount: dto.items?.length,
        total: order.total,
      },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });

    return order;
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancelar pedido y liberar la reserva',
    description: 'Cancela manualmente el pedido y libera las unidades reservadas. La expiración automática solo aplica a pedidos PENDING sin confirmar; los demás estados se cancelan manualmente.',
  })
  async cancel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const role = req.user?.role;
    if (ORDER_OPERATOR_ROLES.has(role)) {
      await this.branchScope.assertOrderAccess(req.user, id);
    }

    const orderInfo: any = await this.service.detail(
      id,
      role === 'ADMIN' || ORDER_OPERATOR_ROLES.has(role) ? undefined : req.user?.userId,
    );
    if (role !== 'ADMIN' && !ORDER_OPERATOR_ROLES.has(role) && orderInfo?.userId !== req.user?.userId) {
      throw new ForbiddenException('No tienes permiso para cancelar este pedido');
    }

    const result = await this.service.cancel(id, req.user?.userId);
    const userName = await this.auditService.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'UPDATE',
      entity: 'Order',
      entityId: String(id),
      entityName: orderInfo?.orderNumber || 'Order #' + id,
      details: { action: 'CANCEL', newStatus: 'CANCELLED' },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });

    return result;
  }

  @Post(':id/pickup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar recogida en sucursal' })
  async pickup(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.branchScope.assertOrderAccess(req.user, id);
    const orderInfo = await this.service.detail(id);
    const result = await this.service.pickup(id, req.user?.userId);
    const userName = await this.auditService.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'UPDATE',
      entity: 'Order',
      entityId: String(id),
      entityName: orderInfo?.orderNumber || 'Order #' + id,
      details: { action: 'PICKUP', newStatus: 'PICKED_UP' },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });

    return result;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar pedidos para retiro', description: 'ADMIN y MANAGER pueden consultar pedidos de ambas sucursales.' })
  @ApiQuery({ name: 'branchSlug', required: false, description: 'Slug de sucursal; MANAGER puede elegir cualquiera de las dos sucursales' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiResponse({ status: 200, description: 'Listado paginado de pedidos' })
  async list(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Query('branchSlug') branchSlug?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const scopedBranchSlug = await this.branchScope.resolveBranchSlug(req.user, branchSlug);
    const result = await this.service.list({
      branchSlug: scopedBranchSlug,
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    setPaginationHeaders({
      res,
      baseUrl: req.originalUrl?.split('?')[0] || req.url,
      query: req.query || {},
      total: result.meta.total,
      page: result.meta.page,
      pageSize: result.meta.pageSize,
    });
    return result;
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar mis pedidos' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async myOrders(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.service.findByUser(req.user.userId, {
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    setPaginationHeaders({
      res,
      baseUrl: req.originalUrl?.split('?')[0] || req.url,
      query: req.query || {},
      total: result.meta.total,
      page: result.meta.page,
      pageSize: result.meta.pageSize,
    });
    return result;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de pedido' })
  async detail(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    if (ORDER_OPERATOR_ROLES.has(req.user?.role)) {
      await this.branchScope.assertOrderAccess(req.user, id);
      return this.service.detail(id);
    }

    return this.service.detail(id, req.user?.role === 'ADMIN' ? undefined : req.user?.userId);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar pedido' })
  async confirmOrder(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.branchScope.assertOrderAccess(req.user, id);
    const order = await this.service.confirm(id);
    const userName = await this.auditService.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'UPDATE',
      entity: 'Order',
      entityId: String(id),
      entityName: order.orderNumber,
      details: { action: 'CONFIRM', previousStatus: 'PENDING', newStatus: 'CONFIRMED' },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });
    return order;
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Avanzar estado del pedido',
    description: 'Aplica las transiciones válidas del flujo de retiro: PENDING → CONFIRMED → PREPARING → READY → PICKED_UP. CANCELLED se usa para cancelaciones manuales.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED'],
          example: 'PREPARING',
        },
      },
    },
  })
  async updateStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() { status }: { status: string },
  ) {
    await this.branchScope.assertOrderAccess(req.user, id);
    const order = await this.service.updateStatus(id, status);
    const userName = await this.auditService.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'UPDATE',
      entity: 'Order',
      entityId: String(id),
      entityName: order.orderNumber,
      details: { action: 'STATUS_CHANGE', newStatus: status },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });
    return order;
  }
}
