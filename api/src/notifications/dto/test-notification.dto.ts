import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class TestNotificationDto {
  @ApiProperty({ example: 'order.new_pending' })
  @IsString()
  @IsNotEmpty()
  key!: string;
}
