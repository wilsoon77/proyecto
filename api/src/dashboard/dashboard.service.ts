import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total de órdenes (todos los tiempos)
    const totalOrders = await this.prisma.order.count();

    // Ingresos totales (de órdenes entregadas)
    const revenueData = await this.prisma.order.aggregate({
      where: { status: 'DELIVERED' },
      _sum: { total: true },
    });
    const totalRevenue = revenueData._sum.total ?? 0;

    // Órdenes en los últimos 30 días
    const ordersLast30Days = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
      },
    });

    // Ingresos en los últimos 30 días
    const revenueLast30Days = ordersLast30Days
      .filter((o) => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + Number(o.total ?? 0), 0);

    // Productos con bajo inventario (disponibles < 5 unidades)
    const lowStockSimple = await this.prisma.$queryRaw<
      Array<{ productId: number; productName: string; branchName: string; available: number }>
    >`
      SELECT 
        i."productId",
        p.name as "productName",
        b.name as "branchName",
        (i.quantity - i.reserved) as available
      FROM "Inventory" i
      JOIN "Product" p ON i."productId" = p.id
      JOIN "Branch" b ON i."branchId" = b.id
      WHERE (i.quantity - i.reserved) < 5 AND i.quantity > 0
      ORDER BY available ASC
      LIMIT 10
    `;

    // Productos más vendidos
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const topProductDetails = await this.prisma.product.findMany({
      where: {
        id: { in: topProducts.map((p) => p.productId) },
      },
      select: { id: true, name: true, slug: true },
    });

    const topProductsMap = new Map(topProductDetails.map((p) => [p.id, p]));
    const topProductsResult = topProducts.map((p) => ({
      productId: p.productId,
      name: topProductsMap.get(p.productId)?.name ?? 'Desconocido',
      slug: topProductsMap.get(p.productId)?.slug ?? '',
      totalSold: p._sum.quantity ?? 0,
    }));

    // Distribución de estado de órdenes
    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    // Valor promedio de orden
    const deliveredOrders = await this.prisma.order.findMany({
      where: { status: 'DELIVERED' },
      select: { total: true },
    });
    const avgOrderValue =
      deliveredOrders.length > 0 ? deliveredOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0) / deliveredOrders.length : 0;

    // Total de categorías
    const totalCategories = await this.prisma.category.count();

    // Productos activos
    const activeProducts = await this.prisma.product.count({
      where: { isActive: true },
    });

    // Total de sucursales
    const totalBranches = await this.prisma.branch.count();

    // Órdenes pendientes (requieren acción)
    const pendingOrders = await this.prisma.order.count({
      where: { status: 'PENDING' },
    });

    return {
      summary: {
        totalOrders,
        totalRevenue: Number(totalRevenue),
        avgOrderValue: Number(avgOrderValue),
        pendingOrders,
        activeProducts,
        totalCategories,
        totalBranches,
      },
      last30Days: {
        ordersCount: ordersLast30Days.length,
        revenue: revenueLast30Days,
        avgOrderValue: ordersLast30Days.length > 0 ? revenueLast30Days / ordersLast30Days.length : 0,
      },
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      topProducts: topProductsResult,
      lowStockProducts: lowStockSimple,
    };
  }
}
