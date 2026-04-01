import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * SessionService — Gestión de sesiones, intentos de login, y dispositivos de confianza.
 * 
 * Aplica: nestjs-service-layer (SRP — solo maneja sesiones y seguridad anti-brute-force)
 * 
 * Responsabilidades:
 *  - Registrar intentos de login (éxito/fallo)
 *  - Verificar si se requiere captcha basado en intentos recientes
 *  - Gestionar dispositivos de confianza (trusted devices)
 */
@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un intento de login en la base de datos.
   */
  async recordLoginAttempt(data: {
    email: string;
    ipAddress: string;
    deviceId?: string;
    success: boolean;
  }): Promise<void> {
    await this.prisma.loginAttempt.create({ data });
  }

  /**
   * Verifica si se requiere captcha para un email/IP dados.
   * Se requiere después de 3 intentos fallidos en los últimos 5 minutos.
   * Dispositivos de confianza están exentos.
   */
  async requiresCaptcha(email: string, ip: string, deviceId?: string): Promise<boolean> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Dispositivos de confianza no requieren captcha
    if (deviceId) {
      const trustedDevice = await this.prisma.trustedDevice.findFirst({
        where: { deviceId, user: { email } },
      });
      if (trustedDevice) return false;
    }

    // Contar intentos fallidos recientes por email o IP
    const failedAttempts = await this.prisma.loginAttempt.count({
      where: {
        OR: [
          { email, success: false, createdAt: { gte: fiveMinutesAgo } },
          { ipAddress: ip, success: false, createdAt: { gte: fiveMinutesAgo } },
        ],
      },
    });

    return failedAttempts >= 3;
  }

  /**
   * Registra o actualiza un dispositivo de confianza tras login exitoso.
   */
  async upsertTrustedDevice(
    userId: string,
    deviceId: string,
    metadata?: { userAgent?: string },
  ): Promise<void> {
    await this.prisma.trustedDevice.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      update: { lastUsedAt: new Date(), userAgent: metadata?.userAgent },
      create: {
        userId,
        deviceId,
        userAgent: metadata?.userAgent,
        name: this.parseDeviceName(metadata?.userAgent),
      },
    });
  }

  /**
   * Parsea un nombre amigable del dispositivo desde el User-Agent.
   */
  parseDeviceName(userAgent?: string): string {
    if (!userAgent) return 'Dispositivo desconocido';

    let browser = 'Navegador';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    let os = '';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'Mac';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    return os ? `${browser} en ${os}` : browser;
  }
}
