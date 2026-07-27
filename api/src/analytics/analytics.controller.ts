import { BadRequestException, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsOptions, AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { BranchScopeService } from '../branch-scope/branch-scope.service.js';
import { parseDateOnly } from '../common/time/business-date.js';

function parsePositiveInt(value?: string): number | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new BadRequestException('El identificador debe ser un entero positivo');
  return parsed;
}

function parseDate(value?: string): string | undefined {
  if (value === undefined || value === '') return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestException('La fecha debe tener el formato YYYY-MM-DD');
  try {
    parseDateOnly(value);
  } catch {
    throw new BadRequestException('La fecha indicada no es válida');
  }
  return value;
}

@Controller('analytics')
@ApiTags('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly branchScope: BranchScopeService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Resumen histórico y operativo para analítica' })
  async overview(@Query() query: Record<string, string>, @Req() req: any) {
    return this.analytics.overview(await this.options(query, req));
  }

  @Get('drilldown')
  @ApiOperation({ summary: 'Detalle navegable de la analítica' })
  async drilldown(@Query() query: Record<string, string>, @Req() req: any) {
    return this.analytics.drilldown(await this.options(query, req));
  }

  @Get('products/:productId/demand')
  @ApiOperation({ summary: 'Historial diario de demanda de un producto' })
  async productDemand(@Param('productId') productId: string, @Query() query: Record<string, string>, @Req() req: any) {
    const parsedProductId = parsePositiveInt(productId);
    if (!parsedProductId) throw new BadRequestException('Producto inválido');
    return this.analytics.productDemand(parsedProductId, await this.options(query, req));
  }

  @Post('sync')
  @ApiOperation({ summary: 'Reconstruye el historial diario consolidado' })
  async sync(@Query() query: Record<string, string>, @Req() req: any) {
    const options = await this.options(query, req);
    const to = options.to ?? undefined;
    const from = options.from ?? undefined;
    if (!from || !to) throw new BadRequestException('from y to son obligatorios para sincronizar');

    return this.analytics.syncHistory({ from, to, branchId: options.branchId });
  }

  private async options(query: Record<string, string>, req: any): Promise<AnalyticsOptions> {
    const requestedBranchId = parsePositiveInt(query.branchId);
    const branchId = await this.branchScope.resolveBranchId(req.user, requestedBranchId);
    const level = query.level as AnalyticsOptions['level'] | undefined;
    const metric = query.metric as AnalyticsOptions['metric'] | undefined;
    const granularity = query.granularity as AnalyticsOptions['granularity'] | undefined;

    if (level && !['branch', 'day', 'product', 'source'].includes(level)) throw new BadRequestException('level inválido');
    if (metric && !['sales', 'orders', 'production', 'waste', 'stock', 'forecast'].includes(metric)) throw new BadRequestException('metric inválido');
    if (granularity && !['day', 'week', 'month'].includes(granularity)) throw new BadRequestException('granularity inválida');

    return {
      branchId,
      productId: parsePositiveInt(query.productId),
      from: parseDate(query.from),
      to: parseDate(query.to),
      level,
      metric,
      granularity,
      page: parsePositiveInt(query.page),
      pageSize: parsePositiveInt(query.pageSize),
    };
  }
}
