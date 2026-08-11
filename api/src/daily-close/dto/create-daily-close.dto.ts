import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PresentationCountDto } from '../../products/dto/presentation.dto.js';

export class DailyCloseItemDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @IsInt()
  @Min(1)
  productId!: number;

  @ApiProperty({ example: 215, description: 'Unidades físicas que quedaron' })
  @IsInt()
  @Min(0)
  countedQty!: number;

  @ApiPropertyOptional({ example: 23, default: 0, description: 'Unidades dañadas o no vendibles' })
  @IsOptional()
  @IsInt()
  @Min(0)
  wasteQty?: number;

  @ApiPropertyOptional({ type: [PresentationCountDto], description: 'Conteo por presentación; se convierte a unidad base' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresentationCountDto)
  countedPresentations?: PresentationCountDto[];

  @ApiPropertyOptional({ type: [PresentationCountDto], description: 'Merma por presentación; se convierte a unidad base' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresentationCountDto)
  wastePresentations?: PresentationCountDto[];
}

export class CreateDailyCloseDto {
  @ApiPropertyOptional({ example: 1, description: 'ID de sucursal. ADMIN y MANAGER pueden seleccionar cualquiera de las dos; los demás roles quedan limitados a su sucursal asignada.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  branchId?: number;

  @ApiProperty({ example: '2026-07-22', description: 'Fecha operativa que se está cerrando (YYYY-MM-DD)' })
  @IsDateString()
  closeDate!: string;

  @ApiProperty({ example: '2026-07-22T23:15:00.000Z', description: 'Momento del snapshot usado para capturar el inventario' })
  @IsDateString()
  snapshotAt!: string;

  @ApiPropertyOptional({ example: 'Cierre normal de la jornada', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiProperty({ type: [DailyCloseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: DailyCloseItemDto) => item.productId)
  @ValidateNested({ each: true })
  @Type(() => DailyCloseItemDto)
  items!: DailyCloseItemDto[];
}
