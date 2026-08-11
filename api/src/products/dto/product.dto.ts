import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength, ValidateNested } from 'class-validator';
import { ProductOrigin } from '@prisma/client';
import { Type } from 'class-transformer';
import { ProductPresentationInputDto } from './presentation.dto.js';

export class ProductImageDto {
  @ApiProperty({ example: 8 })
  id!: number;

  @ApiProperty({ example: 'https://example.com/products/concha.jpg' })
  url!: string;

  @ApiProperty({ example: 0 })
  position!: number;
}

export class ProductPresentationDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'Media tira' })
  name!: string;

  @ApiProperty({ example: 3, description: 'Piezas físicas que consume' })
  unitsInStock!: number;

  @ApiPropertyOptional({ example: 1.25, nullable: true })
  price?: number | null;

  @ApiProperty({ example: true })
  isForSale!: boolean;

  @ApiProperty({ example: false })
  isForProduction!: boolean;

  @ApiProperty({ example: true })
  isDefault!: boolean;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ example: 8, description: 'Cantidad disponible en esta presentación' })
  available!: number;
}

export class ProductDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'PROD-0001', description: 'Código SKU único' }) sku!: string;
  @ApiProperty({ example: 'Concha' }) name!: string;
  @ApiProperty({ example: 'concha' }) slug!: string;
  @ApiProperty({ example: 'Pan dulce tradicional', nullable: true }) description?: string;
  @ApiProperty({ example: 0.50 }) basePrice!: number;
  @ApiProperty({ example: 'Pan dulce' }) category!: string;
  @ApiPropertyOptional({ example: 'pan-dulce' }) categorySlug?: string;
  @ApiPropertyOptional({ example: 1 }) categoryId?: number;
  @ApiProperty({ example: 'PRODUCIDO', enum: ['PRODUCIDO','COMPRADO'], nullable: true }) origin?: string;
  @ApiProperty({ example: true, nullable: true }) isNew?: boolean;
  @ApiProperty({ example: 3, nullable: true, description: 'Cantidad del combo (ej: 3 para "3x1.25")' }) comboQuantity?: number;
  @ApiProperty({ example: 1.25, nullable: true, description: 'Precio del combo' }) comboPrice?: number;
  @ApiProperty({ example: 36, nullable: true, description: 'Unidades por lata (solo PRODUCIDO)' }) unitsPerTray?: number;
  @ApiProperty({ example: false, description: 'Control de caducidad por lote; solo aplica a productos de origen COMPRADO' }) tracksExpiration?: boolean;
  @ApiProperty({ example: 3, description: 'Días antes de caducar para generar la alerta; solo aplica a productos COMPRADO' }) expirationAlertDays?: number;
  @ApiProperty({ example: true, description: 'Muestra el producto en el e-commerce' }) isActive?: boolean;
  @ApiProperty({ example: true, description: 'Disponible para venta' }) isAvailable?: boolean;
  @ApiProperty({ example: 24 }) available?: number;
  @ApiProperty({ example: 'piezas' }) stockUnitLabel?: string;
  @ApiPropertyOptional({ type: [ProductPresentationDto] }) presentations?: ProductPresentationDto[];
  @ApiPropertyOptional({ type: [ProductImageDto] }) images?: ProductImageDto[];
  @ApiPropertyOptional({ example: '2026-08-10T15:30:00.000Z', format: 'date-time' }) createdAt?: Date;
  @ApiPropertyOptional({ example: '2026-08-10T15:30:00.000Z', format: 'date-time' }) updatedAt?: Date;
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
  @IsOptional() @IsEnum(ProductOrigin) origin?: ProductOrigin;

  @ApiProperty({ example: true, required: false })
  @IsOptional() @IsBoolean() isNew?: boolean;

  @ApiProperty({ example: true, required: false, description: 'Muestra el producto en el e-commerce' })
  @IsOptional() @IsBoolean() isActive?: boolean;

  @ApiProperty({ example: true, required: false, description: 'Si está disponible para venta' })
  @IsOptional() @IsBoolean() isAvailable?: boolean;

  @ApiProperty({ example: false, required: false, description: 'Activa el control de caducidad por lote; solo aplica a productos de origen COMPRADO' })
  @IsOptional() @IsBoolean() tracksExpiration?: boolean;

  @ApiProperty({ example: 3, required: false, minimum: 0, description: 'Días antes de caducar para alertar; solo aplica a productos COMPRADO' })
  @IsOptional() @IsInt() @Min(0) expirationAlertDays?: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false, description: 'URL de la imagen del producto' })
  @IsOptional() @IsString() imageUrl?: string;

  @ApiPropertyOptional({ type: [ProductPresentationInputDto], description: 'Presentaciones comerciales y operativas' })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProductPresentationInputDto)
  presentations?: ProductPresentationInputDto[];
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
  @IsOptional() @IsEnum(ProductOrigin) origin?: ProductOrigin;

  @ApiProperty({ example: true, required: false })
  @IsOptional() @IsBoolean() isNew?: boolean;

  @ApiProperty({ example: true, required: false, description: 'Muestra el producto en el e-commerce' })
  @IsOptional() @IsBoolean() isActive?: boolean;

  @ApiProperty({ example: true, required: false, description: 'Si está disponible para venta' })
  @IsOptional() @IsBoolean() isAvailable?: boolean;

  @ApiProperty({ example: false, required: false, description: 'Activa el control de caducidad por lote; solo aplica a productos de origen COMPRADO' })
  @IsOptional() @IsBoolean() tracksExpiration?: boolean;

  @ApiProperty({ example: 3, required: false, minimum: 0, description: 'Días antes de caducar para alertar; solo aplica a productos COMPRADO' })
  @IsOptional() @IsInt() @Min(0) expirationAlertDays?: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false, description: 'URL de la imagen del producto' })
  @IsOptional() @IsString() imageUrl?: string;

  @ApiPropertyOptional({ type: [ProductPresentationInputDto], description: 'Reemplaza las presentaciones configuradas' })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProductPresentationInputDto)
  presentations?: ProductPresentationInputDto[];
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
  @IsOptional() @IsEnum(ProductOrigin) origin?: ProductOrigin;
  @ApiProperty({ example: true, required: false })
  @IsOptional() @IsBoolean() isNew?: boolean;
  @ApiProperty({ example: 3, required: false, description: 'Cantidad del combo' })
  @IsOptional() @IsInt() @Min(2) comboQuantity?: number;
  @ApiProperty({ example: 1.25, required: false, description: 'Precio del combo' })
  @IsOptional() @IsNumber() @Min(0) comboPrice?: number;
  @ApiProperty({ example: 36, required: false, description: 'Unidades por lata' })
  @IsOptional() @IsInt() @Min(1) unitsPerTray?: number;

  @ApiPropertyOptional({ example: 'piezas' })
  @IsOptional() @IsString() stockUnitLabel?: string;

  @ApiPropertyOptional({ type: [ProductPresentationInputDto], description: 'Reemplaza las presentaciones configuradas' })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProductPresentationInputDto)
  presentations?: ProductPresentationInputDto[];

  @ApiProperty({ example: false, required: false, description: 'Activa el control de caducidad por lote; solo aplica a productos de origen COMPRADO' })
  @IsOptional() @IsBoolean() tracksExpiration?: boolean;

  @ApiProperty({ example: 3, required: false, minimum: 0, description: 'Días antes de caducar para alertar; solo aplica a productos COMPRADO' })
  @IsOptional() @IsInt() @Min(0) expirationAlertDays?: number;
}
