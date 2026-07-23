import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductionService } from './production.service.js';
import { CreateProductionLogDto } from './dto/production.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { BranchScopeService } from '../branch-scope/branch-scope.service.js';

@Controller('production')
@ApiTags('production')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER', 'BAKER')
@ApiBearerAuth()
export class ProductionController {
  constructor(
    private readonly productionService: ProductionService,
    private readonly branchScope: BranchScopeService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar horneado',
    description: 'Crea un registro de producción. Resta materia prima y suma producto terminado al inventario.',
  })
  async registerProduction(@Body() dto: CreateProductionLogDto, @Req() req: any) {
    const userId = req.user.userId || req.user.sub;
    const branchId = await this.branchScope.resolveBranchId(req.user, dto.branchId);
    return this.productionService.registerProduction({ ...dto, branchId }, userId);
  }

  @Get('today')
  @ApiOperation({ summary: 'Producción de hoy', description: 'Retorna los registros de producción de HOY.' })
  @ApiQuery({ name: 'branchId', required: false })
  async getTodayProduction(
    @Req() req: any,
    @Query('branchId') branchId?: string,
  ) {
    const userId = req.user.userId || req.user.sub;
    const requestedBranchId = branchId ? parseInt(branchId, 10) : undefined;
    const scopedBranchId = await this.branchScope.resolveBranchId(req.user, requestedBranchId);
    return this.productionService.getTodayProduction(scopedBranchId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Historial de producción' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  async getHistory(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    const requestedBranchId = branchId ? parseInt(branchId, 10) : undefined;
    const scopedBranchId = await this.branchScope.resolveBranchId(req.user, requestedBranchId);
    return this.productionService.getHistory(from, to, scopedBranchId);
  }
}
