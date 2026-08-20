import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { LoggerService } from '../common/logger/logger.service.js';
import bcryptjs from 'bcryptjs';
const bcrypt = bcryptjs.default || bcryptjs;

/**
 * PasswordService — Hashing, validación, y sincronización de contraseñas.
 * 
 * Aplica: nestjs-service-layer (SRP — solo maneja passwords)
 * 
 * Responsabilidades:
 *  - Hash y comparación de contraseñas (bcrypt)
 *  - Actualización de contraseña (local + Supabase)
 *  - Reset de contraseña via token de recuperación de Supabase
 */
@Injectable()
export class PasswordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Hashea una contraseña con bcrypt (cost factor 10).
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compara una contraseña en texto plano con un hash.
   */
  async compare(password: string, hash: string | null | undefined): Promise<boolean> {
    if (!hash) return false;
    return bcrypt.compare(password, hash);
  }

  /**
   * Supabase Auth is the source of truth when configured. The local hash is
   * only used by standalone deployments without Supabase Auth.
   */
  async updatePassword(userId: string | undefined, newPassword: string) {
    if (!userId) throw new UnauthorizedException();

    if (this.supabase.isConfigured()) {
      const { error } = await this.supabase.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        throw new BadRequestException(`No se pudo actualizar la contraseña en Supabase Auth: ${error.message}`);
      }

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: null },
      });
      this.logger.info('Contraseña actualizada', { userId, email: user.email, action: 'PASSWORD_CHANGE', provider: 'supabase' });
      return { success: true };
    }

    const passwordHash = await this.hash(newPassword);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.logger.info('Contraseña actualizada', { userId, email: user.email, action: 'PASSWORD_CHANGE' });

    return { success: true };
  }

  /**
   * Resetea la contraseña usando un token temporal de recuperación de Supabase.
   * El frontend primero actualiza Supabase Auth y luego llama este método
   * para sincronizar la contraseña en la tabla User local.
   */
  async resetPasswordWithSupabaseToken(recoveryAccessToken: string, newPassword: string) {
    if (!this.supabase.isConfigured()) {
      throw new BadRequestException('Recuperación de contraseña no configurada');
    }

    const { data, error } = await this.supabase.client.auth.getUser(recoveryAccessToken);
    if (error || !data.user) {
      throw new UnauthorizedException('Token de recuperación inválido o expirado');
    }

    const supabaseUserId = data.user.id;
    const supabaseEmail = data.user.email ?? undefined;

    // Buscar por ID de Supabase; fallback por email para casos legacy
    let user = await this.prisma.user.findUnique({ where: { id: supabaseUserId } });
    if (!user && supabaseEmail) {
      user = await this.prisma.user.findUnique({ where: { email: supabaseEmail } });
    }
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    // Supabase already changed the credential; keep no second local secret.
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: null } });

    this.logger.info('Contraseña reseteada via token de recuperación', {
      userId: user.id,
      email: user.email,
      action: 'PASSWORD_RESET',
      viaRecoveryToken: true,
    });

    return { success: true };
  }
}
