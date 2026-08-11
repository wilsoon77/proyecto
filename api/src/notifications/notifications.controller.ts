import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Req,
  Headers,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import { SubscribePushDto } from './dto/subscribe-push.dto.js';
import { UpdateNotificationConfigDto } from './dto/update-notification-config.dto.js';
import { TestNotificationDto } from './dto/test-notification.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('notifications')
@ApiTags('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Obtener clave pública VAPID', description: 'Obtiene la clave pública VAPID para que el cliente pueda registrarse en el navegador.' })
  @ApiResponse({ status: 200, description: 'Clave pública VAPID' })
  getVapidPublicKey() {
    return { publicKey: process.env.VAPID_PUBLIC_KEY || '' };
  }

  @Get('push-diagnostics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Diagnóstico Push', description: 'Obtiene el estado de configuración VAPID y suscripciones para diagnóstico.' })
  @ApiResponse({ status: 200, description: 'Estado de las notificaciones push' })
  getDiagnostics(@Req() req: any) {
    return this.notificationsService.getDiagnostics(req.user.userId);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar dispositivo para notificaciones push', description: 'Registra la suscripción push (endpoint + claves) del dispositivo del usuario.' })
  @ApiResponse({ status: 201, description: 'Suscripción registrada con éxito' })
  async subscribe(
    @Req() req: any,
    @Body() subscribePushDto: SubscribePushDto,
    @Headers('user-agent') userAgent?: string
  ) {
    await this.notificationsService.subscribe(req.user.userId, subscribePushDto, userAgent);
    return { success: true };
  }

  @Post('unsubscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar suscripción push', description: 'Elimina un dispositivo de las notificaciones push.' })
  @ApiResponse({ status: 200, description: 'Suscripción eliminada con éxito' })
  async unsubscribe(@Body('endpoint') endpoint: string) {
    if (!endpoint) {
      throw new BadRequestException('El campo endpoint es obligatorio');
    }
    await this.notificationsService.unsubscribe(endpoint);
    return { success: true };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener historial de notificaciones in-app', description: 'Obtiene el historial paginado de notificaciones del usuario logueado.' })
  @ApiResponse({ status: 200, description: 'Listado de notificaciones' })
  getHistory(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const p = page ? Number(page) : 1;
    const ps = pageSize ? Number(pageSize) : 20;
    return this.notificationsService.getHistory(req.user.userId, p, ps);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener conteo de notificaciones no leídas', description: 'Obtiene la cantidad de notificaciones in-app no leídas.' })
  @ApiResponse({ status: 200, description: 'Conteo de notificaciones no leídas' })
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    return { count };
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar todas como leídas', description: 'Marca todas las notificaciones del usuario como leídas.' })
  @ApiResponse({ status: 200, description: 'Notificaciones actualizadas con éxito' })
  async markAllAsRead(@Req() req: any) {
    await this.notificationsService.markAllAsRead(req.user.userId);
    return { success: true };
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar notificación como leída', description: 'Marca una única notificación como leída.' })
  @ApiResponse({ status: 200, description: 'Notificación leída con éxito' })
  async markAsRead(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.notificationsService.markAsRead(id, req.user.userId);
    return { success: true };
  }

  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar configuraciones de notificaciones', description: 'Obtiene únicamente las dos reglas operativas: materia prima baja y caducidad próxima. Requiere rol ADMIN.' })
  @ApiResponse({ status: 200, description: 'Listado de configuraciones' })
  getConfigs() {
    return this.notificationsService.getConfigs();
  }

  @Put('config/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar configuración de notificaciones', description: 'Actualiza una de las dos reglas operativas (materia prima baja o caducidad próxima), incluyendo habilitación, umbral, canales y destinatarios. Requiere rol ADMIN.' })
  @ApiParam({ name: 'key', enum: ['inventory.raw_material_low', 'inventory.expiration_warning'] })
  @ApiResponse({ status: 200, description: 'Configuración actualizada con éxito' })
  @ApiNotFoundResponse({ description: 'Configuración no encontrada' })
  async updateConfig(
    @Param('key') key: string,
    @Body() updateDto: UpdateNotificationConfigDto
  ) {
    return this.notificationsService.updateConfig(key, updateDto);
  }

  @Post('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar notificación de prueba', description: 'Dispara una notificación simulada de materia prima baja o caducidad próxima. Requiere rol ADMIN.' })
  @ApiResponse({ status: 200, description: 'Notificación de prueba enviada con éxito' })
  @ApiNotFoundResponse({ description: 'Configuración no encontrada' })
  async sendTestNotification(@Req() req: any, @Body() testDto: TestNotificationDto) {
    const key = testDto.key;
    const placeholders: Record<string, any> = {
      orderNumber: 'TEST-9999',
      status: 'CONFIRMED',
      productName: 'Pan de Banano',
      materialName: 'Harina de Trigo',
      current: 8,
      unit: 'LB',
      branchName: 'Sucursal Central',
      quantity: 5,
      type: 'MERMA',
      recipeName: 'Baguette Tradicional',
      count: 3,
      ip: '192.168.1.1',
      userId: req.user.userId, // Dirigido a sí mismo
    };

    // Usamos sendToUser directamente en vez de sendByConfig para asegurar que llegue 
    // al dispositivo del administrador que está probando, ignorando las reglas de roles.
    await this.notificationsService.sendToUser(req.user.userId, key, placeholders, '/admin/historial', 'Bell');
    return { success: true, key };
  }
}
