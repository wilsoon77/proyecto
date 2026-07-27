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

  async sendToUser(userId: string, title: string, message: string): Promise<void> {
    const link = await this.prisma.telegramLink.findFirst({
      where: { userId, active: true },
      select: { chatId: true },
    });
    if (!link) return;
    await this.sendToChat(link.chatId, `${title}\n${message}`);
  }

  async sendToChat(chatId: string, text: string): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN') || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;

    for (const chunk of this.splitMessage(text)) {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 300);
        this.logger.error(`Telegram sendMessage HTTP ${response.status}: ${detail}`);
        throw new Error(`Telegram sendMessage failed with HTTP ${response.status}`);
      }

      const body = (await response.json()) as { ok?: boolean; description?: string };
      if (!body.ok) throw new Error(body.description || 'Telegram rechazó el mensaje');
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
