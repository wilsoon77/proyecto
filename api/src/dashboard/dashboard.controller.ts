import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';

@Controller('dashboard')
@ApiTags('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Estadísticas del dashboard',
    description: 'Obtiene estadísticas consolidadas para el panel de administración (órdenes, ingresos, productos, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del dashboard',
    schema: {
      example: {
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
      },
    },
  })
  getStats() {
    return this.dashboardService.getStats();
  }
}
