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
        this.logger.error('Error creando usuario en Supabase Auth', { error: authError.message, email: input.email });
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

  async login(input: { email: string; password: string }, metadata?: { userAgent?: string; ip?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    
    const accessToken = this.sign(user.id, user.role);
    const refreshToken = await this.createRefreshToken(user.id, metadata);
    
    this.logger.auditLogin(user.id, user.email, metadata?.ip, metadata?.userAgent);
    
    return { 
      token: accessToken, 
      refreshToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } 
    };
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

  private async createRefreshToken(userId: string, metadata?: { userAgent?: string; ip?: string }): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, isActive: user.isActive, role: user.role };
  }

  async updateMe(userId: string | undefined, input: { firstName?: string; lastName?: string; phone?: string }) {
    if (!userId) throw new UnauthorizedException();
    const user = await this.prisma.user.update({ where: { id: userId }, data: { firstName: input.firstName, lastName: input.lastName, phone: input.phone } });
    return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, isActive: user.isActive, role: user.role };
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
}
