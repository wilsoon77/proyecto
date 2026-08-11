import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class ProductPresentationInputDto {
  @ApiPropertyOptional({ example: 1, description: 'ID existente; se ignora al crear' })
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @ApiProperty({ example: 'Media tira' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 3, description: 'Piezas físicas que consume' })
  @IsInt()
  @Min(1)
  unitsInStock!: number;

  @ApiPropertyOptional({ example: 1.25, description: 'Precio de venta de la presentación' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isForSale?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isForProduction?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class PresentationCountDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  presentationId!: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  quantity!: number;
}

