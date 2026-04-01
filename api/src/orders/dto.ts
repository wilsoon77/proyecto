import { IsArray, IsOptional, IsString, IsInt, IsPositive, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ReserveItem {
  @ApiProperty({ example: 'concha' })
  @IsString()
  productSlug!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  quantity!: number;
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
}

export class POSOrderDto {
  @ApiProperty({ example: 'zona-1' })
  @IsString()
  branchSlug!: string;

  @ApiProperty({ type: [ReserveItem], example: [{ productSlug: 'concha', quantity: 2 }] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReserveItem)
  items!: ReserveItem[];

  @ApiProperty({ example: 'EFECTIVO' })
  @IsString()
  paymentMethod!: string;

  @ApiProperty({ example: 50.00, required: false })
  @IsOptional()
  amountTendered?: number; // Para el vuelto
}
