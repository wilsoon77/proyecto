import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsNumber, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateBranchDto {
  @ApiProperty({ 
    description: 'Nombre de la sucursal',
    example: 'Sucursal Centro'
  })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({ 
    description: 'Slug único de la sucursal (usado en URLs)',
    example: 'sucursal-centro'
  })
  @IsString()
  @MinLength(3)
  slug!: string;

  @ApiProperty({ 
    description: 'Dirección completa de la sucursal',
    example: 'Av. Principal #123, Centro'
  })
  @IsString()
  @MinLength(5)
  address!: string;

  @ApiProperty({ 
    description: 'Teléfono de la sucursal',
    example: '+58 424-1234567',
    required: false
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ 
    description: 'Latitud para geolocalización',
    example: 10.4806,
    required: false
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ 
    description: 'Longitud para geolocalización',
    example: -66.9036,
    required: false
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {}

export class BranchDto {
  @ApiProperty({ description: 'ID de la sucursal' })
  id!: number;

  @ApiProperty({ description: 'Nombre de la sucursal' })
  name!: string;

  @ApiProperty({ description: 'Slug de la sucursal' })
  slug!: string;

  @ApiProperty({ description: 'Dirección de la sucursal' })
  address!: string;

  @ApiProperty({ description: 'Teléfono de la sucursal', required: false })
  phone?: string;

  @ApiProperty({ description: 'Latitud', required: false })
  latitude?: number;

  @ApiProperty({ description: 'Longitud', required: false })
  longitude?: number;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;

  @ApiProperty({ description: 'Cantidad de productos en inventario', required: false })
  inventoryCount?: number;
}
