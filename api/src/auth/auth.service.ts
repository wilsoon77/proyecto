import { BadRequestException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(input: { email: string; password: string; firstName: string; lastName: string; phone?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new BadRequestException('Email ya registrado');
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({ data: { email: input.email, passwordHash, firstName: input.firstName, lastName: input.lastName, phone: input.phone } });
    return { token: this.sign(user.id, user.role), user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } };
  }

  async login(input: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return { token: this.sign(user.id, user.role), user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } };
  }

  private sign(userId: string, role: string) {
    return this.jwt.sign({ sub: userId, role });
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
    const user = await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    return { id: user.id, email: user.email, isActive: user.isActive };
  }
}
