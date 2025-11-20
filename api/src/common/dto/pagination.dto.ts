import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PageQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Número de página (1-indexed)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100, description: 'Tamaño de página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}

export class PaginatedMetaDto {
  @ApiProperty({ example: 57 }) total!: number;
  @ApiProperty({ example: 6 }) pageCount!: number;
  @ApiProperty({ example: 2 }) page!: number;
  @ApiProperty({ example: 10 }) pageSize!: number;
}
