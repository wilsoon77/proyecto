import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto, UpdateUserDto, AdminUserDto } from './dto/user.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('users')
@ApiTags('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Helper para obtener nombre del usuario que ejecuta la acción
   */
  private async getUserName(userId: string): Promise<string> {
    if (!userId) return 'Sistema';
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      });
      if (user) {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return name || user.email || 'Usuario';
      }
    } catch (e) {
      // Ignorar errores
    }
    return 'Sistema';
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios', description: 'Obtiene todos los usuarios (solo ADMIN).' })
  @ApiResponse({
    status: 200,
    description: 'Listado de usuarios',
    type: [AdminUserDto],
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario', description: 'Obtiene un usuario por su ID (solo ADMIN).' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    type: AdminUserDto,
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario', description: 'Crea un nuevo usuario con cualquier rol (solo ADMIN).' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado',
    type: AdminUserDto,
  })
  @ApiBadRequestResponse({ description: 'El email ya existe' })
  async create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    const user = await this.usersService.create(createUserDto);
    
    // Registrar en auditoría
    const userName = await this.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      entityName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    
    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario', description: 'Actualiza un usuario (solo ADMIN).' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado',
    type: AdminUserDto,
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiBadRequestResponse({ description: 'El email ya existe' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    
    // Registrar en auditoría
    const userName = await this.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      entityName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      details: { changedFields: Object.keys(updateUserDto) },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    
    return user;
  }

  @Delete(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar usuario', description: 'Desactiva un usuario (soft delete, solo ADMIN). No puedes desactivar tu propia cuenta.' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario desactivado',
    schema: {
      properties: {
        deactivated: { type: 'boolean' },
        id: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiForbiddenResponse({ description: 'No puedes desactivar tu propia cuenta' })
  async deactivate(@Param('id') id: string, @Request() req: any) {
    // Obtener info del usuario antes de desactivar
    const userInfo = await this.usersService.findOne(id);
    const result = await this.usersService.deactivate(id, req.user.userId);
    
    // Registrar en auditoría
    const userName = await this.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      entityName: userInfo ? `${userInfo.firstName} ${userInfo.lastName}`.trim() || userInfo.email : id,
      details: { action: 'DEACTIVATE' },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    
    return result;
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivar usuario', description: 'Reactiva un usuario desactivado (solo ADMIN).' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario reactivado',
    type: AdminUserDto,
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async reactivate(@Param('id') id: string, @Req() req: any) {
    const user = await this.usersService.reactivate(id);
    
    // Registrar en auditoría
    const userName = await this.getUserName(req.user?.userId);
    await this.auditService.log({
      userId: req.user?.userId,
      userName,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      entityName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      details: { action: 'REACTIVATE' },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    
    return user;
  }
}
