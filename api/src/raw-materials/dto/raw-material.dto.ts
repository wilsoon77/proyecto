import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateRawMaterialDto {
  @ApiProperty({ example: 'Harina' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: ['LB', 'ML', 'UNIT'], example: 'LB' })
  @IsIn(['LB', 'ML', 'UNIT'])
  baseUnit!: 'LB' | 'ML' | 'UNIT';

  @ApiProperty({ example: 2.50, description: 'Costo promedio por unidad base' })
  @IsNumber()
  @Min(0)
  costPerUnit!: number;

  @ApiPropertyOptional({ example: 50, description: 'Nivel mínimo para alerta de stock' })
  @IsOptional()
  @IsNumber()
  minStock?: number;
}

export class UpdateRawMaterialDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PurchaseRawMaterialDto {
  @ApiProperty({ example: 1, description: 'ID de la materia prima' })
  @IsInt()
  rawMaterialId!: number;

  @ApiProperty({ example: 1, description: 'ID de la sucursal destino' })
  @IsInt()
  branchId!: number;

  @ApiProperty({ example: 2, description: 'Cantidad comprada (en unidad de compra)' })
  @IsNumber()
  @Min(0.01)
  purchaseQuantity!: number;

  @ApiProperty({
    enum: ['QUINTAL', 'ARROBA', 'LIBRA', 'LITRO', 'GALON', 'CARTON', 'UNIDAD'],
    example: 'QUINTAL',
    description: 'Unidad de compra (se convierte automáticamente a unidad base)',
  })
  @IsIn(['QUINTAL', 'ARROBA', 'LIBRA', 'LITRO', 'GALON', 'CARTON', 'UNIDAD'])
  unitOfPurchase!: string;

  @ApiPropertyOptional({ example: 'Compra a proveedor X' })
  @IsOptional()
  @IsString()
  note?: string;
}
