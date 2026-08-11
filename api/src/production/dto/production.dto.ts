import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductionLogDto {
  @ApiProperty({ example: 1, description: 'ID de la receta/amasijo' })
  @IsInt()
  recipeId!: number;

  @ApiProperty({ example: 33, required: false, description: 'Latas producidas; se puede derivar desde una presentación' })
  @IsOptional()
  @IsInt()
  @Min(1)
  traysProduced?: number;

  @ApiPropertyOptional({ example: 198, description: 'Cantidad producida en la presentación seleccionada' })
  @IsOptional()
  @IsInt()
  @Min(1)
  productionQuantity?: number;

  @ApiPropertyOptional({ example: 12, description: 'Presentación usada para registrar la producción' })
  @IsOptional()
  @IsInt()
  @Min(1)
  productionPresentationId?: number;

  @ApiPropertyOptional({ description: 'ID de sucursal (si no se envía, usa la del usuario)' })
  @IsOptional()
  @IsInt()
  branchId?: number;

  @ApiPropertyOptional({ example: 'Amasijo extra de la tarde' })
  @IsOptional()
  @IsString()
  note?: string;

}
