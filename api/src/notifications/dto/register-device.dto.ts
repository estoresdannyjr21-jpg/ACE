import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'FCM device token from the client' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({ description: 'Device identifier for upsert (e.g. Android ID)' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class UnregisterDeviceDto {
  @ApiProperty({ description: 'FCM device token to remove' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
