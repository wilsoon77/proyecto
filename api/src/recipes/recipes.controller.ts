import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RecipesService } from './recipes.service.js';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/recipe.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('recipes')
@ApiTags('recipes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'BAKER')
  @ApiOperation({ summary: 'Listar recetas activas', description: 'Devuelve todas las recetas activas con producto e ingredientes.' })
  findAll() {
    return this.recipesService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'BAKER')
  @ApiOperation({ summary: 'Detalle de receta' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Crear receta', description: 'Crea una receta con ingredientes. Solo MANAGER/ADMIN.' })
  create(@Body() dto: CreateRecipeDto) {
    return this.recipesService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Actualizar receta' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRecipeDto) {
    return this.recipesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Desactivar receta (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.remove(id);
  }
}
