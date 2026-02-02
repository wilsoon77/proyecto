import { Controller, Get, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';

@Controller('dashboard')
@ApiTags('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EMPLOYEE')
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Estadísticas del dashboard',
    description: 'Obtiene estadísticas consolidadas para el panel de administración. Los EMPLOYEE solo ven su sucursal asignada.',
  })
  @ApiQuery({ name: 'branchId', required: false, description: 'ID de la sucursal (ADMIN puede filtrar, EMPLOYEE ve solo su sucursal)' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del dashboard',
    schema: {
      example: {
        kpis: {
          todaySales: 1500.50,
          todayOrdersCount: 12,
          monthlyLossesQty: 25,
          monthlyLossesCount: 8,
          lowStockAlerts: 5,
        },
        summary: {
          totalOrders: 150,
          totalRevenue: 15000.5,
          avgOrderValue: 100.3,
          pendingOrders: 5,
          activeProducts: 45,
          totalCategories: 8,
          totalBranches: 3,
        },
        last30Days: {
          ordersCount: 45,
          revenue: 4500.0,
          avgOrderValue: 100.0,
        },
        ordersByStatus: [
          { status: 'DELIVERED', count: 100 },
          { status: 'PENDING', count: 5 },
          { status: 'CONFIRMED', count: 10 },
        ],
        topProducts: [
          { productId: 1, name: 'Concha', slug: 'concha', totalSold: 50 },
          { productId: 2, name: 'Bolillo', slug: 'bolillo', totalSold: 40 },
        ],
        lowStockProducts: [
          { productId: 5, productName: 'Pan Integral', branchName: 'Centro', available: 2 },
        ],
        salesByBranch: [
          { branchId: 1, branchName: 'Central', totalSales: 5000, orderCount: 50 },
        ],
        weeklySales: [
          { date: '2026-01-26', totalSales: 500, orderCount: 5 },
        ],
      },
    },
  })
  getStats(@Query('branchId') branchId?: string, @Req() req?: any) {
    // Si el usuario es EMPLOYEE, forzar su sucursal asignada
    // Por ahora, los empleados deben pasar su branchId desde el frontend
    // TODO: Implementar relación User -> Branch para asignar sucursal automáticamente
    const parsedBranchId = branchId ? parseInt(branchId, 10) : undefined;
    return this.dashboardService.getStats(parsedBranchId);
  }
}
