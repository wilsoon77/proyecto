import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RecipeIngredientDto {
  @ApiProperty()
  @IsInt()
  rawMaterialId!: number;

  @ApiProperty({ description: 'Cantidad por amasijo en unidad base (ej: 50 LB)' })
  @IsNumber()
  @Min(0.01)
  quantity!: number;
}

export class CreateRecipeDto {
  @ApiProperty({ example: 'Amasijo Estándar de Francés' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 1, description: 'ID del producto que produce esta receta' })
  @IsInt()
  productId!: number;

  @ApiProperty({ example: 33, description: 'Latas estándar esperadas por amasijo' })
  @IsInt()
  @Min(1)
  standardTrays!: number;

  @ApiProperty({ type: [RecipeIngredientDto], description: 'Ingredientes de la receta' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients!: RecipeIngredientDto[];
}

export class UpdateRecipeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  standardTrays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [RecipeIngredientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients?: RecipeIngredientDto[];
}
