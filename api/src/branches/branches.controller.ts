import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { BranchesService } from './branches.service.js';
import { CreateBranchDto, UpdateBranchDto, BranchDto } from './dto/branch.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('branches')
@ApiTags('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar sucursales', description: 'Obtiene todas las sucursales con conteo de productos en inventario.' })
  @ApiResponse({
    status: 200,
    description: 'Listado de sucursales',
    type: [BranchDto],
  })
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener sucursal', description: 'Obtiene una sucursal por su ID.' })
  @ApiParam({ name: 'id', description: 'ID de la sucursal', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Sucursal encontrada',
    type: BranchDto,
  })
  @ApiNotFoundResponse({ description: 'Sucursal no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear sucursal', description: 'Crea una nueva sucursal. Requiere rol ADMIN.' })
  @ApiResponse({
    status: 201,
    description: 'Sucursal creada',
    type: BranchDto,
  })
  @ApiBadRequestResponse({ description: 'El slug ya existe' })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar sucursal', description: 'Actualiza una sucursal. Requiere rol ADMIN.' })
  @ApiParam({ name: 'id', description: 'ID de la sucursal', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Sucursal actualizada',
    type: BranchDto,
  })
  @ApiNotFoundResponse({ description: 'Sucursal no encontrada' })
  @ApiBadRequestResponse({ description: 'El slug ya existe' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar sucursal', description: 'Elimina una sucursal sin inventarios. Requiere rol ADMIN.' })
  @ApiParam({ name: 'id', description: 'ID de la sucursal', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Sucursal eliminada',
    schema: {
      properties: {
        deleted: { type: 'boolean' },
        id: { type: 'number' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Sucursal no encontrada' })
  @ApiBadRequestResponse({ description: 'La sucursal tiene productos en inventario' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.remove(id);
  }
}
