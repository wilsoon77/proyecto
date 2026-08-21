import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AssistantPolicyService } from '../assistant/assistant-policy.service.js';

function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class TelegramLinkService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly policy: AssistantPolicyService,
  ) {}

  async createLinkSession(userId: string) {
    await this.policy.assertEligible(userId);
    const username = (this.config.get<string>('TELEGRAM_BOT_USERNAME') || process.env.TELEGRAM_BOT_USERNAME || '')
      .trim()
      .replace(/^@/, '')
      .replace(/["']/g, '');
    if (!username) throw new ServiceUnavailableException('Telegram no está configurado');

    const rawToken = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Clean up expired or already used tokens older than 1 hour, leaving recent valid tokens intact
    await this.prisma.telegramLinkToken.deleteMany({
      where: {
        userId,
        OR: [
          { usedAt: { not: null } },
          { expiresAt: { lt: new Date() } },
        ],
      },
    }).catch(() => {});

    await this.prisma.telegramLinkToken.create({
      data: { userId, tokenHash: hashToken(rawToken), expiresAt },
    });

    await this.audit.log({
      userId,
      userName: await this.audit.getUserName(userId),
      action: 'TELEGRAM_LINK_SESSION_CREATED',
      entity: 'TelegramLinkToken',
      details: { expiresAt: expiresAt.toISOString() },
    });

    const startCommand = `/start ${rawToken}`;
    const webDeepLink = `https://t.me/${username}?start=${rawToken}`;
    const appDeepLink = `tg://resolve?domain=${encodeURIComponent(username)}&start=${rawToken}`;

    return {
      token: rawToken,
      startCommand,
      deepLink: webDeepLink,
      webDeepLink,
      appDeepLink,
      expiresAt,
      botUsername: username,
    };
  }

  async getStatus(userId: string) {
    const link = await this.prisma.telegramLink.findUnique({
      where: { userId },
      select: { active: true, username: true, linkedAt: true, lastSeenAt: true, chatId: true },
    });
    return {
      configured: Boolean(this.config.get<string>('TELEGRAM_BOT_TOKEN') || process.env.TELEGRAM_BOT_TOKEN),
      linked: Boolean(link?.active),
      username: link?.active ? link.username : null,
      chatId: link?.active ? link.chatId : null,
      linkedAt: link?.active ? link.linkedAt : null,
      lastSeenAt: link?.active ? link.lastSeenAt : null,
    };
  }

  async consumeToken(rawToken: string, chatId: string, username?: string) {
    await this.assertLinkAllowed(chatId);
    const cleanToken = (rawToken || '').trim();
    if (!cleanToken || cleanToken.length > 200) {
      await this.recordFailedLinkAttempt(chatId, 'invalid_token_format');
      throw new BadRequestException('Token de vinculación inválido');
    }
    const now = new Date();
    const tokenHash = hashToken(cleanToken);

    let linked: { userId: string; firstName: string; username: string | null };
    try {
      linked = await this.prisma.$transaction(async (tx) => {
      const token = await tx.telegramLinkToken.findFirst({
        where: { tokenHash, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
        select: { id: true, userId: true },
      });
      if (!token) throw new BadRequestException('El enlace de vinculación expiró o ya fue utilizado');

      const user = await tx.user.findUnique({
        where: { id: token.userId },
        select: {
          id: true,
          firstName: true,
          role: true,
          isActive: true,
          assistantAccess: { select: { enabled: true, scope: true } },
        },
      });
      if (
        !user ||
        !user.isActive ||
        (user.role !== 'ADMIN' && user.role !== 'MANAGER')
      ) {
        throw new BadRequestException('La cuenta ya no puede vincularse al asistente');
      }

      // Auto-provision assistantAccess if not present
      if (!user.assistantAccess?.enabled) {
        await tx.assistantAccess.upsert({
          where: { userId: user.id },
          update: { enabled: true, scope: 'ALL_BRANCHES' },
          create: { userId: user.id, enabled: true, scope: 'ALL_BRANCHES' },
        });
      }

      // Claim the one-time token with a conditional update
      const claimed = await tx.telegramLinkToken.updateMany({
        where: { id: token.id, usedAt: null, revokedAt: null },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException('El enlace de vinculación expiró o ya fue utilizado');
      }

      // If this Telegram chatId is already actively linked to another account, reject with clear message
      const existingChat = await tx.telegramLink.findUnique({ where: { chatId } });
      if (existingChat && existingChat.active && existingChat.userId !== user.id) {
        throw new ConflictException('Este chat de Telegram ya está vinculado a otra cuenta. Si deseas cambiar de cuenta, escribe /desvincular primero en este chat.');
      }

      // If this chatId was previously linked to another user and is inactive, delete that stale record to avoid unique key conflict on chatId
      if (existingChat && existingChat.userId !== user.id) {
        await tx.telegramLink.delete({ where: { id: existingChat.id } });
      }

      // Upsert the link for the user
      const link = await tx.telegramLink.upsert({
        where: { userId: user.id },
        update: {
          chatId,
          active: true,
          username: username || null,
          linkedAt: now,
          unlinkedAt: null,
          lastSeenAt: now,
        },
        create: {
          userId: user.id,
          chatId,
          username: username || null,
          active: true,
          linkedAt: now,
          lastSeenAt: now,
        },
      });

      return { userId: user.id, firstName: user.firstName, username: link.username };
      });
    } catch (error) {
      await this.recordFailedLinkAttempt(chatId, this.getFailureReason(error));
      throw error;
    }

    await this.audit.log({
      userId: linked.userId,
      userName: await this.audit.getUserName(linked.userId),
      action: 'TELEGRAM_LINK_CREATED',
      entity: 'TelegramLink',
      entityId: chatId,
      details: { username: linked.username },
    });

    return linked;
  }

  private getMaxFailedAttempts(): number {
    const configured = Number(this.config.get('TELEGRAM_LINK_MAX_FAILED_ATTEMPTS') || 5);
    return Math.max(1, Math.min(20, Number.isFinite(configured) ? configured : 5));
  }

  private getBlockWindowMs(): number {
    const configured = Number(this.config.get('TELEGRAM_LINK_BLOCK_MINUTES') || 15);
    const minutes = Math.max(1, Math.min(24 * 60, Number.isFinite(configured) ? configured : 15));
    return minutes * 60_000;
  }

  private async assertLinkAllowed(chatId: string): Promise<void> {
    const attemptedAt = new Date(Date.now() - this.getBlockWindowMs());
    const failures = await this.prisma.telegramLinkAttempt.count({
      where: { chatId, attemptedAt: { gte: attemptedAt } },
    });
    if (failures >= this.getMaxFailedAttempts()) {
      throw new HttpException('Demasiados intentos de vinculación', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async recordFailedLinkAttempt(chatId: string, reason: string): Promise<void> {
    try {
      await this.prisma.telegramLinkAttempt.create({
        data: { chatId, reason },
      });

      const attemptedAt = new Date(Date.now() - this.getBlockWindowMs());
      const failureCount = await this.prisma.telegramLinkAttempt.count({
        where: { chatId, attemptedAt: { gte: attemptedAt } },
      });
      const maxAttempts = this.getMaxFailedAttempts();

      await this.audit.log({
        userName: 'Telegram',
        action: 'TELEGRAM_LINK_FAILED',
        entity: 'TelegramLink',
        entityId: chatId,
        details: { reason, failureCount },
      });

      if (failureCount === maxAttempts) {
        await this.audit.log({
          userName: 'Telegram',
          action: 'TELEGRAM_LINK_BLOCKED',
          entity: 'TelegramLink',
          entityId: chatId,
          details: { blockMinutes: this.getBlockWindowMs() / 60_000 },
        });
      }
    } catch {
      // A failed audit must not expose token state or change the generic reply.
    }
  }

  private getFailureReason(error: unknown): string {
    if (error instanceof ConflictException) return 'chat_already_linked';
    if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) return 'rate_limited';
    return 'invalid_or_expired_token';
  }

  async getActiveByChat(chatId: string) {
    return this.prisma.telegramLink.findFirst({
      where: { chatId, active: true },
      select: { userId: true, username: true },
    });
  }

  async touch(chatId: string): Promise<void> {
    await this.prisma.telegramLink.updateMany({
      where: { chatId, active: true },
      data: { lastSeenAt: new Date() },
    });
  }

  async deactivateByUser(userId: string): Promise<void> {
    const link = await this.prisma.telegramLink.findUnique({ where: { userId }, select: { id: true, chatId: true } });
    if (!link) return;
    await this.prisma.telegramLink.update({ where: { id: link.id }, data: { active: false, unlinkedAt: new Date() } });
    await this.audit.log({
      userId,
      userName: await this.audit.getUserName(userId),
      action: 'TELEGRAM_LINK_REVOKED',
      entity: 'TelegramLink',
      entityId: link.chatId,
    });
  }

  async deactivateByChat(chatId: string): Promise<void> {
    const link = await this.prisma.telegramLink.findFirst({ where: { chatId, active: true }, select: { id: true, userId: true } });
    if (!link) return;
    await this.prisma.telegramLink.update({ where: { id: link.id }, data: { active: false, unlinkedAt: new Date() } });
    await this.audit.log({
      userId: link.userId,
      userName: await this.audit.getUserName(link.userId),
      action: 'TELEGRAM_LINK_REVOKED',
      entity: 'TelegramLink',
      entityId: chatId,
    });
  }
}
