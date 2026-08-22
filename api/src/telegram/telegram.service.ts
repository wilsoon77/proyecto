import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssistantPolicyService } from '../assistant/assistant-policy.service.js';
import { AssistantService } from '../assistant/assistant.service.js';
import { TelegramDeliveryService } from './telegram-delivery.service.js';
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
    if (!webhookUrl) {
      this.logger.warn('Telegram configurado sin TELEGRAM_WEBHOOK_URL; registra el webhook manualmente antes de producción.');
      return;
    }

    void this.registerWebhook().catch((error) => {
      this.logger.error(`No se pudo registrar el webhook de Telegram: ${error instanceof Error ? error.message : 'error'}`);
    });
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
    return { ok: true, description: body.description };
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
              `¡Cuenta vinculada exitosamente, ${link.firstName}! Ya puedes consultarme sobre inventario, materias primas, productos próximos a vencer, producción y cierres del día.\n\nEscribe /ayuda para ver ejemplos de preguntas.`,
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
              '¡Hola de nuevo! Tu cuenta ya está vinculada y activa con el asistente de la panadería. Puedes hacerme cualquier consulta operativa o escribir /ayuda para ver ejemplos.',
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
        );
        return;
      }

      if (command === '/ayuda') {
        await this.delivery.sendToChat(
          chatId,
          'Puedes preguntarme, por ejemplo:\n• ¿Cuánta azúcar queda?\n• ¿Qué materia prima está baja en una sucursal específica?\n• ¿Qué productos vencen en los próximos 15 días?\n• ¿Qué se produjo del 10/08/2026 al 12/08/2026?\n• ¿Cómo cerró la sucursal Central ayer?\n\nTambién puedes usar “hoy”, “ayer”, “esta semana” o indicar una sucursal.',
        );
        return;
      }

      if (!text || text.length > 500) {
        await this.delivery.sendToChat(chatId, 'La pregunta debe tener entre 1 y 500 caracteres.');
        return;
      }

      const startedAt = Date.now();
      try {
        const answer = await this.assistant.answer(link.userId, text);
        await this.delivery.sendToChat(chatId, answer);
        this.logger.log(`assistant_request chat=${chatId} user=${link.userId} durationMs=${Date.now() - startedAt} success=true`);
      } catch (error) {
        this.logger.error(`Error asistente/IA user=${link.userId} durationMs=${Date.now() - startedAt} success=false: ${error instanceof Error ? error.message : 'error'}`);
        await this.delivery.sendToChat(chatId, 'No pude consultar esa información ahora. Intenta de nuevo más tarde.');
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
