import { IsInt, IsPositive, IsString, IsOptional, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';
import { Type } from 'class-transformer';

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

export class ReconcileItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  productId!: number;

  @ApiProperty({ example: 45, description: 'Cantidad física real contada' })
  @IsInt()
  @Min(0)
  actualQuantity!: number;
}

export class ReconcileInventoryDto {
  @ApiProperty({ example: 'central' })
  @IsString()
  branchSlug!: string;

  @ApiProperty({ type: [ReconcileItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReconcileItemDto)
  items!: ReconcileItemDto[];

  @ApiProperty({ example: 'Conteo cierre 13/04/2026', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
