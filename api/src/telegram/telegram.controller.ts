import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { TelegramLinkService } from './telegram-link.service.js';
import { TelegramService } from './telegram.service.js';

@Controller('telegram')
@ApiTags('telegram')
export class TelegramController {
  constructor(
    private readonly links: TelegramLinkService,
    private readonly telegram: TelegramService,
  ) {}

  @Post('link-session')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generar enlace seguro para abrir el asistente en Telegram',
    description: 'Devuelve un enlace para la aplicación móvil (tg://) y otro compatible con navegador (https://t.me). El usuario debe pulsar Iniciar en el bot para completar el vínculo.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sesión de vinculación creada; el token expira en 10 minutos.',
    schema: {
      example: {
        deepLink: 'https://t.me/panaderia_bot?start=token-de-un-solo-uso',
        webDeepLink: 'https://t.me/panaderia_bot?start=token-de-un-solo-uso',
        appDeepLink: 'tg://resolve?domain=panaderia_bot&start=token-de-un-solo-uso',
        expiresAt: '2026-08-21T18:00:00.000Z',
        botUsername: 'panaderia_bot',
      },
    },
  })
  createLinkSession(@Req() req: any) {
    return this.links.createLinkSession(req.user.userId);
  }

  @Get('link-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar estado del vínculo de Telegram' })
  getLinkStatus(@Req() req: any) {
    return this.links.getStatus(req.user.userId);
  }

  @Delete('link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desvincular Telegram de la cuenta actual' })
  async deleteLink(@Req() req: any) {
    await this.links.deactivateByUser(req.user.userId);
    return { success: true };
  }

  @Post('register-webhook')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar el webhook de Telegram configurado en el entorno' })
  registerWebhook() {
    return this.telegram.registerWebhook();
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook privado de Telegram' })
  receiveWebhook(
    @Body() body: unknown,
    @Headers('x-telegram-bot-api-secret-token') secret?: string,
  ) {
    return this.telegram.receiveWebhook(body, secret);
  }
}
