import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubscribePushDto } from './dto/subscribe-push.dto.js';
import webpush from 'web-push';
import { TelegramDeliveryService } from '../telegram/telegram-delivery.service.js';
import { WhatsAppDeliveryService } from '../whatsapp/whatsapp-delivery.service.js';
import { AlertType } from '@prisma/client';
import { formatHumanExpirationDate } from '../common/time/business-date.js';

export interface NotificationDeliveryAuditRecipient {
  userId: string;
  name: string;
  email: string;
  role: string;
  channels: {
    inApp: 'ENVIADO' | 'FALLIDO' | 'DESHABILITADO';
    whatsapp: 'ENVIADO' | 'OMITIDO_DUPLICADO' | 'SIN_TELEFONO' | 'NO_CONFIGURADO' | 'FALLIDO' | 'DESHABILITADO';
    whatsappPhone?: string;
    telegram: 'ENVIADO' | 'OMITIDO_DUPLICADO' | 'NO_VINCULADO' | 'NO_CONFIGURADO' | 'FALLIDO' | 'DESHABILITADO';
    telegramChat?: string;
    push: 'ENVIADO' | 'SIN_SUSCRIPCION' | 'NO_CONFIGURADO' | 'FALLIDO' | 'DESHABILITADO';
    pushCount?: number;
  };
}

export interface NotificationDeliveryAudit {
  totalEvaluatedUsers: number;
  targetRoles: string[];
  configKey: string;
  summary: {
    inAppSent: number;
    whatsappSent: number;
    whatsappSkippedDuplicate: number;
    whatsappNoPhone: number;
    telegramSent: number;
    telegramNotLinked: number;
    pushSent: number;
    pushNoSubscription: number;
  };
  recipients: NotificationDeliveryAuditRecipient[];
}

/**
 * Reglas de negocio que generan notificaciones automáticas.
 * El resto de eventos del sistema se consulta en sus respectivos módulos;
 * no deben convertirse en alertas operativas para los dueños.
 */
export const OPERATIONAL_NOTIFICATION_CONFIG_KEYS = [
  'inventory.raw_material_low',
  'inventory.expiration_warning',
] as const;

type OperationalNotificationConfigKey = typeof OPERATIONAL_NOTIFICATION_CONFIG_KEYS[number];

