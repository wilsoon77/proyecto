import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';

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

  @ApiProperty({ example: 'hcaptcha-token', required: false, description: 'Token de hCaptcha para protección anti-bots' })
  @IsOptional()
  @IsString()
  captchaToken?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'S3gura123' })
  @IsString()
  password!: string;

  @ApiProperty({ example: 'hcaptcha-token', required: false, description: 'Token de hCaptcha para protección anti-bots' })
  @IsOptional()
  @IsString()
  captchaToken?: string;

  @ApiProperty({ example: true, required: false, description: 'Mantener sesión iniciada por 30 días' })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;

  @ApiProperty({ example: 'device-fingerprint-123', required: false, description: 'Identificador único del dispositivo' })
  @IsOptional()
  @IsString()
  deviceId?: string;
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

export class OAuthCallbackDto {
  @ApiProperty({ example: '7e10e811-dc6b-42b1-bea8-1753b1857921', description: 'ID del usuario en Supabase Auth' })
  @IsString()
  supabaseUserId!: string;

  @ApiProperty({ example: 'usuario@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Pérez', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'https://lh3.googleusercontent.com/...', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ example: 'google', required: false })
  @IsOptional()
  @IsString()
  provider?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '7e10e811-dc6b-42b1-bea8-1753b1857921', description: 'ID del usuario en Supabase Auth (del token de recuperación)' })
  @IsString()
  supabaseUserId!: string;

  @ApiProperty({ example: 'NuevaContraseña123', description: 'Nueva contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
