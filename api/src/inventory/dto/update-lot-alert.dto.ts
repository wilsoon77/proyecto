import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLotAlertDto {
  @ApiPropertyOptional({ type: String, description: 'Fecha explícita para la alerta de caducidad (YYYY-MM-DD). Enviar null restaura los recordatorios del producto.', nullable: true })
  @IsOptional()
  @IsDateString()
  alertAt?: string | null;

  @ApiPropertyOptional({ description: 'Días de anticipación antes de la fecha de caducidad (0 a 90 días)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  daysBefore?: number;

  @ApiPropertyOptional({ description: 'Nueva fecha de caducidad del lote si se requiere corregir (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