function isOperationalNotificationConfigKey(key: string): key is OperationalNotificationConfigKey {
  return (OPERATIONAL_NOTIFICATION_CONFIG_KEYS as readonly string[]).includes(key);
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramDeliveryService,
    private readonly whatsapp: WhatsAppDeliveryService,
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
      where: { key: { in: [...OPERATIONAL_NOTIFICATION_CONFIG_KEYS] } },
      orderBy: { category: 'asc' },
    });
  }

  /**
   * Actualiza una configuración de notificación (ADMIN)
   */
  async updateConfig(key: string, data: any) {
    if (!isOperationalNotificationConfigKey(key)) {
      throw new BadRequestException('Solo se pueden configurar alertas de materia prima baja y caducidad próxima');
    }

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
        where: { userId, type: { in: [...OPERATIONAL_NOTIFICATION_CONFIG_KEYS] } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.notification.count({ where: { userId, type: { in: [...OPERATIONAL_NOTIFICATION_CONFIG_KEYS] } } }),
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
      where: { userId, isRead: false, type: { in: [...OPERATIONAL_NOTIFICATION_CONFIG_KEYS] } },
    });
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(id: number, userId: string): Promise<void> {
    const notif = await this.prisma.notification.findFirst({
      where: { id, userId, type: { in: [...OPERATIONAL_NOTIFICATION_CONFIG_KEYS] } },
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
      where: { userId, isRead: false, type: { in: [...OPERATIONAL_NOTIFICATION_CONFIG_KEYS] } },
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
    if (!isOperationalNotificationConfigKey(configKey)) {
      throw new BadRequestException(`Regla de notificación no permitida: ${configKey}`);
    }

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

    // 2. Entregar por canales seleccionados (Web Push y Telegram de forma independiente).
    const payload = JSON.stringify({
      id: notif.id,
      title: formattedTitle,
      message: formattedMessage,
      url: url || '/',
      type: configKey,
      soundType: config.soundType,
    });

    const rawChannels = (config as any).channels;
    const defaultChannels = this.whatsapp.isConfigured()
      ? ['IN_APP', 'PUSH', 'TELEGRAM', 'WHATSAPP']
      : ['IN_APP', 'PUSH', 'TELEGRAM'];
    const activeChannels = Array.isArray(rawChannels)
      ? (rawChannels as string[])
      : defaultChannels;

    const promises: Promise<void>[] = [];
    if (activeChannels.includes('PUSH')) {
      promises.push(this.sendWebPush(payload, userId));
    }
    if (activeChannels.includes('TELEGRAM')) {
      promises.push(this.telegram.sendToUser(userId, formattedTitle, formattedMessage, configKey));
    }
    if (activeChannels.includes('WHATSAPP')) {
      promises.push(this.whatsapp.sendToUser(userId, formattedTitle, formattedMessage, configKey));
    }

    const results = await Promise.allSettled(promises);

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
   * Envia una notificacion a todos los usuarios con ciertos roles aplicando deduplicacion por canal.
   * Evita duplicar mensajes de WhatsApp o Telegram si multiples usuarios comparten el mismo telefono o chat.
   */
  async sendToRoles(
    roles: string[],
    configKey: string,
    placeholders: Record<string, any>,
    url?: string,
    icon?: string
  ): Promise<NotificationDeliveryAudit> {
    const requestedBranchId = Number(placeholders.branchId);
    const where: any = {
      role: { in: roles as any },
      isActive: true,
    };

    if (Number.isInteger(requestedBranchId) && requestedBranchId > 0) {
      where.OR = [
        { role: 'ADMIN' },
        { role: 'MANAGER' },
        { branchId: requestedBranchId },
      ];
    }

    const config = await this.prisma.notificationConfig.findUnique({
      where: { key: configKey },
    });

    if (!config || !config.isEnabled) {
      return {
        totalEvaluatedUsers: 0,
        targetRoles: roles,
        configKey,
        summary: {
          inAppSent: 0,
          whatsappSent: 0,
          whatsappSkippedDuplicate: 0,
          whatsappNoPhone: 0,
          telegramSent: 0,
          telegramNotLinked: 0,
          pushSent: 0,
          pushNoSubscription: 0,
        },
        recipients: [],
      };
    }

    const rawChannels = (config as any).channels;
    const defaultChannels = this.whatsapp.isConfigured()
      ? ['IN_APP', 'PUSH', 'TELEGRAM', 'WHATSAPP']
      : ['IN_APP', 'PUSH', 'TELEGRAM'];
    const activeChannels: string[] = Array.isArray(rawChannels)
      ? (rawChannels as string[])
      : defaultChannels;

    const formattedTitle = this.formatMessage(config.title, placeholders);
    const formattedMessage = this.formatMessage(config.message, placeholders);

    const users = await this.prisma.user.findMany({
      where,
      include: {
        telegramLink: true,
        pushSubscriptions: true,
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    });

    const sentPhones = new Set<string>();
    const sentTelegramChats = new Set<string>();
    const sentPushEndpoints = new Set<string>();

    const recipients: NotificationDeliveryAuditRecipient[] = [];

    const summary = {
      inAppSent: 0,
      whatsappSent: 0,
      whatsappSkippedDuplicate: 0,
      whatsappNoPhone: 0,
      telegramSent: 0,
      telegramNotLinked: 0,
      pushSent: 0,
      pushNoSubscription: 0,
    };

    for (const u of users) {
      const recipientName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
      const recAudit: NotificationDeliveryAuditRecipient = {
        userId: u.id,
        name: recipientName,
        email: u.email,
        role: u.role,
        channels: {
          inApp: 'DESHABILITADO',
          whatsapp: 'DESHABILITADO',
          telegram: 'DESHABILITADO',
          push: 'DESHABILITADO',
        },
      };

      // 1. In-App
      if (activeChannels.includes('IN_APP')) {
        try {
          await this.prisma.notification.create({
            data: {
              userId: u.id,
              type: configKey,
              title: formattedTitle,
              message: formattedMessage,
              url,
              icon: icon || this.getDefaultIcon(configKey),
              metadata: placeholders,
            },
          });
          recAudit.channels.inApp = 'ENVIADO';
          summary.inAppSent += 1;
        } catch {
          recAudit.channels.inApp = 'FALLIDO';
        }
      }

      // 2. Web Push
      if (!activeChannels.includes('PUSH')) {
        recAudit.channels.push = 'DESHABILITADO';
      } else if (!u.pushSubscriptions || u.pushSubscriptions.length === 0) {
        recAudit.channels.push = 'SIN_SUSCRIPCION';
        summary.pushNoSubscription += 1;
      } else {
        const payload = JSON.stringify({
          title: formattedTitle,
          message: formattedMessage,
          url: url || '/',
          type: configKey,
          soundType: config.soundType,
        });

        let sentCount = 0;
        for (const sub of u.pushSubscriptions) {
          if (sentPushEndpoints.has(sub.endpoint)) continue;
          sentPushEndpoints.add(sub.endpoint);
          try {
            await webpush.sendNotification({
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            }, payload);
            sentCount += 1;
          } catch (error: any) {
            if (error.statusCode === 410 || error.statusCode === 404) {
              await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            }
          }
        }
        recAudit.channels.push = sentCount > 0 ? 'ENVIADO' : 'FALLIDO';
        recAudit.channels.pushCount = sentCount;
        if (sentCount > 0) summary.pushSent += 1;
      }

      // 3. Telegram
      if (!activeChannels.includes('TELEGRAM')) {
        recAudit.channels.telegram = 'DESHABILITADO';
      } else if (!this.telegram.isConfigured()) {
        recAudit.channels.telegram = 'NO_CONFIGURADO';
      } else if (!u.telegramLink || !u.telegramLink.active) {
        recAudit.channels.telegram = 'NO_VINCULADO';
        summary.telegramNotLinked += 1;
      } else {
        const chatId = u.telegramLink.chatId;
        const tgName = u.telegramLink.username ? `@${u.telegramLink.username}` : `Chat ${chatId}`;
        recAudit.channels.telegramChat = tgName;

        if (sentTelegramChats.has(chatId)) {
          recAudit.channels.telegram = 'OMITIDO_DUPLICADO';
        } else {
          sentTelegramChats.add(chatId);
          try {
            const formatted = this.telegram.formatAlert(formattedTitle, formattedMessage, configKey);
            await this.telegram.sendToChat(chatId, formatted);
            recAudit.channels.telegram = 'ENVIADO';
            summary.telegramSent += 1;
          } catch {
            recAudit.channels.telegram = 'FALLIDO';
          }
        }
      }

      // 4. WhatsApp (con deduplicacion de telefonos compartidos)
      if (!activeChannels.includes('WHATSAPP')) {
        recAudit.channels.whatsapp = 'DESHABILITADO';
      } else if (!this.whatsapp.isConfigured()) {
        recAudit.channels.whatsapp = 'NO_CONFIGURADO';
      } else if (!u.phone) {
        recAudit.channels.whatsapp = 'SIN_TELEFONO';
        summary.whatsappNoPhone += 1;
      } else {
        const cleanPhone = this.whatsapp.normalizePhoneNumber(u.phone);
        recAudit.channels.whatsappPhone = cleanPhone;

        if (sentPhones.has(cleanPhone)) {
          recAudit.channels.whatsapp = 'OMITIDO_DUPLICADO';
          summary.whatsappSkippedDuplicate += 1;
        } else {
          sentPhones.add(cleanPhone);
          const sendRes = await this.whatsapp.sendTemplateAlert(
            u.phone,
            u.firstName || 'Administrador',
            formattedTitle,
            formattedMessage,
          );
          if (sendRes.ok) {
            recAudit.channels.whatsapp = 'ENVIADO';
            summary.whatsappSent += 1;
          } else {
            recAudit.channels.whatsapp = 'FALLIDO';
          }
        }
      }

      recipients.push(recAudit);
    }

    return {
      totalEvaluatedUsers: users.length,
      targetRoles: roles,
      configKey,
      summary,
      recipients,
    };
  }

  /**
   * Despacha una notificacion basandose en la configuracion del evento.
   * Retorna la auditoria de entrega para analisis operativo y pruebas.
   */
  async sendByConfig(
    configKey: string,
    placeholders: Record<string, any>,
    url?: string,
    icon?: string
  ): Promise<NotificationDeliveryAudit | null> {
    if (!isOperationalNotificationConfigKey(configKey)) return null;

    const config = await this.prisma.notificationConfig.findUnique({
      where: { key: configKey },
    });

    if (!config || !config.isEnabled) return null;

    const targetRoles = config.targetRoles as string[];
    
    // Si la notificacion va dirigida a un cliente (CUSTOMER) y tenemos su userId, se la enviamos a el
    if (targetRoles.includes('CUSTOMER') && placeholders.userId) {
      await this.sendToUser(placeholders.userId, configKey, placeholders, url, icon);
      return null;
    } else {
      return this.sendToRoles(targetRoles, configKey, placeholders, url, icon);
    }
  }

  /**
   * Compara un valor contra el umbral configurado
   */
  async checkThreshold(configKey: string, currentValue: number): Promise<boolean> {
    if (!isOperationalNotificationConfigKey(configKey)) return false;

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
    alertType: 'RAW_MATERIAL_LOW';
    branchId: number;
    resourceKey: string;
    configKey: 'inventory.raw_material_low';
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
   * Sends an expiration alert once per lot and reminder stage.
   * The lot id and days-before value are part of resourceKey, so each
   * configured reminder is delivered once and remains independently traceable.
   */
  async sendExpirationIfNeeded(options: {
    branchId: number;
    resourceKey: string;
    configKey: 'inventory.expiration_warning';
    placeholders: Record<string, any>;
    url?: string;
    icon?: string;
  }): Promise<boolean> {
    const config = await this.prisma.notificationConfig.findUnique({ where: { key: options.configKey } });
    if (!config || !config.isEnabled) return false;

    const where = {
      branchId_alertType_resourceKey: {
        branchId: options.branchId,
        alertType: AlertType.PRODUCT_EXPIRY,
        resourceKey: options.resourceKey,
      },
    };
    const state = await this.prisma.alertState.findUnique({ where });
    if (state?.active) return false;

    await this.prisma.alertState.upsert({
      where,
      update: {
        active: true,
        firstTriggeredAt: state?.firstTriggeredAt || new Date(),
        lastNotifiedAt: new Date(),
        resolvedAt: null,
      },
      create: {
        branchId: options.branchId,
        alertType: AlertType.PRODUCT_EXPIRY,
        resourceKey: options.resourceKey,
        active: true,
        firstTriggeredAt: new Date(),
        lastNotifiedAt: new Date(),
      },
    });

    await this.sendByConfig(
      options.configKey,
      { ...options.placeholders, branchId: options.branchId },
      options.url,
      options.icon,
    );
    return true;
  }

  async resolveExpirationAlertsForLot(branchId: number, lotId: number): Promise<void> {
    await this.prisma.alertState.updateMany({
      where: {
        branchId,
        alertType: AlertType.PRODUCT_EXPIRY,
        resourceKey: { startsWith: `lot:${lotId}:` },
        active: true,
      },
      data: { active: false, resolvedAt: new Date() },
    });
  }

  /**
   * Helper para formatear mensajes reemplazando placeholders.
   * Si la clave es expiresAt o representa una fecha, aplica formato legible en espanol (ej. 1 sept 2026).
   */
  private formatMessage(text: string, placeholders: Record<string, any>): string {
    let formatted = text;
    for (const [key, val] of Object.entries(placeholders)) {
      let stringVal = String(val ?? '');
      if (
        (key === 'expiresAt' || key.toLowerCase().includes('date') || key.toLowerCase().includes('fecha')) &&
        (typeof val === 'string' || val instanceof Date)
      ) {
        stringVal = formatHumanExpirationDate(val);
      }
      formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), stringVal);
      formatted = formatted.replace(new RegExp(`#{${key}}`, 'g'), stringVal);
    }
    // Remover emojis genericos si existiera alguno remanente en el texto
    formatted = formatted.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '');
    return formatted;
  }

  /**
   * Helper para obtener el icono por defecto de una clave/categoría
   */
  private getDefaultIcon(configKey: string): string {
    if (configKey.startsWith('inventory.')) return 'AlertTriangle';
    return 'Bell';
  }

  /**
   * Retorna el estado de configuración de WhatsApp Cloud API
   */
  getWhatsAppDiagnostics() {
    return this.whatsapp.getDiagnostics();
  }

  /**
   * Envía una notificación de prueba directa a un número de WhatsApp o al teléfono del usuario
   */
  async sendWhatsAppTest(
    toPhoneOrUserId?: string,
    recipientName?: string,
    title?: string,
    message?: string,
  ) {
    let phone = toPhoneOrUserId;
    let name = recipientName || 'Administrador';

    // Si parece un userId (cuid) y no un número puramente numérico, buscar el teléfono del usuario
    if (toPhoneOrUserId && !/^\+?\d{8,15}$/.test(toPhoneOrUserId.trim())) {
      const user = await this.prisma.user.findUnique({
        where: { id: toPhoneOrUserId },
        select: { phone: true, firstName: true },
      });
      if (user?.phone) phone = user.phone;
      if (user?.firstName) name = user.firstName;
    }

    if (!phone) {
      return { ok: false, error: 'No se encontró un número telefónico asignado para la prueba.' };
    }

    return this.whatsapp.sendTemplateAlert(
      phone,
      name,
      title || 'Alerta de Prueba',
      message || 'Esta es una notificación de prueba del sistema de Panadería Svetlana.',
    );
  }
}
