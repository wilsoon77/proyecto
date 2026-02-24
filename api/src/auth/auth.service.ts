import { BadRequestException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import bcryptjs from 'bcryptjs';
const bcrypt = bcryptjs.default || bcryptjs;
import { randomBytes } from 'crypto';
import { LoggerService } from '../common/logger/logger.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService, 
    private jwt: JwtService,
    private logger: LoggerService,
    private supabase: SupabaseService,
  ) {}

  async register(input: { email: string; password: string; firstName: string; lastName: string; phone?: string }, metadata?: { userAgent?: string; ip?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new BadRequestException('Email ya registrado');

    let user;

    // Si Supabase Auth está configurado, crear usuario allí primero
    if (this.supabase.isConfigured()) {
      const { data: authUser, error: authError } = await this.supabase.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true, // Auto-confirmar email
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

      // El trigger en Supabase creará el registro en public.User
      // Esperamos un momento para que el trigger se ejecute
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificamos que el usuario fue creado por el trigger
      user = await this.prisma.user.findUnique({ where: { id: authUser.user.id } });
      
      if (!user) {
        // Si el trigger no lo creó, lo creamos manualmente
        const passwordHash = await bcrypt.hash(input.password, 10);
        user = await this.prisma.user.create({
          data: {
            id: authUser.user.id, // Usar el mismo ID de Supabase Auth
            email: input.email,
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
          },
        });
      } else {
        // Actualizar el passwordHash ya que el trigger no lo puede saber
        const passwordHash = await bcrypt.hash(input.password, 10);
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });
      }
    } else {
      // Fallback: crear solo en la tabla User (comportamiento anterior)
      const passwordHash = await bcrypt.hash(input.password, 10);
      user = await this.prisma.user.create({ data: { email: input.email, passwordHash, firstName: input.firstName, lastName: input.lastName, phone: input.phone } });
    }
    
    const accessToken = this.sign(user.id, user.role);
    const refreshToken = await this.createRefreshToken(user.id, metadata);
    
    this.logger.info('Usuario registrado', { userId: user.id, email: user.email, action: 'REGISTER', ip: metadata?.ip, supabaseAuth: this.supabase.isConfigured() });
    
    return { 
      token: accessToken,
      refreshToken, 
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } 
    };
  }

  async login(input: { email: string; password: string; rememberMe?: boolean; deviceId?: string }, metadata?: { userAgent?: string; ip?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    
    // Registrar intento de login
    const loginAttempt = {
      email: input.email,
      ipAddress: metadata?.ip || 'unknown',
      deviceId: input.deviceId,
      success: false,
    };

    if (!user || !user.isActive) {
      await this.prisma.loginAttempt.create({ data: loginAttempt });
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      await this.prisma.loginAttempt.create({ data: loginAttempt });
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    // Login exitoso
    await this.prisma.loginAttempt.create({ data: { ...loginAttempt, success: true } });
    
    // Si hay deviceId, marcar como dispositivo de confianza
    if (input.deviceId) {
      await this.prisma.trustedDevice.upsert({
        where: { userId_deviceId: { userId: user.id, deviceId: input.deviceId } },
        update: { lastUsedAt: new Date(), userAgent: metadata?.userAgent },
        create: {
          userId: user.id,
          deviceId: input.deviceId,
          userAgent: metadata?.userAgent,
          name: this.parseDeviceName(metadata?.userAgent),
        },
      });
    }
    
    const accessToken = this.sign(user.id, user.role);
    // Extender refresh token a 30 días si rememberMe está activado
    const refreshToken = await this.createRefreshToken(user.id, metadata, input.rememberMe ? 30 : 7);
    
    this.logger.auditLogin(user.id, user.email, metadata?.ip, metadata?.userAgent);
    
    return { 
      token: accessToken, 
      refreshToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } 
    };
  }

  // Verificar si se requiere captcha para un email/IP
  async requiresCaptcha(email: string, ip: string, deviceId?: string): Promise<boolean> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Si el dispositivo es de confianza, no requerir captcha
    if (deviceId) {
      const trustedDevice = await this.prisma.trustedDevice.findFirst({
        where: {
          deviceId,
          user: { email },
        },
      });
      if (trustedDevice) return false;
    }
    
    // Contar intentos fallidos recientes
    const failedAttempts = await this.prisma.loginAttempt.count({
      where: {
        OR: [
          { email, success: false, createdAt: { gte: fiveMinutesAgo } },
          { ipAddress: ip, success: false, createdAt: { gte: fiveMinutesAgo } },
        ],
      },
    });
    
    // Requerir captcha después de 3 intentos fallidos
    return failedAttempts >= 3;
  }

  // Parsear nombre amigable del dispositivo desde User-Agent
  private parseDeviceName(userAgent?: string): string {
    if (!userAgent) return 'Dispositivo desconocido';
    
    // Detectar navegador
    let browser = 'Navegador';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // Detectar OS
    let os = '';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'Mac';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    
    return os ? `${browser} en ${os}` : browser;
  }

  async refresh(refreshToken: string, metadata?: { userAgent?: string; ip?: string }) {
    // Buscar todos los refresh tokens activos del usuario
    const tokens = await this.prisma.refreshToken.findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    // Verificar si el token coincide con alguno hasheado
    let validToken: any = null;
    for (const token of tokens) {
      const isValid = await bcrypt.compare(refreshToken, token.hashedToken);
      if (isValid) {
        validToken = token;
        break;
      }
    }

    if (!validToken) throw new UnauthorizedException('Refresh token inválido o expirado');
    if (!validToken.user.isActive) throw new UnauthorizedException('Usuario desactivado');

    // Revocar token anterior (rotación)
    await this.prisma.refreshToken.update({
      where: { id: validToken.id },
      data: { revokedAt: new Date() },
    });

    // Crear nuevo access token y refresh token
    const newAccessToken = this.sign(validToken.user.id, validToken.user.role);
    const newRefreshToken = await this.createRefreshToken(validToken.user.id, metadata);

    return { token: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Revocar solo el token específico
      const tokens = await this.prisma.refreshToken.findMany({
        where: { userId, revokedAt: null },
      });
      
      for (const token of tokens) {
        const isValid = await bcrypt.compare(refreshToken, token.hashedToken);
        if (isValid) {
          await this.prisma.refreshToken.update({
            where: { id: token.id },
            data: { revokedAt: new Date() },
          });
          break;
        }
      }
    } else {
      // Revocar todos los tokens del usuario (logout global)
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    
    this.logger.auditLogout(userId);
    return { message: 'Sesión cerrada' };
  }

  private async createRefreshToken(userId: string, metadata?: { userAgent?: string; ip?: string }, expirationDays: number = 7): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        hashedToken,
        expiresAt,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ip,
      },
    });

    return token;
  }

  private sign(userId: string, role: string) {
    return this.jwt.sign({ sub: userId, role }, { expiresIn: '15m' }); // Access token expira en 15 min
  }

  // Obtiene usuario actual (por simplicidad, leeremos el userId desde un campo temporal en contexto más adelante).
  async me(userId?: string) {
    if (!userId) throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        branch: {
          select: { id: true, name: true, slug: true },
        },
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
    const user = await this.prisma.user.update({ where: { id: userId }, data: { firstName: input.firstName, lastName: input.lastName, phone: input.phone } });
    return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, isActive: user.isActive, role: user.role };
  }

  /**
   * Actualiza la contraseña del usuario en la base de datos local.
   * Este método se usa cuando el usuario cambia su contraseña desde Supabase Auth.
   */
  async updatePassword(userId: string | undefined, newPassword: string) {
    if (!userId) throw new UnauthorizedException();
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // También actualizar en Supabase Auth si está configurado
    if (this.supabase.isConfigured()) {
      const { error } = await this.supabase.admin.updateUserById(userId, {
        password: newPassword,
      });
      
      if (error) {
        this.logger.warn(`Error actualizando password en Supabase Auth: ${error.message}`, { userId });
      }
    }

    this.logger.info('Contraseña actualizada', { userId, email: user.email, action: 'PASSWORD_CHANGE' });
    
    return { success: true };
  }

  /**
   * Reset de contraseña usando un token de Supabase.
   * Este método es llamado desde el frontend después de que Supabase Auth validó el token.
   */
  async resetPasswordWithSupabaseToken(supabaseUserId: string, newPassword: string) {
    // Buscar usuario por ID de Supabase
    const user = await this.prisma.user.findUnique({ where: { id: supabaseUserId } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await this.prisma.user.update({
      where: { id: supabaseUserId },
      data: { passwordHash },
    });

    this.logger.info('Contraseña reseteada via Supabase', { userId: user.id, email: user.email, action: 'PASSWORD_RESET' });
    
    return { success: true };
  }

  async deactivate(userId: string | undefined) {
    if (!userId) throw new UnauthorizedException();
    // Revocar todos los refresh tokens al desactivar
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const user = await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    return { id: user.id, email: user.email, isActive: user.isActive };
  }

  async handleOAuthCallback(
    input: { supabaseUserId: string; email: string; firstName: string; lastName?: string; avatarUrl?: string; provider?: string },
    metadata?: { userAgent?: string; ip?: string }
  ) {
    // Buscar si el usuario ya existe en nuestra tabla User
    let user = await this.prisma.user.findUnique({ where: { id: input.supabaseUserId } });

    if (!user) {
      // Buscar por email (por si el usuario existía antes de OAuth)
      user = await this.prisma.user.findUnique({ where: { email: input.email } });
      
      if (user) {
        // Actualizar el ID para que coincida con Supabase Auth
        // Esto requiere eliminar y recrear para cambiar el ID primario
        this.logger.info(`Usuario OAuth existente por email, actualizando: ${input.email}`);
      } else {
        // Crear nuevo usuario
        user = await this.prisma.user.create({
          data: {
            id: input.supabaseUserId,
            email: input.email,
            passwordHash: '', // OAuth no usa password
            firstName: input.firstName,
            lastName: input.lastName || '',
            phone: null,
          },
        });
        this.logger.info(`Usuario OAuth creado: ${input.email}`, { provider: input.provider });
      }
    }

    if (!user) {
      throw new BadRequestException('No se pudo crear o encontrar el usuario');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    // Generar tokens
    const accessToken = this.sign(user.id, user.role);
    const refreshToken = await this.createRefreshToken(user.id, metadata);

    this.logger.info('Login OAuth exitoso', { userId: user.id, email: user.email, provider: input.provider, ip: metadata?.ip });

    return {
      token: accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    };
  }
}
