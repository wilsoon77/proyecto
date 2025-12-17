import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Pan Dulce' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'pan-dulce' })
  @IsString()
  @MinLength(2)
  slug!: string;

  @ApiProperty({ example: 'Variedad de panes dulces y tradicionales', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CategoryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Pan Dulce' })
  name!: string;

  @ApiProperty({ example: 'pan-dulce' })
  slug!: string;

  @ApiProperty({ example: 'Variedad de panes dulces', required: false })
  description?: string | null;

  @ApiProperty({ example: 12 })
  productCount?: number;
}
