import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubscribePushDto } from './dto/subscribe-push.dto.js';
import webpush from 'web-push';
import { TelegramDeliveryService } from '../telegram/telegram-delivery.service.js';
import { AlertType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramDeliveryService,
  ) {
    // Configure VAPID details
    const subject = process.env.VAPID_SUBJECT || 'mailto:soporte@panaderiasvetlana.com';
    const publicKey = process.env.VAPID_PUBLIC_KEY || '';
    const privateKey = process.env.VAPID_PRIVATE_KEY || '';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } else {
      console.warn('[PUSH] VAPID keys are not fully configured in environment variables.');
    }
  }

  /**
   * Registra una suscripción push para un usuario
   */
  async subscribe(userId: string, dto: SubscribePushDto, userAgent?: string): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: {
        userId,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent,
      },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent,
      },
    });
  }

  /**
   * Elimina una suscripción push
   */
  async unsubscribe(endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
  }

  /**
   * Retorna las configuraciones de notificación (ADMIN)
   */
  async getConfigs() {
    return this.prisma.notificationConfig.findMany({
      orderBy: { category: 'asc' },
    });
  }

  /**
   * Actualiza una configuración de notificación (ADMIN)
   */
  async updateConfig(key: string, data: any) {
    const config = await this.prisma.notificationConfig.findUnique({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException(`Configuración de notificación '${key}' no encontrada`);
    }

    return this.prisma.notificationConfig.update({
      where: { key },
      data,
    });
  }

  /**
   * Obtiene el historial de notificaciones in-app de un usuario
   */
  async getHistory(userId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Obtiene el diagnóstico del estado del servicio push
   */
  async getDiagnostics(userId: string) {
    const hasPublicKey = !!process.env.VAPID_PUBLIC_KEY;
    const hasPrivateKey = !!process.env.VAPID_PRIVATE_KEY;
    const hasSubject = !!process.env.VAPID_SUBJECT;
    const isVapidConfigured = hasPublicKey && hasPrivateKey && hasSubject;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
      }
    });

    return {
      vapidConfigured: isVapidConfigured,
      vapidDetails: {
        publicKey: hasPublicKey,
        privateKey: hasPrivateKey,
        subject: hasSubject,
      },
      activeSubscriptions: subscriptions.length,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 50) + '...',
        userAgent: sub.userAgent || 'Desconocido',
        createdAt: sub.createdAt,
      })),
    };
  }

  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(id: number, userId: string): Promise<void> {
    const notif = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notif) {
      throw new NotFoundException('Notificación no encontrada');
    }

    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Envía una notificación a un usuario específico
   */
  async sendToUser(
    userId: string,
    configKey: string,
    placeholders: Record<string, any>,
    url?: string,
    icon?: string
  ): Promise<void> {
    const config = await this.prisma.notificationConfig.findUnique({
      where: { key: configKey },
    });

    if (!config || !config.isEnabled) return;

    const formattedTitle = this.formatMessage(config.title, placeholders);
    const formattedMessage = this.formatMessage(config.message, placeholders);

    // 1. Guardar en base de datos (In-app history)
    const notif = await this.prisma.notification.create({
      data: {
        userId,
        type: configKey,
        title: formattedTitle,
        message: formattedMessage,
        url,
        icon: icon || this.getDefaultIcon(configKey),
        metadata: placeholders,
      },
    });

    // 2. Entregar por Web Push y Telegram de forma independiente.
    const payload = JSON.stringify({
      id: notif.id,
      title: formattedTitle,
      message: formattedMessage,
      url: url || '/',
      type: configKey,
      soundType: config.soundType,
    });

    const results = await Promise.allSettled([
      this.sendWebPush(payload, userId),
      this.telegram.sendToUser(userId, formattedTitle, formattedMessage),
    ]);

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('[NOTIFICATIONS] Un canal de entrega falló:', result.reason);
      }
    }
  }

  private async sendWebPush(payload: string, userId: string): Promise<void> {
    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    await Promise.all(subs.map(async (sub) => {
      try {
        console.log(`[PUSH] Intentando enviar notificación a dispositivo (ID: ${sub.id}) del usuario ${userId}`);
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }, payload);
        console.log(`[PUSH] ✅ Éxito al enviar a dispositivo (ID: ${sub.id})`);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.warn(`[PUSH] ⚠️ Suscripción expirada o inválida (ID: ${sub.id}). Eliminando de la base de datos.`);
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error(`[PUSH] ❌ Error al despachar notificación push (ID: ${sub.id}):`, error.statusCode, error.body || error.message);
        }
      }
    }));
  }

  /**
   * Envía una notificación a todos los usuarios con ciertos roles
   */
  async sendToRoles(
    roles: string[],
    configKey: string,
    placeholders: Record<string, any>,
    url?: string,
    icon?: string
  ): Promise<void> {
    const requestedBranchId = Number(placeholders.branchId);
    const where: any = {
      role: { in: roles as any },
      isActive: true,
    };

    if (Number.isInteger(requestedBranchId) && requestedBranchId > 0) {
      where.OR = [
        { role: 'ADMIN' },
        { role: 'MANAGER', assistantAccess: { is: { enabled: true, scope: 'ALL_BRANCHES' } } },
        { branchId: requestedBranchId },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    const sendPromises = users.map((u) =>
      this.sendToUser(u.id, configKey, placeholders, url, icon)
    );

    await Promise.all(sendPromises);
  }

  /**
   * Despacha una notificación basándose en la configuración del evento
   */
  async sendByConfig(
    configKey: string,
    placeholders: Record<string, any>,
    url?: string,
    icon?: string
  ): Promise<void> {
    const config = await this.prisma.notificationConfig.findUnique({
      where: { key: configKey },
    });

    if (!config || !config.isEnabled) return;

    const targetRoles = config.targetRoles as string[];
    
    // Si la notificación va dirigida a un cliente (CUSTOMER) y tenemos su userId, se la enviamos a él
    if (targetRoles.includes('CUSTOMER') && placeholders.userId) {
      await this.sendToUser(placeholders.userId, configKey, placeholders, url, icon);
    } else {
      await this.sendToRoles(targetRoles, configKey, placeholders, url, icon);
    }
  }

  /**
   * Compara un valor contra el umbral configurado
   */
  async checkThreshold(configKey: string, currentValue: number): Promise<boolean> {
    const config = await this.prisma.notificationConfig.findUnique({
      where: { key: configKey },
    });

    if (!config || !config.isEnabled || !config.thresholds) return false;

    const thresholdsObj = config.thresholds as Record<string, any>;
    const threshold = Number(thresholdsObj.threshold);
    
    if (isNaN(threshold)) return false;

    return currentValue <= threshold;
  }

  /**
   * Notifica únicamente cuando un recurso cruza a estado bajo. El mismo
   * recurso vuelve a notificar después de resolverse y cruzar nuevamente.
   */
  async sendLowStockIfNeeded(options: {
    alertType: 'RAW_MATERIAL_LOW' | 'PRODUCT_LOW';
    branchId: number;
    resourceKey: string;
    configKey: string;
    currentValue: number;
    threshold?: number | null;
    placeholders: Record<string, any>;
    url?: string;
    icon?: string;
  }): Promise<boolean> {
    const config = await this.prisma.notificationConfig.findUnique({ where: { key: options.configKey } });
    if (!config || !config.isEnabled) return false;

    const configuredThreshold = Number((config.thresholds as Record<string, any> | null)?.threshold);
    const threshold = options.threshold ?? configuredThreshold;
    if (!Number.isFinite(threshold)) return false;

    const where = {
      branchId_alertType_resourceKey: {
        branchId: options.branchId,
        alertType: options.alertType as AlertType,
        resourceKey: options.resourceKey,
      },
    };

    if (options.currentValue > threshold) {
      await this.prisma.alertState.upsert({
        where,
        update: { active: false, resolvedAt: new Date() },
        create: {
          branchId: options.branchId,
          alertType: options.alertType as AlertType,
          resourceKey: options.resourceKey,
          active: false,
          resolvedAt: new Date(),
        },
      });
      return false;
    }

    const state = await this.prisma.alertState.findUnique({ where });
    if (state?.active) return false;

    await this.prisma.alertState.upsert({
      where,
      update: { active: true, firstTriggeredAt: state?.firstTriggeredAt || new Date(), lastNotifiedAt: new Date(), resolvedAt: null },
      create: {
        branchId: options.branchId,
        alertType: options.alertType as AlertType,
        resourceKey: options.resourceKey,
        active: true,
        firstTriggeredAt: new Date(),
        lastNotifiedAt: new Date(),
      },
    });

    await this.sendByConfig(options.configKey, { ...options.placeholders, branchId: options.branchId }, options.url, options.icon);
    return true;
  }

  /**
   * Helper para formatear mensajes reemplazando placeholders
   */
  private formatMessage(text: string, placeholders: Record<string, any>): string {
    let formatted = text;
    for (const [key, val] of Object.entries(placeholders)) {
      const stringVal = String(val);
      formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), stringVal);
      formatted = formatted.replace(new RegExp(`#{${key}}`, 'g'), stringVal);
    }
    // Remover emojis genéricos si existiera alguno remanente en el texto
    formatted = formatted.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '');
    return formatted;
  }

  /**
   * Helper para obtener el icono por defecto de una clave/categoría
   */
  private getDefaultIcon(configKey: string): string {
    if (configKey.startsWith('order.')) return 'ShoppingCart';
    if (configKey.startsWith('inventory.')) return 'AlertTriangle';
    if (configKey.startsWith('production.')) return 'Flame';
    if (configKey.startsWith('system.')) return 'Shield';
    return 'Bell';
  }
}
