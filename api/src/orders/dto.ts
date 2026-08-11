import { IsArray, IsOptional, IsString, IsInt, IsPositive, ValidateNested, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ReserveItem {
  @ApiProperty({ example: 'concha' })
  @IsString()
  productSlug!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional({ example: 12, description: 'Presentación comercial seleccionada' })
  @IsOptional()
  @IsInt()
  @Min(1)
  presentationId?: number;
}

export class ReserveOrderDto {
  @ApiProperty({ example: 'zona-1' })
  @IsString()
  branchSlug!: string;

  @ApiProperty({ type: [ReserveItem], example: [{ productSlug: 'concha', quantity: 2 }] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReserveItem)
  items!: ReserveItem[];

  @ApiProperty({ example: 'EFECTIVO', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ example: 'Por favor no poner mucha azúcar', required: false })
  @IsOptional()
  @IsString()
  customerNotes?: string;
}
