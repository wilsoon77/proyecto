import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PushSubscriptionKeysDto {
  @ApiProperty({ example: 'BIPadGPT...' })
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @ApiProperty({ example: 'authsecret...' })
  @IsString()
  @IsNotEmpty()
  auth!: string;
}

export class SubscribePushDto {
  @ApiProperty({ example: 'https://updates.push.services.mozilla.com/wpush/v2/...' })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys!: PushSubscriptionKeysDto;
}
