import { Body, Controller, Param, ParseIntPipe, Post, Get, Query, UseGuards, Req, Res, Patch } from '@nestjs/common';
import { ApiTags, ApiBody, ApiQuery, ApiBearerAuth, ApiOperation, ApiResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { ReserveOrderDto } from './dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { setPaginationHeaders } from '../common/utils/pagination.util.js';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { getClientIp } from '../common/utils/audit.util.js';
import type { Response } from 'express';

@Controller('orders')
@ApiTags('orders')
export class OrdersController {
  constructor(
    private readonly service: OrdersService,
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

  @Post('reserve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reservar orden', description: 'Crea una orden y bloquea stock como reserva.' })
  @ApiBody({ type: ReserveOrderDto })
  @ApiResponse({ status: 201, description: 'Orden creada y reservada', content: { 'application/json': { examples: { ejemplo: { value: { id: 123, orderNumber: 'ORD-000123', status: 'PENDING', subtotal: 100, total: 100 } } } } } })
  @ApiBadRequestResponse({ description: 'Validación o stock insuficiente', schema: { example: { statusCode: 400, error: 'Bad Request', message: 'Stock insuficiente: Concha' } } })
  async reserve(@Req() req: any, @Body() dto: ReserveOrderDto) {
    const order = await this.service.reserve(dto, req.user?.userId);
    
    // Registrar en auditoría
    const userName = await this.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'CREATE',
      entity: 'Order',
      entityId: String(order.id),
      entityName: order.orderNumber,
      details: { branchSlug: dto.branchSlug, itemsCount: dto.items?.length, total: order.total },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });
    
    return order;
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar orden', description: 'Libera las reservas de inventario y marca la orden como CANCELLED.' })
  async cancel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    // Obtener info de la orden antes de cancelar
    const orderInfo = await this.service.detail(id);
    const result = await this.service.cancel(id, req.user?.userId);
    
    // Registrar en auditoría
    const userName = await this.getUserName(req.user?.userId);
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Entregar orden', description: 'Descuenta inventario con movimiento VENTA y marca DELIVERED.' })
  async pickup(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    // Obtener info de la orden antes de entregar
    const orderInfo = await this.service.detail(id);
    const result = await this.service.pickup(id, req.user?.userId);
    
    // Registrar en auditoría
    const userName = await this.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'UPDATE',
      entity: 'Order',
      entityId: String(id),
      entityName: orderInfo?.orderNumber || `Order #${id}`,
      details: { action: 'PICKUP', newStatus: 'DELIVERED' },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });
    
    return result;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar órdenes', description: 'Listado paginado con filtros por sucursal y estado.' })
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
  list(@Req() req: any, @Res({ passthrough: true }) res: Response, @Query('branchSlug') branchSlug?: string, @Query('status') status?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const result = this.service.list({ branchSlug, status, page: page ? Number(page) : undefined, pageSize: pageSize ? Number(pageSize) : undefined });
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
  detail(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    // Si no es ADMIN, validar que la orden pertenezca al usuario
    const userId = req.user.role === 'ADMIN' ? undefined : req.user.userId;
    return this.service.detail(id, userId);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar orden', description: 'Cambia estado de PENDING a CONFIRMED (pago recibido).' })
  @ApiResponse({ status: 200, description: 'Orden confirmada' })
  @ApiBadRequestResponse({ description: 'Solo se pueden confirmar órdenes PENDING' })
  async confirmOrder(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const order = await this.service.confirm(id);
    
    // Registrar en auditoría
    const userName = await this.getUserName(req.user?.userId);
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar estado de orden', description: 'Actualiza el estado de una orden. Válido para ADMIN y EMPLOYEE.' })
  @ApiBody({ schema: { example: { status: 'CONFIRMED' }, properties: { status: { type: 'string', description: 'Nuevo estado (PENDING, CONFIRMED, PREPARING, READY, IN_DELIVERY, DELIVERED, CANCELLED)' } } } })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiBadRequestResponse({ description: 'Estado inválido o error en la actualización' })
  async updateStatus(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() { status }: { status: string }) {
    const order = await this.service.updateStatus(id, status);
    
    // Registrar en auditoría
    const userName = await this.getUserName(req.user?.userId);
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
