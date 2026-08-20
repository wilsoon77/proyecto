import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import bcryptjs from 'bcryptjs';
const bcrypt = bcryptjs.default || bcryptjs;
import { createHash, randomBytes } from 'crypto';

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

  /** Crea un refresh token opaco y guarda solo su SHA-256 indexable. */
  async createRefreshToken(
    userId: string,
    metadata?: { userAgent?: string; ip?: string },
    expirationDays: number = 7,
  ): Promise<string> {
    const token = randomBytes(48).toString('base64url');
    const hashedToken = this.hashToken(token);
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
    if (!refreshToken || refreshToken.length > 512) return null;

    const indexedToken = await this.prisma.refreshToken.findUnique({
      where: { hashedToken: this.hashToken(refreshToken) },
      include: { user: true },
    });
    if (indexedToken && !indexedToken.revokedAt && indexedToken.expiresAt > new Date()) {
      return indexedToken;
    }

    // Transitional compatibility for sessions created before the SHA-256 migration.
    return this.validateLegacyRefreshToken(refreshToken);
  }

  private async validateLegacyRefreshToken(refreshToken: string): Promise<any | null> {
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
    const indexedToken = await this.prisma.refreshToken.findUnique({
      where: { hashedToken: this.hashToken(refreshToken) },
    });
    if (indexedToken?.userId === userId && !indexedToken.revokedAt) {
      await this.revokeToken(indexedToken.id);
      return;
    }

    // Transitional compatibility for sessions created before the SHA-256 migration.
    const dotIndex = refreshToken.indexOf('.');
    if (dotIndex === -1) return;
    const tokenRandom = refreshToken.substring(dotIndex + 1);

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

  private hashToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }
}
