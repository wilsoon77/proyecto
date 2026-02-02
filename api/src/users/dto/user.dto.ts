import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsOptional, MinLength, IsInt } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateUserDto {
  @ApiProperty({ 
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com'
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ 
    description: 'Contraseña del usuario',
    example: 'Password123!',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ 
    description: 'Nombre del usuario',
    example: 'Juan'
  })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ 
    description: 'Apellido del usuario',
    example: 'Pérez'
  })
  @IsString()
  @MinLength(2)
  lastName!: string;

  @ApiProperty({ 
    description: 'Teléfono del usuario',
    example: '+58 424-1234567',
    required: false
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ 
    description: 'Rol del usuario',
    enum: ['CUSTOMER', 'EMPLOYEE', 'ADMIN'],
    default: 'CUSTOMER'
  })
  @IsEnum(['CUSTOMER', 'EMPLOYEE', 'ADMIN'])
  role!: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';

  @ApiProperty({ 
    description: 'ID de la sucursal asignada (solo para EMPLOYEE)',
    example: 1,
    required: false
  })
  @IsInt()
  @IsOptional()
  branchId?: number;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ 
    description: 'Nueva contraseña (opcional)',
    required: false,
    minLength: 8
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;
}

export class AdminUserDto {
  @ApiProperty({ description: 'ID del usuario' })
  id!: string;

  @ApiProperty({ description: 'Email del usuario' })
  email!: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  firstName!: string;

  @ApiProperty({ description: 'Apellido del usuario' })
  lastName!: string;

  @ApiProperty({ description: 'Teléfono del usuario', required: false })
  phone?: string;

  @ApiProperty({ description: 'Rol del usuario', enum: ['CUSTOMER', 'EMPLOYEE', 'ADMIN'] })
  role!: string;

  @ApiProperty({ description: 'Estado activo del usuario' })
  isActive!: boolean;

  @ApiProperty({ description: 'ID de la sucursal asignada', required: false })
  branchId?: number;

  @ApiProperty({ description: 'Sucursal asignada', required: false })
  branch?: { id: number; name: string; slug: string };

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Cantidad de pedidos', required: false })
  orderCount?: number;
}
