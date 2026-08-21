import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AssistantBranch {
  id: number;
  name: string;
  slug: string;
}

export interface AssistantContext {
  userId: string;
  role: 'ADMIN' | 'MANAGER';
  firstName: string;
  branches: AssistantBranch[];
  branchIds: number[];
  timezone: string;
}

@Injectable()
export class AssistantPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Revalidates the Telegram user on every message. JWT/link state is not
   * trusted as a permanent permission grant.
   */
  async resolveContext(userId: string): Promise<AssistantContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        role: true,
        isActive: true,
        assistantAccess: {
          select: { enabled: true, scope: true },
        },
      },
    });

    if (!user || !user.isActive || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      throw new ForbiddenException('El usuario no tiene acceso al asistente');
    }

    let assistantAccess = user.assistantAccess;
    if (!assistantAccess && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
      assistantAccess = await this.prisma.assistantAccess.upsert({
        where: { userId: user.id },
        update: { enabled: true, scope: 'ALL_BRANCHES' },
        create: { userId: user.id, enabled: true, scope: 'ALL_BRANCHES' },
      });
    }

    if (!assistantAccess?.enabled) {
      throw new ForbiddenException('El asistente está deshabilitado para este usuario');
    }

    if (assistantAccess.scope !== 'ALL_BRANCHES') {
      throw new ForbiddenException('El alcance del asistente no está configurado');
    }

    const branches = await this.prisma.branch.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { id: 'asc' },
    });

    if (branches.length === 0) {
      throw new ForbiddenException('No existen sucursales configuradas');
    }

    return {
      userId: user.id,
      role: user.role,
      firstName: user.firstName,
      branches,
      branchIds: branches.map((branch) => branch.id),
      timezone: process.env.STORE_TIMEZONE || 'America/Guatemala',
    };
  }

  async assertEligible(userId: string): Promise<AssistantContext> {
    return this.resolveContext(userId);
  }
}
