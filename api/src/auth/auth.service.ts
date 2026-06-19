import { BadRequestException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoggerService } from '../common/logger/logger.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { TokenService } from './token.service.js';
import { PasswordService } from './password.service.js';
import { SessionService } from './session.service.js';

/**
 * AuthService — Orquestador de autenticación.
 * 
 * Aplica: nestjs-service-layer (orquestador delgado, delega a servicios especializados)
 * 
 * Este servicio orquesta los flujos de: register, login, refresh, logout, OAuth, perfil.
 * La lógica específica vive en:
 *  - TokenService: JWT + refresh tokens
 *  - PasswordService: hashing + reset + Supabase sync
 *  - SessionService: login attempts + captcha + trusted devices
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly supabase: SupabaseService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
  ) {}

  // ─── Flujo de Registro ─────────────────────────────────────────

  async register(
    input: { email: string; password: string; firstName: string; lastName: string; phone?: string },
    metadata?: { userAgent?: string; ip?: string },
  ) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new BadRequestException('Email ya registrado');

    let user;

    if (this.supabase.isConfigured()) {
      const { data: authUser, error: authError } = await this.supabase.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          first_name: input.firstName,
          last_name: input.lastName,
          phone: input.phone,
        },
      });

      if (authError) {
        this.logger.error(`Error creando usuario en Supabase Auth: ${authError.message} - Email: ${input.email}`);
        throw new BadRequestException(authError.message);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      user = await this.prisma.user.findUnique({ where: { id: authUser.user.id } });

      if (!user) {
        const passwordHash = await this.passwordService.hash(input.password);
        user = await this.prisma.user.create({
          data: {
            id: authUser.user.id,
            email: input.email,
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
          },
        });
      } else {
        const passwordHash = await this.passwordService.hash(input.password);
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });
      }
    } else {
      const passwordHash = await this.passwordService.hash(input.password);
      user = await this.prisma.user.create({
        data: { email: input.email, passwordHash, firstName: input.firstName, lastName: input.lastName, phone: input.phone },
      });
    }

    const accessToken = this.tokenService.signAccessToken(user.id, user.role);
    const refreshToken = await this.tokenService.createRefreshToken(user.id, metadata);

    this.logger.info('Usuario registrado', { userId: user.id, email: user.email, action: 'REGISTER', ip: metadata?.ip, supabaseAuth: this.supabase.isConfigured() });

    return {
      token: accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    };
  }

  // ─── Flujo de Login ────────────────────────────────────────────

  async login(
    input: { email: string; password: string; rememberMe?: boolean; deviceId?: string },
    metadata?: { userAgent?: string; ip?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });

    const attemptData = {
      email: input.email,
      ipAddress: metadata?.ip || 'unknown',
      deviceId: input.deviceId,
      success: false,
    };

    if (!user || !user.isActive) {
      await this.sessionService.recordLoginAttempt(attemptData);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const ok = await this.passwordService.compare(input.password, user.passwordHash);
    if (!ok) {
      await this.sessionService.recordLoginAttempt(attemptData);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Login exitoso
    await this.sessionService.recordLoginAttempt({ ...attemptData, success: true });

    // Registrar dispositivo de confianza si hay deviceId
    if (input.deviceId) {
      await this.sessionService.upsertTrustedDevice(user.id, input.deviceId, { userAgent: metadata?.userAgent });
    }

    const accessToken = this.tokenService.signAccessToken(user.id, user.role);
    const refreshToken = await this.tokenService.createRefreshToken(user.id, metadata, input.rememberMe ? 30 : 7);

    this.logger.auditLogin(user.id, user.email, metadata?.ip, metadata?.userAgent);

    return {
      token: accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    };
  }

  // ─── Captcha ───────────────────────────────────────────────────

  async requiresCaptcha(email: string, ip: string, deviceId?: string): Promise<boolean> {
    return this.sessionService.requiresCaptcha(email, ip, deviceId);
  }

  // ─── Refresh Token ─────────────────────────────────────────────

  async refresh(refreshToken: string, metadata?: { userAgent?: string; ip?: string }) {
    const validToken = await this.tokenService.validateRefreshToken(refreshToken);

    if (!validToken) throw new UnauthorizedException('Refresh token inválido o expirado');
    if (!validToken.user.isActive) throw new UnauthorizedException('Usuario desactivado');

    // Revocar token anterior (rotación)
    await this.tokenService.revokeToken(validToken.id);

    // Crear nuevos tokens
    const newAccessToken = this.tokenService.signAccessToken(validToken.user.id, validToken.user.role);
    const newRefreshToken = await this.tokenService.createRefreshToken(validToken.user.id, metadata);

    return { token: newAccessToken, refreshToken: newRefreshToken };
  }

  // ─── Logout ────────────────────────────────────────────────────

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.tokenService.revokeByValue(userId, refreshToken);
    } else {
      await this.tokenService.revokeAllForUser(userId);
    }

    this.logger.auditLogout(userId);
    return { message: 'Sesión cerrada' };
  }

  // ─── Perfil de Usuario ─────────────────────────────────────────

  async me(userId?: string) {
    if (!userId) throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        branch: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      role: user.role,
      branchId: user.branchId,
      branch: user.branch,
    };
  }

  async updateMe(userId: string | undefined, input: { firstName?: string; lastName?: string; phone?: string }) {
    if (!userId) throw new UnauthorizedException();
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { firstName: input.firstName, lastName: input.lastName, phone: input.phone },
    });
    return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, isActive: user.isActive, role: user.role };
  }

  // ─── Password (delega a PasswordService) ───────────────────────

  async updatePassword(userId: string | undefined, newPassword: string) {
    return this.passwordService.updatePassword(userId, newPassword);
  }

  async resetPasswordWithSupabaseToken(recoveryAccessToken: string, newPassword: string) {
    return this.passwordService.resetPasswordWithSupabaseToken(recoveryAccessToken, newPassword);
  }

  // ─── Desactivar Cuenta ─────────────────────────────────────────

  async deactivate(userId: string | undefined) {
    if (!userId) throw new UnauthorizedException();
    await this.tokenService.revokeAllForUser(userId);
    const user = await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    return { id: user.id, email: user.email, isActive: user.isActive };
  }

  // ─── OAuth Callback ────────────────────────────────────────────

  async handleOAuthCallback(
    input: { supabaseUserId: string; email: string; firstName: string; lastName?: string; avatarUrl?: string; provider?: string },
    metadata?: { userAgent?: string; ip?: string },
  ) {
    let user = await this.prisma.user.findUnique({ where: { id: input.supabaseUserId } });

    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email: input.email } });

      if (user) {
        this.logger.info(`Usuario OAuth existente por email, actualizando: ${input.email}`);
      } else {
        try {
          user = await this.prisma.user.create({
            data: {
              id: input.supabaseUserId,
              email: input.email,
              passwordHash: '',
              firstName: input.firstName,
              lastName: input.lastName || '',
              phone: null,
            },
          });
          this.logger.info(`Usuario OAuth creado: ${input.email}`, { provider: input.provider });
        } catch (error: any) {
          // Si falló por constraint único (Prisma P2002), es probable que el trigger de Supabase
          // (on_auth_user_created) ya haya insertado el registro de forma concurrente.
          if (error.code === 'P2002') {
            this.logger.warn(`Conflicto de inserción por constraint único en OAuth para ${input.email}. Reintentando búsqueda.`);
            user = await this.prisma.user.findUnique({ where: { id: input.supabaseUserId } });
            if (!user) {
              user = await this.prisma.user.findUnique({ where: { email: input.email } });
            }
            if (!user) {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }
    }

    if (!user) throw new BadRequestException('No se pudo crear o encontrar el usuario');
    if (!user.isActive) throw new UnauthorizedException('Usuario desactivado');

    const accessToken = this.tokenService.signAccessToken(user.id, user.role);
    const refreshToken = await this.tokenService.createRefreshToken(user.id, metadata);

    this.logger.info('Login OAuth exitoso', { userId: user.id, email: user.email, provider: input.provider, ip: metadata?.ip });

    return {
      token: accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    };
  }
}
