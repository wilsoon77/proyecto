import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssistantPolicyService } from '../assistant/assistant-policy.service.js';
import { AssistantService } from '../assistant/assistant.service.js';
import { TelegramDeliveryService, TELEGRAM_ASSISTANT_KEYBOARD } from './telegram-delivery.service.js';
import { TelegramLinkService } from './telegram-link.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

type TelegramUpdate = {
  update_id?: number;
  message?: {
    text?: string;
    chat?: { id?: number | string; type?: string };
    from?: { username?: string };
  };
};

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private readonly rateWindows = new Map<string, number[]>();
  private readonly dailyWindows = new Map<string, number[]>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly links: TelegramLinkService,
    private readonly assistant: AssistantService,
    private readonly policy: AssistantPolicyService,
    private readonly delivery: TelegramDeliveryService,
  ) {}

  async onModuleInit(): Promise<void> {
    const token = this.getToken();
    const webhookUrl = this.getWebhookUrl();
    if (!token) {
      this.logger.warn('Telegram deshabilitado: TELEGRAM_BOT_TOKEN no está configurado.');
      return;
    }

    void this.syncBotCommands().catch(() => {});

    if (!webhookUrl) {
      this.logger.warn('Telegram configurado sin TELEGRAM_WEBHOOK_URL; registra el webhook manualmente antes de producción.');
      return;
    }

    void this.registerWebhook().catch((error) => {
      this.logger.error(`No se pudo registrar el webhook de Telegram: ${error instanceof Error ? error.message : 'error'}`);
    });
  }

  async syncBotCommands(): Promise<{ ok: boolean; description?: string }> {
    const token = this.getToken();
    if (!token) return { ok: false, description: 'Token no configurado' };

    const commands = [
      { command: 'menu', description: 'Abrir menú con botones rápidos' },
      { command: 'materias_bajas', description: 'Materias primas con bajo stock' },
      { command: 'vencimientos', description: 'Productos próximos a vencer' },
      { command: 'inventario', description: 'Consultar inventario disponible' },
      { command: 'produccion', description: 'Ver producción registrada hoy' },
      { command: 'ayuda', description: 'Guía y ejemplos de preguntas' },
      { command: 'desvincular', description: 'Desconectar este chat de Telegram' },
    ];

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ commands }),
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await response.json()) as { ok?: boolean; description?: string };
      if (!response.ok || !body.ok) {
        this.logger.warn(`setMyCommands error: ${body.description || response.status}`);
        return { ok: false, description: body.description };
      }
      this.logger.log('Comandos de Telegram sincronizados exitosamente (botón ☰ activado)');
      return { ok: true };
    } catch (error) {
      this.logger.error(`Error al sincronizar comandos de Telegram: ${error instanceof Error ? error.message : 'error'}`);
      return { ok: false, description: error instanceof Error ? error.message : 'error' };
    }
  }

  async registerWebhook(): Promise<{ ok: boolean; description?: string }> {
    const token = this.getToken();
    const url = this.getWebhookUrl();
    const secret = this.getWebhookSecret();
    if (!token || !url || !secret) throw new HttpException('Telegram webhook no está configurado', HttpStatus.SERVICE_UNAVAILABLE);

    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url, secret_token: secret, allowed_updates: ['message'] }),
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await response.json()) as { ok?: boolean; description?: string };
    if (!response.ok || !body.ok) throw new Error(body.description || `Telegram HTTP ${response.status}`);

    void this.syncBotCommands().catch(() => {});
    return { ok: true, description: body.description };
  }

  async getWebhookDiagnostics() {
    const token = this.getToken();
    const webhookUrl = this.getWebhookUrl() || '';
    const botUsername = (this.config.get<string>('TELEGRAM_BOT_USERNAME') || process.env.TELEGRAM_BOT_USERNAME || '')
      .trim()
      .replace(/^@/, '')
      .replace(/["']/g, '');

    if (!token) {
      return {
        configured: false,
        botUsername,
        webhookUrl,
        error: 'TELEGRAM_BOT_TOKEN no está configurado en las variables de entorno',
      };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, {
        signal: AbortSignal.timeout(10_000),
      });
      const data = (await res.json()) as any;
      if (!res.ok || !data.ok) {
        return {
          configured: true,
          botUsername,
          webhookUrl,
          error: data.description || `Telegram API HTTP ${res.status}`,
        };
      }

      const result = data.result || {};
      let lastErrorDate: string | undefined;
      if (result.last_error_date) {
        lastErrorDate = new Date(result.last_error_date * 1000).toISOString();
      }

      return {
        configured: true,
        botUsername,
        webhookUrl,
        webhookInfo: {
          url: result.url || '',
          hasCustomCertificate: Boolean(result.has_custom_certificate),
          pendingUpdateCount: Number(result.pending_update_count || 0),
          lastErrorDate,
          lastErrorMessage: result.last_error_message,
          ipAddress: result.ip_address,
          maxConnections: result.max_connections,
        },
      };
    } catch (err: any) {
      return {
        configured: true,
        botUsername,
        webhookUrl,
        error: err?.message || 'Error al conectar con la API de Telegram',
      };
    }
  }

  async receiveWebhook(body: unknown, providedSecret?: string) {
    const expectedSecret = this.getWebhookSecret();
    if (!expectedSecret || providedSecret !== expectedSecret) throw new UnauthorizedException('Webhook no autorizado');

    const update = this.parseUpdate(body);
    if (!update || update.update_id === undefined) return { accepted: false };
    const chatId = this.getChatId(update);
    if (!chatId || update.message?.chat?.type !== 'private') return { accepted: true, ignored: true };

    try {
      await this.prisma.telegramUpdate.create({ data: { updateId: BigInt(update.update_id) } });
    } catch (error: any) {
      if (error?.code === 'P2002') return { accepted: true, duplicate: true };
      throw error;
    }

    if (!this.allowChat(chatId)) {
      void this.delivery.sendToChat(chatId, 'Has alcanzado el límite temporal de consultas. Intenta de nuevo más tarde.').catch(() => {});
      await this.markProcessed(update.update_id);
      return { accepted: true, rateLimited: true };
    }

    void this.processMessage(update, chatId).catch((error) => {
      this.logger.error(`Error procesando update de Telegram: ${error instanceof Error ? error.message : 'error'}`);
      void this.delivery.sendToChat(chatId, 'No pude procesar tu solicitud ahora. Intenta de nuevo más tarde.').catch(() => {});
    });

    return { accepted: true };
  }

  private async processMessage(update: TelegramUpdate, chatId: string): Promise<void> {
    try {
      const text = update.message?.text?.trim() || '';
      const username = update.message?.from?.username;
      const command = text.split(/\s+/)[0]?.toLowerCase();

      if (command === '/start') {
        const token = text.replace(/^\/start[=\s]*/i, '').trim();
        if (token) {
          try {
            const link = await this.links.consumeToken(token, chatId, username);
            await this.delivery.sendToChat(
              chatId,
              `¡Cuenta vinculada exitosamente, ${link.firstName}! Ya puedes consultarme sobre inventario, materias primas, productos próximos a vencer, producción y cierres del día.\n\nPuedes usar los botones táctiles abajo, el menú ☰ o hacerme preguntas directas.`,
              undefined,
              TELEGRAM_ASSISTANT_KEYBOARD,
            );
          } catch (error) {
            let message = 'El enlace de vinculación no es válido o ya expiró. Genera uno nuevo desde la aplicación.';
            if (error instanceof HttpException) {
              if (error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
                message = 'Demasiados intentos de vinculación. Intenta de nuevo más tarde.';
              } else if (error.getStatus() === HttpStatus.CONFLICT || error.getStatus() === HttpStatus.BAD_REQUEST) {
                message = error.message;
              }
            }
            await this.delivery.sendToChat(chatId, message);
          }
        } else {
          const existing = await this.links.getActiveByChat(chatId);
          if (existing) {
            await this.delivery.sendToChat(
              chatId,
              '¡Hola de nuevo! Tu cuenta ya está vinculada y activa con el asistente de la panadería. Puedes usar los botones táctiles abajo, el menú ☰ o hacerme cualquier consulta.',
              undefined,
              TELEGRAM_ASSISTANT_KEYBOARD,
            );
          } else {
            await this.delivery.sendToChat(
              chatId,
              '¡Hola! Para vincular tu cuenta con el asistente:\n\n1. Ve al panel de administración de la panadería.\n2. Haz clic en «Asistente Telegram».\n3. Abre el enlace o copia y envía el comando /start con tu código.',
            );
          }
        }
        return;
      }

      const link = await this.links.getActiveByChat(chatId);
      if (!link) {
        await this.delivery.sendToChat(
          chatId,
          'Este chat no está vinculado actualmente. Abre el panel administrativo de la panadería y pulsa en «Asistente Telegram» para vincularlo.',
        );
        return;
      }

      await this.policy.resolveContext(link.userId);
      await this.links.touch(chatId);

      if (command === '/desvincular') {
        await this.links.deactivateByChat(chatId);
        await this.delivery.sendToChat(
          chatId,
          'Tu cuenta fue desvinculada exitosamente. Ya no enviaré información a este chat. Para volver a conectarte, genera un nuevo enlace desde el panel.',
          undefined,
          { remove_keyboard: true },
        );
        return;
      }

      const cleanLower = text.toLowerCase().trim();

      if (command === '/menu' || command === '/ayuda' || cleanLower.includes('menú') || cleanLower.includes('menu') || cleanLower.includes('ayuda')) {
        await this.delivery.sendToChat(
          chatId,
          '📋 ASISTENTE PANADERIA — ACCIONES RÁPIDAS\n\nPuedes tocar cualquiera de los botones abajo o preguntarme en lenguaje natural:\n\n• ⚠️ Materias Bajas: Revisa ingredientes bajo el mínimo.\n• ⏳ Vencimientos: Lotes próximos a vencer en los siguientes 15 días.\n• 📦 Inventario: Existencia de productos o materias primas.\n• 🏭 Producción Hoy: Unidades y latas horneadas hoy.\n\nTambién puedes especificar sucursal o fecha, por ejemplo:\n«¿Cuánta harina queda en Panaderia Buena Vista?»\n«¿Cómo cerró la sucursal ayer?»',
          undefined,
          TELEGRAM_ASSISTANT_KEYBOARD,
        );
        return;
      }

      // Mapeo automático de comandos rápidos a consultas del asistente
      let question = text;
      if (command === '/materias_bajas' || cleanLower.includes('materias bajas')) {
        question = '¿Qué materias primas tienen bajo stock?';
      } else if (command === '/vencimientos' || cleanLower.includes('vencimientos')) {
        question = '¿Qué productos están próximos a vencer en los siguientes 15 días?';
      } else if (command === '/inventario' || cleanLower === '📦 inventario' || cleanLower === 'inventario') {
        question = '¿Cuál es el inventario de productos?';
      } else if (command === '/produccion' || cleanLower.includes('producción hoy') || cleanLower.includes('produccion hoy')) {
        question = '¿Cuál es el reporte de producción registrado hoy?';
      }

      if (!question || question.length > 500) {
        await this.delivery.sendToChat(chatId, 'La pregunta debe tener entre 1 y 500 caracteres.', undefined, TELEGRAM_ASSISTANT_KEYBOARD);
        return;
      }

      const startedAt = Date.now();
      try {
        const answer = await this.assistant.answer(link.userId, question);
        await this.delivery.sendToChat(chatId, answer, undefined, TELEGRAM_ASSISTANT_KEYBOARD);
        this.logger.log(`assistant_request chat=${chatId} user=${link.userId} durationMs=${Date.now() - startedAt} success=true`);
      } catch (error) {
        this.logger.error(`Error asistente/IA user=${link.userId} durationMs=${Date.now() - startedAt} success=false: ${error instanceof Error ? error.message : 'error'}`);
        await this.delivery.sendToChat(chatId, 'No pude consultar esa información ahora. Intenta de nuevo más tarde.', undefined, TELEGRAM_ASSISTANT_KEYBOARD);
      }
    } finally {
      await this.markProcessed(update.update_id);
    }
  }

  private async markProcessed(updateId?: number): Promise<void> {
    if (updateId === undefined) return;
    await this.prisma.telegramUpdate.update({
      where: { updateId: BigInt(updateId) },
      data: { processedAt: new Date() },
    }).catch(() => {});
  }

  private allowChat(chatId: string): boolean {
    const now = Date.now();
    const minuteLimit = Math.max(1, Number(this.config.get('ASSISTANT_MAX_MESSAGES_PER_MINUTE') || 10));
    const dayLimit = Math.max(1, Number(this.config.get('ASSISTANT_MAX_MESSAGES_PER_DAY') || 100));
    const history = (this.rateWindows.get(chatId) || []).filter((timestamp) => now - timestamp < 60_000);
    const dailyHistory = (this.dailyWindows.get(chatId) || []).filter((timestamp) => now - timestamp < 86_400_000);

    if (history.length >= minuteLimit || dailyHistory.length >= dayLimit) {
      this.rateWindows.set(chatId, history);
      this.dailyWindows.set(chatId, dailyHistory);
      return false;
    }

    history.push(now);
    dailyHistory.push(now);
    this.rateWindows.set(chatId, history);
    this.dailyWindows.set(chatId, dailyHistory);
    return true;
  }

  private parseUpdate(body: unknown): TelegramUpdate | null {
    if (!body || typeof body !== 'object') return null;
    const candidate = body as Record<string, unknown>;
    if (typeof candidate.update_id !== 'number') return null;
    return candidate as unknown as TelegramUpdate;
  }

  private getChatId(update: TelegramUpdate): string | null {
    const value = update.message?.chat?.id;
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    return String(value);
  }

  private getToken(): string {
    return this.config.get<string>('TELEGRAM_BOT_TOKEN') || process.env.TELEGRAM_BOT_TOKEN || '';
  }

  private getWebhookUrl(): string {
    return this.config.get<string>('TELEGRAM_WEBHOOK_URL') || process.env.TELEGRAM_WEBHOOK_URL || '';
  }

  private getWebhookSecret(): string {
    return this.config.get<string>('TELEGRAM_WEBHOOK_SECRET') || process.env.TELEGRAM_WEBHOOK_SECRET || '';
  }
}
