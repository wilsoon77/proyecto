import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RawMaterialsService } from './raw-materials.service.js';
import { CreateRawMaterialDto, UpdateRawMaterialDto, PurchaseRawMaterialDto } from './dto/raw-material.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('raw-materials')
@ApiTags('raw-materials')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RawMaterialsController {
  constructor(private readonly rawMaterialsService: RawMaterialsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Listar materias primas' })
  findAll() {
    return this.rawMaterialsService.findAll();
  }

  @Get('inventory')
  @Roles('ADMIN', 'MANAGER', 'BAKER')
  @ApiOperation({ summary: 'Inventario de materia prima por sucursal' })
  @ApiQuery({ name: 'branchId', required: false })
  getInventory(@Query('branchId') branchId?: string) {
    return this.rawMaterialsService.getInventory(branchId ? parseInt(branchId) : undefined);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Detalle de materia prima' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rawMaterialsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Crear materia prima' })
  create(@Body() dto: CreateRawMaterialDto) {
    return this.rawMaterialsService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Actualizar materia prima' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRawMaterialDto) {
    return this.rawMaterialsService.update(id, dto);
  }

  @Post('purchase')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Registrar compra de materia prima',
    description: 'Convierte la unidad de compra a unidad base y suma al inventario de la sucursal.',
  })
  registerPurchase(@Body() dto: PurchaseRawMaterialDto, @Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.rawMaterialsService.registerPurchase(dto, userId);
  }
}
