import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TelegramDeliveryService {
  private readonly logger = new Logger(TelegramDeliveryService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('TELEGRAM_BOT_TOKEN') || process.env.TELEGRAM_BOT_TOKEN);
  }

  async sendToUser(userId: string, title: string, message: string, notificationType?: string): Promise<void> {
    const link = await this.prisma.telegramLink.findFirst({
      where: { userId, active: true },
      select: { chatId: true },
    });
    if (!link) return;
    const formatted = this.formatAlert(title, message, notificationType);
    await this.sendToChat(link.chatId, formatted);
  }

  /**
   * Agrega emoji de advertencia ÚNICA Y EXCLUSIVAMENTE a:
   * 1. Alerta de Materia Prima baja
   * 2. Alerta de Producto próximo a vencer / Caducidad
   * Para cualquier otra notificación o mensaje, se envía texto limpio sin emojis.
   */
  formatAlert(title: string, message: string, notificationType?: string): string {
    const normalizedTitle = title.toLowerCase();

    // La configuración es la fuente confiable. El fallback solo mira el título
    // para mantener compatibilidad con mensajes antiguos, nunca el nombre de un
    // ingrediente dentro del cuerpo.
    const isRawMaterialLow = notificationType === 'inventory.raw_material_low'
      || normalizedTitle.includes('materia prima baja')
      || normalizedTitle.includes('stock bajo');
    const isExpirationWarning = notificationType === 'inventory.expiration_warning'
      || normalizedTitle.includes('caduc')
      || normalizedTitle.includes('vence')
      || normalizedTitle.includes('venc');

    if (isRawMaterialLow || isExpirationWarning) {
      return `⚠️ ${title}\n\n${message}`;
    }

    // Resto de notificaciones sin emojis
    return `${title}\n\n${message}`;
  }

  async sendToChat(chatId: string, text: string, parseMode?: 'Markdown' | 'HTML'): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN') || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;

    for (const chunk of this.splitMessage(text)) {
      try {
        const sendRequest = async (message: string, mode?: 'Markdown' | 'HTML') => {
          const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              ...(mode ? { parse_mode: mode } : {}),
              disable_web_page_preview: true,
            }),
            signal: AbortSignal.timeout(15_000),
          });
          const rawBody = await response.text();
          let body: { ok?: boolean; description?: string } = {};
          try {
            body = JSON.parse(rawBody) as { ok?: boolean; description?: string };
          } catch {
            // Telegram puede devolver texto plano cuando hay un error HTTP.
          }
          if (!response.ok || !body.ok) {
            const detail = body.description || rawBody.slice(0, 300) || `HTTP ${response.status}`;
            throw new Error(`Telegram sendMessage failed: ${detail}`);
          }
        };

        try {
          await sendRequest(chunk, parseMode);
        } catch (error) {
          // Si falla con parse_mode (por sintaxis), reintentar y validar texto plano.
          if (!parseMode) throw error;
          await sendRequest(chunk.replace(/[*_`]/g, ''));
        }
      } catch (error) {
        this.logger.error(`Error enviando mensaje a Telegram chat ${chatId}: ${error instanceof Error ? error.message : 'error'}`);
        throw error;
      }
    }
  }

  private splitMessage(text: string): string[] {
    const normalized = text.trim() || 'Sin contenido';
    const chunks: string[] = [];
    for (let index = 0; index < normalized.length; index += 3900) {
      chunks.push(normalized.slice(index, index + 3900));
    }
    return chunks;
  }
}
