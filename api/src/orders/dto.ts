import { IsArray, IsOptional, IsString, IsInt, IsPositive, ValidateNested, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export const PAYMENT_METHODS = Object.values(PaymentMethod);

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

  @ApiProperty({ example: 'EFECTIVO', enum: PAYMENT_METHODS, required: false })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({ example: 'Por favor no poner mucha azúcar', required: false })
  @IsOptional()
  @IsString()
  customerNotes?: string;
}
