import { BadRequestException, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ForecastService } from './forecast.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { BranchScopeService } from '../branch-scope/branch-scope.service.js';

function positiveInt(value?: string): number | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new BadRequestException('El valor debe ser un entero positivo');
  return parsed;
}

@Controller('predictions')
@ApiTags('predictions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
@ApiBearerAuth()
export class ForecastController {
  constructor(
    private readonly forecast: ForecastService,
    private readonly branchScope: BranchScopeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtiene la última predicción válida' })
  async latest(@Query('branchId') requestedBranchId: string | undefined, @Req() req: any) {
    const branchId = await this.branchScope.resolveBranchId(req.user, positiveInt(requestedBranchId));
    return this.forecast.latest(branchId);
  }

  @Get('backtest')
  @ApiOperation({ summary: 'Evalúa la predicción contra el historial reciente' })
  async backtest(@Query('branchId') requestedBranchId: string | undefined, @Query('days') days: string | undefined, @Req() req: any) {
    const branchId = await this.branchScope.resolveBranchId(req.user, positiveInt(requestedBranchId));
    return this.forecast.backtest(branchId, positiveInt(days));
  }

  @Get(':runId')
  @ApiOperation({ summary: 'Obtiene una ejecución de predicción' })
  async getRun(@Param('runId') runId: string, @Req() req: any) {
    const parsedRunId = positiveInt(runId);
    if (!parsedRunId) throw new BadRequestException('runId inválido');
    const branchId = await this.branchScope.resolveBranchId(req.user);
    return this.forecast.getRun(parsedRunId, branchId);
  }

  @Post('run')
  @ApiOperation({ summary: 'Ejecuta manualmente la predicción' })
  async run(@Query('branchId') requestedBranchId: string | undefined, @Query('horizonDays') horizonDays: string | undefined, @Req() req: any) {
    const branchId = await this.branchScope.resolveBranchId(req.user, positiveInt(requestedBranchId));
    return this.forecast.generate({ branchId, horizonDays: positiveInt(horizonDays) });
  }
}
