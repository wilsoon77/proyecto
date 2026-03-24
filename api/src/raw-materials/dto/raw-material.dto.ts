import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRawMaterialDto {
  @ApiProperty({ example: 'Harina' })
  name!: string;

  @ApiProperty({ enum: ['LB', 'ML', 'UNIT'], example: 'LB' })
  baseUnit!: 'LB' | 'ML' | 'UNIT';

  @ApiProperty({ example: 2.50, description: 'Costo promedio por unidad base' })
  costPerUnit!: number;

  @ApiPropertyOptional({ example: 50, description: 'Nivel mínimo para alerta de stock' })
  minStock?: number;
}

export class UpdateRawMaterialDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  costPerUnit?: number;

  @ApiPropertyOptional()
  minStock?: number;

  @ApiPropertyOptional()
  isActive?: boolean;
}

export class PurchaseRawMaterialDto {
  @ApiProperty({ example: 1, description: 'ID de la materia prima' })
  rawMaterialId!: number;

  @ApiProperty({ example: 1, description: 'ID de la sucursal destino' })
  branchId!: number;

  @ApiProperty({ example: 2, description: 'Cantidad comprada (en unidad de compra)' })
  purchaseQuantity!: number;

  @ApiProperty({
    enum: ['QUINTAL', 'ARROBA', 'LIBRA', 'LITRO', 'GALON', 'CARTON', 'UNIDAD'],
    example: 'QUINTAL',
    description: 'Unidad de compra (se convierte automáticamente a unidad base)',
  })
  unitOfPurchase!: string;

  @ApiPropertyOptional({ example: 'Compra a proveedor X' })
  note?: string;
}
