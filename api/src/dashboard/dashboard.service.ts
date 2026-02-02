import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(branchId?: number) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filtro base por sucursal si se proporciona
    const branchFilter = branchId ? { branchId } : {};
    const orderBranchFilter = branchId ? { branchId } : {};

    // ========== KPIs NUEVOS ==========
    
    // Ventas del día (órdenes DELIVERED o PICKED_UP del día)
    const todaySalesData = await this.prisma.order.aggregate({
      where: { 
        ...orderBranchFilter,
        status: { in: ['DELIVERED', 'PICKED_UP'] },
        updatedAt: { gte: startOfToday },
      },
      _sum: { total: true },
      _count: true,
    });
    const todaySales = Number(todaySalesData._sum.total ?? 0);
    const todayOrdersCount = todaySalesData._count ?? 0;

    // Mermas del mes (movimientos MERMA o PERDIDA_ROBO)
    const monthlyLossesData = await this.prisma.stockMovement.aggregate({
      where: {
        type: { in: ['MERMA', 'PERDIDA_ROBO'] },
        createdAt: { gte: startOfMonth },
        ...(branchId ? { fromBranchId: branchId } : {}),
      },
      _sum: { quantity: true },
      _count: true,
    });
    const monthlyLossesQty = monthlyLossesData._sum.quantity ?? 0;
    const monthlyLossesCount = monthlyLossesData._count ?? 0;

    // Alertas de stock bajo (quantity < 5 y > 0)
    const lowStockAlerts = await this.prisma.inventory.count({
      where: {
        ...branchFilter,
        quantity: { lt: 5, gt: 0 },
      },
    });

    // ========== ESTADÍSTICAS GENERALES ==========

    // Total de órdenes (con filtro de sucursal si aplica)
    const totalOrders = await this.prisma.order.count({
      where: orderBranchFilter,
    });

    // Ingresos totales (de órdenes entregadas)
    const revenueData = await this.prisma.order.aggregate({
      where: { ...orderBranchFilter, status: { in: ['DELIVERED', 'PICKED_UP'] } },
      _sum: { total: true },
    });
    const totalRevenue = revenueData._sum.total ?? 0;

    // Órdenes en los últimos 30 días
    const ordersLast30Days = await this.prisma.order.findMany({
      where: {
        ...orderBranchFilter,
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
      .filter((o) => o.status === 'DELIVERED' || o.status === 'PICKED_UP')
      .reduce((sum, o) => sum + Number(o.total ?? 0), 0);

    // Productos con bajo inventario (disponibles < 5 unidades)
    const lowStockQuery = branchId 
      ? await this.prisma.$queryRaw<
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
          WHERE (i.quantity - i.reserved) < 5 AND i.quantity > 0 AND i."branchId" = ${branchId}
          ORDER BY available ASC
          LIMIT 10
        `
      : await this.prisma.$queryRaw<
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

    // Productos más vendidos (para la sucursal específica)
    const topProductsQuery = branchId
      ? await this.prisma.$queryRaw<Array<{ productId: number; totalSold: number }>>`
          SELECT oi."productId", SUM(oi.quantity)::int as "totalSold"
          FROM "OrderItem" oi
          JOIN "Order" o ON oi."orderId" = o.id
          WHERE o."branchId" = ${branchId}
          GROUP BY oi."productId"
          ORDER BY "totalSold" DESC
          LIMIT 10
        `
      : await this.prisma.orderItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 10,
        }).then(items => items.map(p => ({ productId: p.productId, totalSold: p._sum.quantity ?? 0 })));

    const topProductDetails = await this.prisma.product.findMany({
      where: {
        id: { in: topProductsQuery.map((p) => p.productId) },
      },
      select: { id: true, name: true, slug: true },
    });

    const topProductsMap = new Map(topProductDetails.map((p) => [p.id, p]));
    const topProductsResult = topProductsQuery.map((p) => ({
      productId: p.productId,
      name: topProductsMap.get(p.productId)?.name ?? 'Desconocido',
      slug: topProductsMap.get(p.productId)?.slug ?? '',
      totalSold: Number(p.totalSold),
    }));

    // Distribución de estado de órdenes
    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      where: orderBranchFilter,
      _count: true,
    });

    // Valor promedio de orden
    const deliveredOrders = await this.prisma.order.findMany({
      where: { ...orderBranchFilter, status: { in: ['DELIVERED', 'PICKED_UP'] } },
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
      where: { ...orderBranchFilter, status: 'PENDING' },
    });

    // Total de usuarios registrados
    const totalUsers = await this.prisma.user.count();

    // ========== VENTAS POR SUCURSAL (para gráfica comparativa) ==========
    const salesByBranch = branchId ? [] : await this.prisma.$queryRaw<
      Array<{ branchId: number; branchName: string; totalSales: number; orderCount: number }>
    >`
      SELECT 
        b.id as "branchId",
        b.name as "branchName",
        COALESCE(SUM(o.total), 0)::float as "totalSales",
        COUNT(o.id)::int as "orderCount"
      FROM "Branch" b
      LEFT JOIN "Order" o ON b.id = o."branchId" AND o.status IN ('DELIVERED', 'PICKED_UP')
      GROUP BY b.id, b.name
      ORDER BY "totalSales" DESC
    `;

    // ========== VENTAS DE LA SEMANA (para gráfica de línea) ==========
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklySales = branchId
      ? await this.prisma.$queryRaw<
          Array<{ date: Date; totalSales: number; orderCount: number }>
        >`
          SELECT 
            DATE(o."createdAt") as date,
            COALESCE(SUM(o.total), 0)::float as "totalSales",
            COUNT(o.id)::int as "orderCount"
          FROM "Order" o
          WHERE o."createdAt" >= ${sevenDaysAgo}
            AND o.status IN ('DELIVERED', 'PICKED_UP')
            AND o."branchId" = ${branchId}
          GROUP BY DATE(o."createdAt")
          ORDER BY date ASC
        `
      : await this.prisma.$queryRaw<
          Array<{ date: Date; totalSales: number; orderCount: number }>
        >`
          SELECT 
            DATE(o."createdAt") as date,
            COALESCE(SUM(o.total), 0)::float as "totalSales",
            COUNT(o.id)::int as "orderCount"
          FROM "Order" o
          WHERE o."createdAt" >= ${sevenDaysAgo}
            AND o.status IN ('DELIVERED', 'PICKED_UP')
          GROUP BY DATE(o."createdAt")
          ORDER BY date ASC
        `;

    return {
      // Nuevos KPIs
      kpis: {
        todaySales,
        todayOrdersCount,
        monthlyLossesQty,
        monthlyLossesCount,
        lowStockAlerts,
      },
      summary: {
        totalOrders,
        totalRevenue: Number(totalRevenue),
        avgOrderValue: Number(avgOrderValue),
        pendingOrders,
        activeProducts,
        totalCategories,
        totalBranches,
        totalUsers,
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
      lowStockProducts: lowStockQuery,
      // Gráficas
      salesByBranch,
      weeklySales,
    };
  }
}
