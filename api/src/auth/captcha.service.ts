import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';

interface HCaptchaVerificationResponse {
  success: boolean;
  hostname?: string;
  'error-codes'?: string[];
}

@Injectable()
export class CaptchaService {
  isConfigured(): boolean {
    return Boolean(process.env.HCAPTCHA_SECRET);
  }

  /**
   * Verifica el token emitido por hCaptcha en el servidor. La comprobación en
   * el navegador únicamente mejora la experiencia de usuario y no es una
   * barrera de seguridad.
   */
  async verify(token: string | undefined, remoteIp?: string): Promise<void> {
    const secret = process.env.HCAPTCHA_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('La verificación anti-bots no está configurada.');
      }

      // Permite pruebas locales sin credenciales de hCaptcha. En producción
      // nunca se alcanza este punto: la solicitud se rechaza arriba.
      return;
    }

    if (!token) {
      throw new BadRequestException('Completa la verificación de seguridad.');
    }

    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp && remoteIp !== 'unknown') {
      body.set('remoteip', remoteIp);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    try {
      const response = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: controller.signal,
      });
      const result = await response.json() as HCaptchaVerificationResponse;

      if (!response.ok || !result.success) {
        throw new BadRequestException('La verificación de seguridad no fue válida.');
      }

      const allowedHostnames = (process.env.HCAPTCHA_ALLOWED_HOSTNAMES || '')
        .split(',')
        .map((hostname) => hostname.trim().toLowerCase())
        .filter(Boolean);
      if (
        allowedHostnames.length > 0
        && (!result.hostname || !allowedHostnames.includes(result.hostname.toLowerCase()))
      ) {
        throw new BadRequestException('La verificación de seguridad no corresponde a este sitio.');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new ServiceUnavailableException('No se pudo validar la verificación de seguridad. Intenta nuevamente.');
    } finally {
      clearTimeout(timeout);
    }
  }
}
