import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductionService } from './production.service.js';
import { CreateProductionLogDto } from './dto/production.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('production')
@ApiTags('production')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER', 'BAKER')
@ApiBearerAuth()
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar horneado',
    description: 'Crea un registro de producción. Resta materia prima y suma producto terminado al inventario.',
  })
  async registerProduction(@Body() dto: CreateProductionLogDto, @Req() req: any) {
    const userId = req.user.userId || req.user.sub;
    return this.productionService.registerProduction(dto, userId);
  }

  @Get('today')
  @ApiOperation({ summary: 'Producción de hoy', description: 'Retorna los registros de producción de HOY.' })
  @ApiQuery({ name: 'branchId', required: false })
  getTodayProduction(
    @Req() req: any,
    @Query('branchId') branchId?: string,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.productionService.getTodayProduction(
      branchId ? parseInt(branchId) : undefined,
      userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Historial de producción' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  getHistory(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.productionService.getHistory(from, to, branchId ? parseInt(branchId) : undefined);
  }
}
