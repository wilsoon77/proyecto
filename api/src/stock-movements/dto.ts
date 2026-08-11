import { IsInt, IsPositive, IsString, IsOptional, IsEnum, IsArray, ValidateNested, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';
import { Type } from 'class-transformer';
import { PresentationCountDto } from '../products/dto/presentation.dto.js';

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

  @ApiProperty({ example: 'zona-1', required: false, description: 'Sucursal origen; obligatoria para VENTA, MERMA, PERDIDA_ROBO y TRANSFERENCIA' })
  @IsOptional()
  @IsString()
  fromBranchSlug?: string;

  @ApiProperty({ example: 'zona-10', required: false, description: 'Sucursal destino; obligatoria para COMPRA, PRODUCCION, SOBRANTE y TRANSFERENCIA' })
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

  @ApiProperty({ example: '2026-08-10', required: false, description: 'Fecha de caducidad del lote comprado; solo se guarda para movimientos COMPRA de productos de origen COMPRADO con control de caducidad' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ example: '2026-08-07', required: false, description: 'Fecha personalizada de alerta para el lote comprado; si se omite se calcula automáticamente' })
  @IsOptional()
  @IsDateString()
  alertAt?: string;
}

export class ReconcileItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  productId!: number;

  @ApiProperty({ example: 45, description: 'Cantidad física real contada' })
  @IsInt()
  @Min(0)
  actualQuantity!: number;

  @ApiPropertyOptional({ type: [PresentationCountDto], description: 'Conteo por presentación; se convierte a unidad base' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresentationCountDto)
  presentationCounts?: PresentationCountDto[];
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
