import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsArray, IsObject } from 'class-validator';

export class UpdateNotificationConfigDto {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({ example: 'Nuevo pedido pendiente', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Nueva orden entrante #{orderNumber}', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ example: ['MANAGER'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];

  @ApiProperty({ example: { threshold: 10 }, required: false })
  @IsOptional()
  @IsObject()
  thresholds?: any;

  @ApiProperty({ example: ['IN_APP', 'PUSH', 'TELEGRAM'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[];

  @ApiProperty({ example: 'suave', required: false })
  @IsOptional()
  @IsString()
  soundType?: string;
}
