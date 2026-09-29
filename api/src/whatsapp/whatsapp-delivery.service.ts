import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';

export interface WhatsAppSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class WhatsAppDeliveryService {
  private readonly logger = new Logger(WhatsAppDeliveryService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Verifica si las credenciales de WhatsApp Cloud API están presentes en el entorno.
   */
  isConfigured(): boolean {
    const token = this.getToken();
    const phoneId = this.getPhoneNumberId();
    return Boolean(token && phoneId);
  }

  private getToken(): string | undefined {
    return this.config.get<string>('WHATSAPP_API_TOKEN') || process.env.WHATSAPP_API_TOKEN;
  }

  private getPhoneNumberId(): string | undefined {
    return this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID') || process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  private getTemplateName(): string {
    return this.config.get<string>('WHATSAPP_TEMPLATE_NAME') || process.env.WHATSAPP_TEMPLATE_NAME || 'alerta_inventario';
  }

  private getTemplateLang(): string {
    return this.config.get<string>('WHATSAPP_TEMPLATE_LANG') || process.env.WHATSAPP_TEMPLATE_LANG || 'es_MX';
  }


  /**
   * Normaliza un número telefónico removiendo símbolos +, espacios y guiones, dejando solo dígitos.
   */
  normalizePhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Diagnóstico seguro del estado de WhatsApp (sin exponer tokens ni secretos).
   */
  getDiagnostics() {
    const token = this.getToken();
    const phoneId = this.getPhoneNumberId();
    return {
      isConfigured: Boolean(token && phoneId),
      hasToken: Boolean(token),
      tokenPrefix: token ? `${token.slice(0, 6)}...` : null,
      phoneNumberId: phoneId || null,
      templateName: this.getTemplateName(),
      templateLang: this.getTemplateLang(),
    };
  }

  /**
   * Envía la alerta de notificación por WhatsApp al usuario destino si cuenta con teléfono registrado.
   */
  async sendToUser(
    userId: string,
    title: string,
    message: string,
    _notificationType?: string,
  ): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, firstName: true, lastName: true },
    });

    if (!user || !user.phone) {
      return;
    }

    const recipientName = user.firstName?.trim() || 'Administrador';
    await this.sendTemplateAlert(user.phone, recipientName, title, message);
  }

  /**
   * Envía un mensaje con plantilla de WhatsApp a través de Meta Graph API.
   * Maneja errores y cuotas de forma segura sin interrumpir el flujo del servidor.
   */
  async sendTemplateAlert(
    rawPhone: string,
    recipientName: string,
    title: string,
    message: string,
  ): Promise<WhatsAppSendResult> {
    const token = this.getToken();
    const phoneId = this.getPhoneNumberId();

    if (!token || !phoneId) {
      this.logger.warn('[WhatsApp] Envío omitido: WHATSAPP_API_TOKEN o WHATSAPP_PHONE_NUMBER_ID no configurados.');
      return { ok: false, error: 'Credenciales de WhatsApp no configuradas en entorno' };
    }

    const to = this.normalizePhoneNumber(rawPhone);
    if (!to || to.length < 8) {
      this.logger.warn(`[WhatsApp] Número telefónico inválido (${rawPhone}). Se omitió el despacho.`);
      return { ok: false, error: 'Número de teléfono inválido (debe incluir código de país sin +)' };
    }

    const templateName = this.getTemplateName();
    const templateLang = this.getTemplateLang();

    // Limpieza y límites de seguridad para Meta (máximo 1024 caracteres por variable)
    const safeName = (recipientName || 'Administrador').trim().slice(0, 80);
    const safeTitle = (title || 'Alerta Operativa').trim().slice(0, 150);
    const safeMessage = (message || 'Revisar panel de administración').trim().slice(0, 950);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: templateLang,
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: safeName },
              { type: 'text', text: safeTitle },
              { type: 'text', text: safeMessage },
            ],
          },
        ],
      },
    };

    const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });

      const responseText = await response.text();
      let responseData: any = {};
      try {
        responseData = JSON.parse(responseText);
      } catch {
        // En caso de que Meta devuelva texto plano ante un error de proxy
      }

      if (!response.ok || responseData.error) {
        const errorMsg = responseData.error?.message || responseText.slice(0, 250) || `HTTP ${response.status}`;
        this.logger.error(`[WhatsApp] Error entregando alerta a ${to}: ${errorMsg}`);
        return { ok: false, error: errorMsg };
      }

      const messageId = responseData.messages?.[0]?.id;
      this.logger.log(`[WhatsApp] ✅ Alerta enviada exitosamente a ${to} (ID: ${messageId})`);
      return { ok: true, messageId };
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[WhatsApp] Excepción al despachar mensaje a ${to}: ${errMsg}`);
      return { ok: false, error: errMsg };
    }
  }
}
