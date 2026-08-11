import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsNotEmpty } from 'class-validator';

export const OPERATIONAL_NOTIFICATION_KEYS = [
  'inventory.raw_material_low',
  'inventory.expiration_warning',
] as const;

export class TestNotificationDto {
  @ApiProperty({
    example: 'inventory.raw_material_low',
    enum: OPERATIONAL_NOTIFICATION_KEYS,
    description: 'Únicas alertas operativas configurables: materia prima baja o caducidad próxima',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn([...OPERATIONAL_NOTIFICATION_KEYS])
  key!: string;
}
