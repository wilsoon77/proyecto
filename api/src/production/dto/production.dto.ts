import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductionLogDto {
  @ApiProperty({ example: 1, description: 'ID de la receta/amasijo' })
  @IsInt()
  recipeId!: number;

  @ApiProperty({ example: 33, description: 'Latas producidas' })
  @IsInt()
  @Min(1)
  traysProduced!: number;

  @ApiPropertyOptional({ description: 'ID de sucursal (si no se envía, usa la del usuario)' })
  @IsOptional()
  @IsInt()
  branchId?: number;

  @ApiPropertyOptional({ example: 'Amasijo extra de la tarde' })
  @IsOptional()
  @IsString()
  note?: string;
}
