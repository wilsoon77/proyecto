import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import bcryptjs from 'bcryptjs';
const bcrypt = bcryptjs.default || bcryptjs;
import { randomBytes } from 'crypto';

/**
 * TokenService — Gestión de JWT access tokens y refresh tokens.
 * 
 * Aplica: nestjs-service-layer (SRP — solo maneja tokens, no lógica de auth)
 * 
 * Responsabilidades:
 *  - Firmar access tokens (JWT)
 *  - Crear, validar y rotar refresh tokens
 *  - Revocar refresh tokens (single y global)
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Firma un access token JWT con userId y role.
   * Expira en 15 minutos.
   */
  signAccessToken(userId: string, role: string): string {
    return this.jwt.sign({ sub: userId, role }, { expiresIn: '15m' });
  }

  /**
   * Crea un refresh token hasheado y lo persiste en la base de datos.
   * Formato del token: "{userId}.{random}" para que el lookup sea O(user's devices).
   */
  async createRefreshToken(
    userId: string,
    metadata?: { userAgent?: string; ip?: string },
    expirationDays: number = 7,
  ): Promise<string> {
    const random = randomBytes(32).toString('hex');
    const token = `${userId}.${random}`;
    const hashedToken = await bcrypt.hash(random, 10);
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

  /**
   * Valida un refresh token y devuelve el token record con el user.
   * Retorna null si no es válido.
   */
  async validateRefreshToken(refreshToken: string): Promise<any | null> {
    const dotIndex = refreshToken.indexOf('.');
    if (dotIndex === -1) return null;

    const tokenUserId = refreshToken.substring(0, dotIndex);
    const tokenRandom = refreshToken.substring(dotIndex + 1);
    if (!tokenUserId || !tokenRandom) return null;

    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId: tokenUserId, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    for (const token of tokens) {
      const isValid = await bcrypt.compare(tokenRandom, token.hashedToken);
      if (isValid) return token;
    }

    return null;
  }

  /**
   * Revoca un refresh token específico por su ID.
   */
  async revokeToken(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoca un refresh token específico buscando por su valor.
   */
  async revokeByValue(userId: string, refreshToken: string): Promise<void> {
    const dotIndex = refreshToken.indexOf('.');
    const tokenRandom = dotIndex !== -1 ? refreshToken.substring(dotIndex + 1) : refreshToken;

    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
    });

    for (const token of tokens) {
      const isValid = await bcrypt.compare(tokenRandom, token.hashedToken);
      if (isValid) {
        await this.revokeToken(token.id);
        break;
      }
    }
  }

  /**
   * Revoca TODOS los refresh tokens de un usuario (logout global).
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
