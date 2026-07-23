import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DailyCloseService } from './daily-close.service.js';
import { CreateDailyCloseDto } from './dto/create-daily-close.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { BranchScopeService } from '../branch-scope/branch-scope.service.js';
import { AuditService } from '../audit/audit.service.js';
import { getClientIp } from '../common/utils/audit.util.js';

@Controller('daily-close')
@ApiTags('daily-close')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DailyCloseController {
  constructor(
    private readonly service: DailyCloseService,
    private readonly branchScope: BranchScopeService,
    private readonly auditService: AuditService,
  ) {}

  @Get('preview')
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Vista previa del cierre diario' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'closeDate', required: false, description: 'YYYY-MM-DD; por defecto la fecha operativa actual' })
  @ApiResponse({ status: 200, description: 'Inventario capturado para el cierre' })
  async preview(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('closeDate') closeDate?: string,
  ) {
    const resolvedBranchId = await this.resolveBranchId(req.user, branchId);
    return this.service.preview(resolvedBranchId, closeDate);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'CASHIER')
  @ApiOperation({ summary: 'Registrar cierre diario' })
  @ApiBody({ type: CreateDailyCloseDto })
  @ApiResponse({ status: 201, description: 'Cierre registrado y stock conciliado' })
  async create(@Req() req: any, @Body() dto: CreateDailyCloseDto) {
    const resolvedBranchId = await this.resolveBranchId(req.user, dto.branchId?.toString());
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) throw new BadRequestException('Usuario autenticado requerido');

    const result = await this.service.create(dto, resolvedBranchId, userId);
    const userName = await this.auditService.getUserName(userId);
    await this.auditService.log({
      userId,
      userName,
      action: 'CREATE',
      entity: 'DailyClose',
      entityId: String(result.id),
      entityName: `Cierre ${result.closeDate} - Sucursal ${resolvedBranchId}`,
      details: {
        branchId: resolvedBranchId,
        closeDate: result.closeDate,
        summary: result.summary,
      },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });

    return result;
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Historial de cierres diarios' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async list(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const resolvedBranchId = (branchId || req.user?.role !== 'ADMIN')
      ? await this.resolveBranchId(req.user, branchId)
      : undefined;

    const parsedPage = this.parseOptionalPositiveInt(page, 'page');
    const parsedPageSize = this.parseOptionalPositiveInt(pageSize, 'pageSize');

    return this.service.list({
      branchId: resolvedBranchId,
      from,
      to,
      page: parsedPage,
      pageSize: parsedPageSize,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Detalle de un cierre diario' })
  async detail(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const result = await this.service.getDetail(id);
    await this.branchScope.assertBranchAccess(req.user, result.branchId);
    return result;
  }

  private async resolveBranchId(actor: any, requestedBranchId?: string): Promise<number> {
    let parsed: number | undefined;
    if (requestedBranchId) {
      parsed = Number(requestedBranchId);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new BadRequestException('branchId inválido');
      }
    }
    const branchId = await this.branchScope.resolveBranchId(actor, parsed);
    if (!branchId) {
      throw new BadRequestException('branchId es obligatorio para esta operación');
    }
    return branchId;
  }

  private parseOptionalPositiveInt(value: string | undefined, field: string): number | undefined {
    if (value === undefined || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo`);
    }
    return parsed;
  }
}
