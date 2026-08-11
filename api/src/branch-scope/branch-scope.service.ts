import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface BranchActor {
  userId?: string;
  role?: string;
}

const GLOBAL_SCOPE_ROLES = new Set(['ADMIN', 'MANAGER']);
const BRANCH_SCOPED_ROLES = new Set(['BAKER', 'CASHIER']);

/**
 * Resuelve el alcance operativo de una petición autenticada.
 *
 * ADMIN puede consultar y operar transversalmente. Los roles operativos se
 * limitan a la sucursal almacenada en User.branchId, no a datos enviados por
 * el navegador. CUSTOMER no usa este servicio porque solo puede operar sus
 * propios recursos a través de las reglas específicas de cada controlador.
 */
@Injectable()
export class BranchScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveBranchId(actor: BranchActor, requestedBranchId?: number): Promise<number | undefined> {
    if (this.isGlobalRole(actor)) {
      this.validateRequestedBranchId(requestedBranchId);
      return requestedBranchId;
    }

    const assigned = await this.getAssignedBranch(actor);
    if (requestedBranchId !== undefined) {
      if (!Number.isInteger(requestedBranchId) || requestedBranchId <= 0) {
        throw new BadRequestException('branchId inválido');
      }
      if (requestedBranchId !== assigned.id) {
        throw new ForbiddenException('No puedes operar fuera de tu sucursal asignada');
      }
    }

    return assigned.id;
  }

  async resolveBranchSlug(actor: BranchActor, requestedBranchSlug?: string): Promise<string | undefined> {
    if (this.isGlobalRole(actor)) return requestedBranchSlug;

    const assigned = await this.getAssignedBranch(actor);
    if (requestedBranchSlug && requestedBranchSlug !== assigned.slug) {
      throw new ForbiddenException('No puedes operar fuera de tu sucursal asignada');
    }

    return assigned.slug;
  }

  async resolveWriteBranchId(actor: BranchActor, requestedBranchId?: number): Promise<number | undefined> {
    if (requestedBranchId !== undefined) return this.resolveBranchId(actor, requestedBranchId);
    if (actor.role === 'ADMIN') return undefined;
    const assigned = await this.getAssignedBranch(actor);
    return assigned.id;
  }

  async resolveWriteBranchSlug(actor: BranchActor, requestedBranchSlug?: string): Promise<string | undefined> {
    if (requestedBranchSlug) return this.resolveBranchSlug(actor, requestedBranchSlug);
    if (actor.role === 'ADMIN') return undefined;
    const assigned = await this.getAssignedBranch(actor);
    return assigned.slug;
  }

  async assertBranchAccess(actor: BranchActor, branchId?: number | null): Promise<void> {
    if (this.isGlobalRole(actor)) return;

    const assigned = await this.getAssignedBranch(actor);
    if (!branchId || branchId !== assigned.id) {
      throw new ForbiddenException('No puedes operar fuera de tu sucursal asignada');
    }
  }

  async assertOrderAccess(actor: BranchActor, orderId: number): Promise<void> {
    if (this.isGlobalRole(actor)) return;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { branchId: true },
    });

    // El servicio de pedidos conservará el 404 si la orden no existe.
    if (order) await this.assertBranchAccess(actor, order.branchId);
  }

  private async getAssignedBranch(actor: BranchActor): Promise<{ id: number; slug: string }> {
    if (!actor.userId) throw new UnauthorizedException('Usuario autenticado requerido');
    if (!actor.role || (!BRANCH_SCOPED_ROLES.has(actor.role) && !GLOBAL_SCOPE_ROLES.has(actor.role))) {
      throw new ForbiddenException('Este rol no tiene alcance operativo de sucursal');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: {
        branch: {
          select: { id: true, slug: true },
        },
      },
    });

    if (!user?.branch) {
      throw new ForbiddenException('El usuario no tiene una sucursal asignada');
    }

    return user.branch;
  }

  private isGlobalRole(actor: BranchActor): boolean {
    return actor.role !== undefined && GLOBAL_SCOPE_ROLES.has(actor.role);
  }

  private validateRequestedBranchId(branchId?: number): void {
    if (branchId !== undefined && (!Number.isInteger(branchId) || branchId <= 0)) {
      throw new BadRequestException('branchId invÃ¡lido');
    }
  }
}
