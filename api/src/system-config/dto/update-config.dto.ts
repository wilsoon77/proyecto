import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateConfigDto {
  @ApiProperty({ description: 'The new value for the configuration key, can be string, number, boolean, or object/JSON.' })
  @IsNotEmpty()
  value: any;
}
