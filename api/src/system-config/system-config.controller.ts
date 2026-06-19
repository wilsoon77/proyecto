import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { SystemConfigService } from './system-config.service.js';
import { UpdateConfigDto } from './dto/update-config.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { AuditService } from '../audit/audit.service.js';
import { getClientIp } from '../common/utils/audit.util.js';

@Controller('system-config')
@ApiTags('system-config')
export class SystemConfigController {
  constructor(
    private readonly systemConfigService: SystemConfigService,
    private readonly auditService: AuditService,
  ) {}

  @Get('public')
  @ApiOperation({ summary: 'Obtener configuración pública', description: 'Obtiene las configuraciones accesibles públicamente como un objeto plano.' })
  @ApiResponse({
    status: 200,
    description: 'Configuración pública',
  })
  getPublic() {
    return this.systemConfigService.getPublic();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas las configuraciones', description: 'Obtiene todas las configuraciones del sistema agrupadas. Requiere rol ADMIN.' })
  @ApiResponse({
    status: 200,
    description: 'Listado de configuraciones',
  })
  findAll() {
    return this.systemConfigService.getAll();
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una configuración', description: 'Actualiza el valor de una clave de configuración. Requiere rol ADMIN.' })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada con éxito',
  })
  @ApiNotFoundResponse({ description: 'Configuración no encontrada' })
  @ApiBadRequestResponse({ description: 'La configuración es de solo lectura o tipo de dato inválido' })
  async update(
    @Param('key') key: string,
    @Body() updateConfigDto: UpdateConfigDto,
    @Req() req: any,
  ) {
    // Get oldValue for auditing
    let oldValue: any = null;
    try {
      oldValue = await this.systemConfigService.get<any>(key);
    } catch {
      // Ignorar si no existe
    }

    await this.systemConfigService.set(key, updateConfigDto.value);

    // Audit log
    const userName = await this.auditService.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'UPDATE',
      entity: 'SystemConfig',
      entityId: key,
      entityName: key,
      details: {
        oldValue,
        newValue: updateConfigDto.value,
      },
      ipAddress: getClientIp(req),
      userAgent: req.headers?.['user-agent'],
    });

    return { success: true, key, value: updateConfigDto.value };
  }
}
