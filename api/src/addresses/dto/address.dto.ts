import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateAddressDto {
  @ApiProperty({ 
    description: 'Calle y número de la dirección',
    example: 'Av. Principal #123'
  })
  @IsString()
  @MinLength(5)
  street!: string;

  @ApiProperty({ 
    description: 'Ciudad',
    example: 'Caracas'
  })
  @IsString()
  @MinLength(2)
  city!: string;

  @ApiProperty({ 
    description: 'Estado o provincia',
    example: 'Distrito Capital',
    required: false
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ 
    description: 'Zona o sector',
    example: 'Centro',
    required: false
  })
  @IsString()
  @IsOptional()
  zone?: string;

  @ApiProperty({ 
    description: 'Referencia adicional',
    example: 'Edificio azul, piso 3',
    required: false
  })
  @IsString()
  @IsOptional()
  reference?: string;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}

export class AddressDto {
  @ApiProperty({ description: 'ID de la dirección' })
  id!: number;

  @ApiProperty({ description: 'ID del usuario propietario', required: false })
  userId?: string;

  @ApiProperty({ description: 'Calle y número' })
  street!: string;

  @ApiProperty({ description: 'Ciudad' })
  city!: string;

  @ApiProperty({ description: 'Estado', required: false })
  state?: string;

  @ApiProperty({ description: 'Zona', required: false })
  zone?: string;

  @ApiProperty({ description: 'Referencia', required: false })
  reference?: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;
}
