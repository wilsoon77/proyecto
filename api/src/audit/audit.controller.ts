import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { AuditService } from './audit.service.js';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener historial de auditoría (solo ADMIN)' })
  @ApiQuery({ name: 'entity', required: false, description: 'Filtrar por entidad' })
  @ApiQuery({ name: 'action', required: false, description: 'Filtrar por acción' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filtrar por usuario' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha inicio (ISO)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha fin (ISO)' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar en nombre/entidad' })
  @ApiQuery({ name: 'page', required: false, description: 'Página' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Registros por página' })
  async findAll(
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.auditService.findAll({
      entity,
      action,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 50,
    });
  }

  @Get('stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener estadísticas de auditoría (solo ADMIN)' })
  async getStats() {
    return this.auditService.getStats();
  }

  @Get('filters')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener opciones de filtros disponibles (solo ADMIN)' })
  async getFilterOptions() {
    return this.auditService.getFilterOptions();
  }
}
