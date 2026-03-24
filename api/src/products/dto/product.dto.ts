import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class ProductDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'Concha' }) name!: string;
  @ApiProperty({ example: 'concha' }) slug!: string;
  @ApiProperty({ example: 'Pan dulce tradicional', nullable: true }) description?: string;
  @ApiProperty({ example: 0.50 }) basePrice!: number;
  @ApiProperty({ example: 'Pan dulce' }) category!: string;
  @ApiProperty({ example: 'PRODUCIDO', enum: ['PRODUCIDO','COMPRADO'], nullable: true }) origin?: string;
  @ApiProperty({ example: true, nullable: true }) isNew?: boolean;
  @ApiProperty({ example: 3, nullable: true, description: 'Cantidad del combo (ej: 3 para "3x1.25")' }) comboQuantity?: number;
  @ApiProperty({ example: 1.25, nullable: true, description: 'Precio del combo' }) comboPrice?: number;
  @ApiProperty({ example: 36, nullable: true, description: 'Unidades por lata (solo PRODUCIDO)' }) unitsPerTray?: number;
  @ApiProperty({ example: 24 }) available?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'PROD-0001', description: 'Código SKU único' })
  @IsString() @MinLength(1) sku!: string;

  @ApiProperty({ example: 'Concha' })
  @IsString() @MinLength(2) name!: string;

  @ApiProperty({ example: 'Pan dulce tradicional', required: false })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ example: 0.50, description: 'Precio unitario base' })
  @IsNumber() @Min(0) basePrice!: number;

  @ApiProperty({ example: 3, required: false, description: 'Cantidad del combo (ej: 3 para "3x1.25")' })
  @IsOptional() @IsInt() @Min(2) comboQuantity?: number;

  @ApiProperty({ example: 1.25, required: false, description: 'Precio del combo' })
  @IsOptional() @IsNumber() @Min(0) comboPrice?: number;

  @ApiProperty({ example: 36, required: false, description: 'Unidades por lata (solo para PRODUCIDO)' })
  @IsOptional() @IsInt() @Min(1) unitsPerTray?: number;

  @ApiProperty({ example: 'pan-dulce' })
  @IsString() categorySlug!: string;

  @ApiProperty({ example: 'PRODUCIDO', required: false, enum: ['PRODUCIDO','COMPRADO'] })
  @IsOptional() @IsString() origin?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional() @IsBoolean() isNew?: boolean;

  @ApiProperty({ example: true, required: false, description: 'Si está disponible para venta' })
  @IsOptional() @IsBoolean() isAvailable?: boolean;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false, description: 'URL de la imagen del producto' })
  @IsOptional() @IsString() imageUrl?: string;
}

export class UpdateProductDto {
  @ApiProperty({ example: 'PROD-0001', required: false })
  @IsOptional() @IsString() sku?: string;

  @ApiProperty({ example: 'Concha vainilla', required: false })
  @IsOptional() @IsString() name?: string;

  @ApiProperty({ example: 'Pan dulce con vainilla', required: false })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ example: 0.50, required: false, description: 'Precio unitario base' })
  @IsOptional() @IsNumber() @Min(0) basePrice?: number;

  @ApiProperty({ example: 3, required: false, description: 'Cantidad del combo' })
  @IsOptional() @IsInt() @Min(2) comboQuantity?: number;

  @ApiProperty({ example: 1.25, required: false, description: 'Precio del combo' })
  @IsOptional() @IsNumber() @Min(0) comboPrice?: number;

  @ApiProperty({ example: 36, required: false, description: 'Unidades por lata' })
  @IsOptional() @IsInt() @Min(1) unitsPerTray?: number;

  @ApiProperty({ example: 'pan-dulce', required: false })
  @IsOptional() @IsString() categorySlug?: string;

  @ApiProperty({ example: 'PRODUCIDO', required: false, enum: ['PRODUCIDO','COMPRADO'] })
  @IsOptional() @IsString() origin?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional() @IsBoolean() isNew?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional() @IsBoolean() isActive?: boolean;

  @ApiProperty({ example: true, required: false, description: 'Si está disponible para venta' })
  @IsOptional() @IsBoolean() isAvailable?: boolean;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false, description: 'URL de la imagen del producto' })
  @IsOptional() @IsString() imageUrl?: string;
}

export class PutProductDto {
  @ApiProperty({ example: 'Concha', description: 'Nombre completo' })
  @IsString() @MinLength(2) name!: string;
  @ApiProperty({ example: 'Pan dulce tradicional', required: false })
  @IsOptional() @IsString() description?: string;
  @ApiProperty({ example: 0.50, description: 'Precio unitario base' })
  @IsNumber() @Min(0) basePrice!: number;
  @ApiProperty({ example: 'pan-dulce' })
  @IsString() categorySlug!: string;
  @ApiProperty({ example: 'PRODUCIDO', enum: ['PRODUCIDO','COMPRADO'], required: false })
  @IsOptional() @IsString() origin?: string;
  @ApiProperty({ example: true, required: false })
  @IsOptional() @IsBoolean() isNew?: boolean;
  @ApiProperty({ example: 3, required: false, description: 'Cantidad del combo' })
  @IsOptional() @IsInt() @Min(2) comboQuantity?: number;
  @ApiProperty({ example: 1.25, required: false, description: 'Precio del combo' })
  @IsOptional() @IsNumber() @Min(0) comboPrice?: number;
  @ApiProperty({ example: 36, required: false, description: 'Unidades por lata' })
  @IsOptional() @IsInt() @Min(1) unitsPerTray?: number;
}
