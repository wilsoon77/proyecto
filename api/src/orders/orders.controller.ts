import { Body, Controller, Param, ParseIntPipe, Post, Get, Query, UseGuards, Req, Res, Patch, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBody, ApiQuery, ApiBearerAuth, ApiOperation, ApiResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { POSOrderDto, ReserveOrderDto } from './dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { setPaginationHeaders } from '../common/utils/pagination.util.js';
import { AuditService } from '../audit/audit.service.js';
import { getClientIp } from '../common/utils/audit.util.js';
import type { Response } from 'express';
import { BranchScopeService } from '../branch-scope/branch-scope.service.js';

const ORDER_OPERATOR_ROLES = new Set(['MANAGER', 'CASHIER']);

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
  @ApiOperation({ summary: 'Reservar orden', description: 'Crea una orden y bloquea stock como reserva.' })
  @ApiBody({ type: ReserveOrderDto })
  @ApiResponse({ status: 201, description: 'Orden creada y reservada', content: { 'application/json': { examples: { ejemplo: { value: { id: 123, orderNumber: 'ORD-000123', status: 'PENDING', subtotal: 100, total: 100 } } } } } })
  @ApiBadRequestResponse({ description: 'Validación o stock insuficiente', schema: { example: { statusCode: 400, error: 'Bad Request', message: 'Stock insuficiente: Concha' } } })
  async reserve(@Req() req: any, @Body() dto: ReserveOrderDto) {
    // El endpoint tambien sirve a clientes, pero un empleado no puede usarlo
    // para reservar inventario de una sucursal ajena.
    const branchSlug = ORDER_OPERATOR_ROLES.has(req.user?.role) || req.user?.role === 'BAKER'
      ? await this.branchScope.resolveBranchSlug(req.user, dto.branchSlug)
      : dto.branchSlug;
    const order = await this.service.reserve({ ...dto, branchSlug: branchSlug ?? dto.branchSlug }, req.user?.userId);
    
    // Registrar en auditoría
    const userName = await this.auditService.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'CREATE',
      entity: 'Order',
      entityId: String(order.id),
      entityName: order.orderNumber,
      details: { branchSlug: branchSlug ?? dto.branchSlug, itemsCount: dto.items?.length, total: order.total },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });
    
    return order;
  }

  @Post('pos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Venta directa en POS', description: 'Crea una orden entregada instantáneamente y descuenta stock.' })
  @ApiBody({ type: POSOrderDto })
  @ApiResponse({ status: 201, description: 'Venta registrada exitosamente' })
  @ApiBadRequestResponse({ description: 'Stock insuficiente' })
  async posSale(@Req() req: any, @Body() dto: POSOrderDto) {
    const branchSlug = await this.branchScope.resolveBranchSlug(req.user, dto.branchSlug);
    const order = await this.service.directSale({ ...dto, branchSlug: branchSlug ?? dto.branchSlug }, req.user?.userId);

    const userName = await this.auditService.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'CREATE',
      entity: 'Order',
      entityId: String(order.id),
      entityName: order.orderNumber,
      details: { action: 'POS_SALE', branchSlug: branchSlug ?? dto.branchSlug, itemsCount: dto.items?.length, total: order.total },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });

    return order;
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar orden', description: 'Libera las reservas de inventario y marca la orden como CANCELLED. El cliente puede cancelar su propia orden; ADMIN puede cancelar cualquiera.' })
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
      throw new ForbiddenException('No tienes permiso para cancelar esta orden');
    }
    const result = await this.service.cancel(id, req.user?.userId);
    
    // Registrar en auditoría
    const userName = await this.auditService.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'UPDATE',
      entity: 'Order',
      entityId: String(id),
      entityName: orderInfo?.orderNumber || `Order #${id}`,
      details: { action: 'CANCEL', newStatus: 'CANCELLED' },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });
    
    return result;
  }

  @Post(':id/pickup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar recogida', description: 'Descuenta inventario con movimiento VENTA y marca PICKED_UP. La orden debe estar READY.' })
  async pickup(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.branchScope.assertOrderAccess(req.user, id);
    const orderInfo = await this.service.detail(id);
    const result = await this.service.pickup(id, req.user?.userId);
    
    // Registrar en auditoría
    const userName = await this.auditService.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'UPDATE',
      entity: 'Order',
      entityId: String(id),
      entityName: orderInfo?.orderNumber || `Order #${id}`,
      details: { action: 'PICKUP', newStatus: 'PICKED_UP' },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });
    
    return result;
  }

  @Post(':id/deliver')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar entrega', description: 'Descuenta inventario con movimiento VENTA y marca DELIVERED. La orden debe estar IN_DELIVERY.' })
  async deliver(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.branchScope.assertOrderAccess(req.user, id);
    const orderInfo = await this.service.detail(id);
    const result = await this.service.deliver(id, req.user?.userId);

    const userName = await this.auditService.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'UPDATE',
      entity: 'Order',
      entityId: String(id),
      entityName: orderInfo?.orderNumber || `Order #${id}`,
      details: { action: 'DELIVER', newStatus: 'DELIVERED' },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });

    return result;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar órdenes', description: 'Listado paginado con filtros por sucursal y estado. Requiere rol ADMIN, MANAGER o CASHIER.' })
  @ApiQuery({ name: 'branchSlug', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de órdenes',
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
  async list(@Req() req: any, @Res({ passthrough: true }) res: Response, @Query('branchSlug') branchSlug?: string, @Query('status') status?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const scopedBranchSlug = await this.branchScope.resolveBranchSlug(req.user, branchSlug);
    const result = this.service.list({ branchSlug: scopedBranchSlug, status, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
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

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mis órdenes', description: 'Lista las órdenes del usuario autenticado.' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiResponse({ status: 200, description: 'Listado de mis órdenes' })
  myOrders(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const result = this.service.findByUser(
      req.user.userId,
      { status, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined }
    );
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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de orden', description: 'Obtiene una orden con items y sucursal. Usuarios solo ven sus órdenes.' })
  async detail(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    if (ORDER_OPERATOR_ROLES.has(req.user?.role)) {
      await this.branchScope.assertOrderAccess(req.user, id);
      return this.service.detail(id);
    }

    return this.service.detail(id, req.user?.role === 'ADMIN' ? undefined : req.user?.userId);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar orden', description: 'Cambia estado de PENDING a CONFIRMED (pago recibido). Requiere rol ADMIN, MANAGER o CASHIER.' })
  @ApiResponse({ status: 200, description: 'Orden confirmada' })
  @ApiBadRequestResponse({ description: 'Solo se pueden confirmar órdenes PENDING' })
  async confirmOrder(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.branchScope.assertOrderAccess(req.user, id);
    const order = await this.service.confirm(id);
    
    // Registrar en auditoría
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
  @ApiOperation({ summary: 'Avanzar estado de orden', description: 'Solo permite transiciones no terminales del flujo. Cancelación, recogida y entrega usan comandos propios para mantener inventario consistente.' })
  @ApiBody({ schema: { example: { status: 'PREPARING' }, properties: { status: { type: 'string', description: 'Siguiente estado no terminal (CONFIRMED, PREPARING, READY, IN_DELIVERY)' } } } })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiBadRequestResponse({ description: 'Estado inválido o error en la actualización' })
  async updateStatus(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() { status }: { status: string }) {
    await this.branchScope.assertOrderAccess(req.user, id);
    const order = await this.service.updateStatus(id, status);
    
    // Registrar en auditoría
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
