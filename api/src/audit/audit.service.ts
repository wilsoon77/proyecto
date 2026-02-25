import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateAuditLogData {
  userId?: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  entityName?: string;
  details?: object;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  entity?: string;
  action?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registrar una acción en el historial de auditoría
   */
  async log(data: CreateAuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          userName: data.userName,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          entityName: data.entityName,
          details: data.details ? JSON.stringify(data.details) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // No lanzar error para no interrumpir la operación principal
      console.error('Error al registrar auditoría:', error);
    }
  }

  /**
   * Obtener historial de auditoría con filtros
   */
  async findAll(filters: AuditLogFilters = {}) {
    const {
      entity,
      action,
      userId,
      startDate,
      endDate,
      search,
      page = 1,
      pageSize = 50,
    } = filters;

    const where: any = {};

    if (entity) {
      where.entity = entity;
    }

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { entityName: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: data.map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalToday, byEntity, byAction, recentUsers] = await Promise.all([
      // Total de acciones hoy
      this.prisma.auditLog.count({
        where: { createdAt: { gte: today } },
      }),
      // Agrupado por entidad
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        _count: { entity: true },
        orderBy: { _count: { entity: 'desc' } },
        take: 10,
      }),
      // Agrupado por acción
      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
      }),
      // Usuarios más activos (últimos 7 días)
      this.prisma.auditLog.groupBy({
        by: ['userId', 'userName'],
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          userId: { not: null },
        },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      totalToday,
      byEntity: byEntity.map((e) => ({ entity: e.entity, count: e._count.entity })),
      byAction: byAction.map((a) => ({ action: a.action, count: a._count.action })),
      recentUsers: recentUsers.map((u) => ({
        userId: u.userId,
        userName: u.userName,
        count: u._count.userId,
      })),
    };
  }

  /**
   * Obtener valores únicos para filtros
   */
  async getFilterOptions() {
    const [entities, actions] = await Promise.all([
      this.prisma.auditLog.findMany({
        select: { entity: true },
        distinct: ['entity'],
        orderBy: { entity: 'asc' },
      }),
      this.prisma.auditLog.findMany({
        select: { action: true },
        distinct: ['action'],
        orderBy: { action: 'asc' },
      }),
    ]);

    return {
      entities: entities.map((e) => e.entity),
      actions: actions.map((a) => a.action),
    };
  }
}
