import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'S3gura123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: '+50212345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'S3gura123' })
  @IsString()
  password!: string;
}

export class UpdateMeDto {
  @ApiProperty({ example: 'Juan', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Pérez', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: '+50212345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class RefreshDto {
  @ApiProperty({ example: 'abc123def456...', description: 'Refresh token recibido en login/register' })
  @IsString()
  refreshToken!: string;
}

export class UserDto {
  @ApiProperty({ example: 'ckv8x9qz40001abcde' })
  id!: string;
  @ApiProperty({ example: 'juan@example.com' })
  email!: string;
  @ApiProperty({ example: 'Juan' })
  firstName!: string;
  @ApiProperty({ example: 'Pérez' })
  lastName!: string;
  @ApiProperty({ example: '+50212345678', nullable: true })
  phone?: string | null;
  @ApiProperty({ example: true })
  isActive!: boolean;
  @ApiProperty({ example: 'CUSTOMER', enum: ['CUSTOMER','EMPLOYEE','ADMIN'] })
  role!: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Access token (15 min)' })
  token!: string;
  @ApiProperty({ example: 'abc123def456...', description: 'Refresh token (7 días)' })
  refreshToken!: string;
  @ApiProperty({ type: UserDto })
  user!: UserDto;
}
