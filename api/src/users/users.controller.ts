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

@Controller('users')
@ApiTags('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
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
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
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
  deactivate(@Param('id') id: string, @Request() req: any) {
    return this.usersService.deactivate(id, req.user.userId);
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
  reactivate(@Param('id') id: string) {
    return this.usersService.reactivate(id);
  }
}
