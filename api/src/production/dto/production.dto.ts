import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductionLogDto {
  @ApiProperty({ example: 1, description: 'ID de la receta/amasijo' })
  recipeId!: number;

  @ApiProperty({ example: 33, description: 'Latas producidas' })
  traysProduced!: number;

  @ApiPropertyOptional({ description: 'ID de sucursal (si no se envía, usa la del usuario)' })
  branchId?: number;

  @ApiPropertyOptional({ example: 'Amasijo extra de la tarde' })
  note?: string;
}
