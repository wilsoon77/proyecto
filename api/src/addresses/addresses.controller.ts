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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AddressesService } from './addresses.service.js';
import { CreateAddressDto, UpdateAddressDto, AddressDto } from './dto/address.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('addresses')
@ApiTags('addresses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Listar direcciones', 
    description: 'Usuarios ven sus direcciones, ADMIN ve todas.' 
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de direcciones',
    type: [AddressDto],
  })
  findAll(@Request() req: any) {
    // Si es ADMIN, puede ver todas las direcciones (sin filtro)
    const userId = req.user.role === 'ADMIN' ? undefined : req.user.userId;
    return this.addressesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener dirección', 
    description: 'Usuarios pueden ver sus direcciones, ADMIN puede ver cualquiera.' 
  })
  @ApiParam({ name: 'id', description: 'ID de la dirección', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Dirección encontrada',
    type: AddressDto,
  })
  @ApiNotFoundResponse({ description: 'Dirección no encontrada' })
  @ApiForbiddenResponse({ description: 'No tienes permiso para acceder a esta dirección' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user.role === 'ADMIN' ? undefined : req.user.userId;
    return this.addressesService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Crear dirección', 
    description: 'Crea una dirección para el usuario autenticado.' 
  })
  @ApiResponse({
    status: 201,
    description: 'Dirección creada',
    type: AddressDto,
  })
  create(@Body() createAddressDto: CreateAddressDto, @Request() req: any) {
    return this.addressesService.create(createAddressDto, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar dirección', 
    description: 'Usuarios pueden actualizar sus direcciones, ADMIN puede actualizar cualquiera.' 
  })
  @ApiParam({ name: 'id', description: 'ID de la dirección', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Dirección actualizada',
    type: AddressDto,
  })
  @ApiNotFoundResponse({ description: 'Dirección no encontrada' })
  @ApiForbiddenResponse({ description: 'No tienes permiso para modificar esta dirección' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAddressDto: UpdateAddressDto,
    @Request() req: any,
  ) {
    const userId = req.user.role === 'ADMIN' ? undefined : req.user.userId;
    return this.addressesService.update(id, updateAddressDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar dirección', 
    description: 'Usuarios pueden eliminar sus direcciones sin pedidos, ADMIN puede eliminar cualquiera.' 
  })
  @ApiParam({ name: 'id', description: 'ID de la dirección', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Dirección eliminada',
    schema: {
      properties: {
        deleted: { type: 'boolean' },
        id: { type: 'number' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Dirección no encontrada' })
  @ApiForbiddenResponse({ description: 'No puedes eliminar esta dirección' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user.role === 'ADMIN' ? undefined : req.user.userId;
    return this.addressesService.remove(id, userId);
  }
}
