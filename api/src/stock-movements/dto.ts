import { IsInt, IsPositive, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';

export class CreateStockMovementDto {
  @ApiProperty({ enum: StockMovementType, example: StockMovementType.COMPRA })
  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @ApiProperty({ example: 10, description: 'Cantidad positiva' })
  @IsInt()
  @IsPositive()
  quantity!: number; // siempre positivo

  @ApiProperty({ example: 'concha' })
  @IsString()
  productSlug!: string;

  @ApiProperty({ example: 'zona-1', required: false })
  @IsOptional()
  @IsString()
  fromBranchSlug?: string;

  @ApiProperty({ example: 'zona-10', required: false })
  @IsOptional()
  @IsString()
  toBranchSlug?: string;

  @ApiProperty({ example: 'FAC-12345', required: false })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({ example: 'Compra de proveedor X', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
