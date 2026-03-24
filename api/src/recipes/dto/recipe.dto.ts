import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipeIngredientDto {
  @ApiProperty()
  rawMaterialId!: number;

  @ApiProperty({ description: 'Cantidad por amasijo en unidad base (ej: 50 LB)' })
  quantity!: number;
}

export class CreateRecipeDto {
  @ApiProperty({ example: 'Amasijo Estándar de Francés' })
  name!: string;

  @ApiProperty({ example: 1, description: 'ID del producto que produce esta receta' })
  productId!: number;

  @ApiProperty({ example: 33, description: 'Latas estándar esperadas por amasijo' })
  standardTrays!: number;

  @ApiProperty({ type: [RecipeIngredientDto], description: 'Ingredientes de la receta' })
  ingredients!: RecipeIngredientDto[];
}

export class UpdateRecipeDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  standardTrays?: number;

  @ApiPropertyOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [RecipeIngredientDto] })
  ingredients?: RecipeIngredientDto[];
}
