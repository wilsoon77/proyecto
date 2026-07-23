import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { InventoryService } from './inventory.service.js';
import { BranchScopeService } from '../branch-scope/branch-scope.service.js';

/**
 * InventoryController — Solo maneja HTTP, delega a InventoryService.
 * 
 * Aplica: nestjs-service-layer (sin acceso directo a Prisma)
 */
@Controller('inventory')
@ApiTags('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
@ApiBearerAuth()
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly branchScope: BranchScopeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Consultar inventario', description: 'Niveles de stock por producto y sucursal. Requiere rol ADMIN o MANAGER.' })
  @ApiQuery({ name: 'product', required: false, description: 'slug del producto' })
  @ApiQuery({ name: 'branch', required: false, description: 'slug de la sucursal' })
  async list(@Req() req: any, @Query('product') productSlug?: string, @Query('branch') branchSlug?: string) {
    const scopedBranchSlug = await this.branchScope.resolveBranchSlug(req.user, branchSlug);
    return this.inventoryService.list(productSlug, scopedBranchSlug);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Productos con stock bajo', description: 'Lista productos con inventario disponible bajo un umbral.' })
  @ApiQuery({ name: 'branchId', required: false, description: 'ID de la sucursal' })
  @ApiQuery({ name: 'threshold', required: false, description: 'Umbral de stock bajo (default: 10)' })
  async getLowStock(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('threshold') threshold?: string,
  ) {
    const requestedBranchId = branchId ? parseInt(branchId, 10) : undefined;
    const scopedBranchId = await this.branchScope.resolveBranchId(req.user, requestedBranchId);
    return this.inventoryService.getLowStock(
      scopedBranchId,
      threshold ? parseInt(threshold) : 10,
    );
  }
}
