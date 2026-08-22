import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { InventoryService } from './inventory.service.js';
import { BranchScopeService } from '../branch-scope/branch-scope.service.js';
import { ExpirationService } from './expiration.service.js';
import { UpdateLotAlertDto } from './dto/update-lot-alert.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { getClientIp } from '../common/utils/audit.util.js';

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
    private readonly expirationService: ExpirationService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Consultar inventario', description: 'Niveles de stock por producto y sucursal. Requiere rol ADMIN o MANAGER.' })
  @ApiQuery({ name: 'product', required: false, description: 'slug del producto' })
  @ApiQuery({ name: 'branch', required: false, description: 'Slug de la sucursal; MANAGER puede consultar cualquiera de las dos sucursales' })
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

  @Get('expirations')
  @ApiOperation({
    summary: 'Consultar caducidades',
    description: 'Lista lotes próximos a vencer, vencidos o sin fecha. La caducidad solo se registra para productos de origen COMPRADO con control por lote. Un lote vencido permanece visible para registrar la MERMA; no desaparece por sí solo del inventario.',
  })
  @ApiQuery({ name: 'branch', required: false, description: 'Slug de la sucursal; MANAGER puede consultar cualquiera de las dos sucursales' })
  @ApiQuery({ name: 'status', required: false, enum: ['all', 'expired', 'expiring', 'no-date'], description: 'Filtro de estado del lote' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Días hacia adelante para considerar próximos a vencer (por defecto: 7)' })
  async getExpirations(
    @Req() req: any,
    @Query('branch') branchSlug?: string,
    @Query('status') status?: string,
    @Query('days') days?: string,
  ) {
    const scopedBranchSlug = await this.branchScope.resolveBranchSlug(req.user, branchSlug);
    const normalizedStatus = ['expired', 'expiring', 'no-date'].includes(status || '')
      ? status as 'expired' | 'expiring' | 'no-date'
      : 'all';
    const parsedDays = days ? Number(days) : 7;
    return this.inventoryService.listExpirations(
      scopedBranchSlug,
      normalizedStatus,
      Number.isFinite(parsedDays) ? parsedDays : 7,
    );
  }

  @Patch('lots/:id/alert')
  @ApiOperation({ summary: 'Ajustar alerta de caducidad de lote', description: 'Solo aplica a productos COMPRADOS con control por lote. Actualiza la fecha de alerta, los días de anticipación o la fecha de vencimiento; enviar alertAt: null restaura los recordatorios configurados en el producto.' })
  async updateLotAlert(
    @Req() req: any,
    @Param('id', ParseIntPipe) lotId: number,
    @Body() dto: UpdateLotAlertDto,
  ) {
    const lot = await this.inventoryService.getLotById(lotId);
    if (!lot) throw new NotFoundException('Lote no encontrado');
    await this.branchScope.assertBranchAccess(req.user, lot.branchId);

    const updated = await this.inventoryService.updateLotAlert(lotId, dto);

    // Registro en auditoría
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const userName = await this.auditService.getUserName(userId);
    await this.auditService.log({
      userId,
      userName,
      action: 'UPDATE',
      entity: 'InventoryLot',
      entityId: String(lotId),
      entityName: `${lot.product.name} (Lote #${lotId})`,
      details: {
        actionType: 'AJUSTAR_ALERTA_CADUCIDAD',
        branch: lot.branch.name,
        previousAlertAt: lot.alertAt,
        newAlertAt: updated.alertAt,
        previousExpiresAt: lot.expiresAt,
        newExpiresAt: updated.expiresAt,
        daysBefore: dto.daysBefore,
        effectiveAlertDate: updated.effectiveAlertDate,
      },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });

    return updated;
  }

  @Post('expirations/check')
  @ApiOperation({ summary: 'Revisar caducidades ahora', description: 'Ejecuta manualmente la revisión de alertas de caducidad.' })
  async checkExpirations(@Req() req: any) {
    // Un MANAGER solo puede disparar la revisión de su sucursal; ADMIN puede
    // revisar todas, igual que la tarea programada diaria.
    const scopedBranchId = await this.branchScope.resolveBranchId(req.user);
    const result = await this.expirationService.scanAndNotify(scopedBranchId);

    // Registro en auditoría
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const userName = await this.auditService.getUserName(userId);
    await this.auditService.log({
      userId,
      userName,
      action: 'EXECUTE',
      entity: 'InventoryExpiration',
      entityName: 'Revisión manual de caducidades',
      details: {
        scannedLots: result.scanned,
        warningCount: result.warningCount,
        expiredCount: result.expiredCount,
        branchId: scopedBranchId,
      },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });

    return result;
  }
}
