import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class ProductDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'Concha' }) name!: string;
  @ApiProperty({ example: 'concha' }) slug!: string;
  @ApiProperty({ example: 'Pan dulce tradicional', nullable: true }) description?: string;
  @ApiProperty({ example: 10.5 }) price!: number;
  @ApiProperty({ example: 'Pan dulce' }) category!: string;
  @ApiProperty({ example: true, nullable: true }) isNew?: boolean;
  @ApiProperty({ example: 10, nullable: true }) discount?: number;
  @ApiProperty({ example: 24 }) available?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Concha' })
  @IsString() @MinLength(2) name!: string;

  @ApiProperty({ example: 'concha' })
  @IsString() slug!: string;

  @ApiProperty({ example: 'Pan dulce tradicional', required: false })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ example: 10.5 })
  @IsNumber() @Min(0) price!: number;

  @ApiProperty({ example: 'pan-dulce' })
  @IsString() categorySlug!: string;

  @ApiProperty({ example: 'PRODUCIDO', required: false, enum: ['PRODUCIDO','COMPRADO'] })
  @IsOptional() @IsString() origin?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional() @IsBoolean() isNew?: boolean;
}

export class UpdateProductDto {
  @ApiProperty({ example: 'Concha vainilla', required: false })
  @IsOptional() @IsString() name?: string;

  @ApiProperty({ example: 'Pan dulce con vainilla', required: false })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ example: 11.0, required: false })
  @IsOptional() @IsNumber() price?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional() @IsInt() discountPct?: number;

  @ApiProperty({ example: 'pan-dulce', required: false })
  @IsOptional() @IsString() categorySlug?: string;

  @ApiProperty({ example: 'PRODUCIDO', required: false, enum: ['PRODUCIDO','COMPRADO'] })
  @IsOptional() @IsString() origin?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional() @IsBoolean() isNew?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class PutProductDto {
  @ApiProperty({ example: 'Concha', description: 'Nombre completo' })
  @IsString() @MinLength(2) name!: string;
  @ApiProperty({ example: 'Pan dulce tradicional', required: false })
  @IsOptional() @IsString() description?: string;
  @ApiProperty({ example: 10.5 })
  @IsNumber() @Min(0) price!: number;
  @ApiProperty({ example: 'pan-dulce' })
  @IsString() categorySlug!: string;
  @ApiProperty({ example: 'PRODUCIDO', enum: ['PRODUCIDO','COMPRADO'], required: false })
  @IsOptional() @IsString() origin?: string;
  @ApiProperty({ example: true, required: false })
  @IsOptional() @IsBoolean() isNew?: boolean;
  @ApiProperty({ example: 5, required: false })
  @IsOptional() @IsInt() discountPct?: number;
}
