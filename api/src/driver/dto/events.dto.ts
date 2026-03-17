import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ArrayMinSize,
} from 'class-validator';
import { EventType } from '@prisma/client';

export class CreateTripEventDto {
  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({ description: 'Event time (ISO)' })
  @IsDateString()
  eventTime: string;

  @ApiPropertyOptional({ description: 'TripStop id (optional for trip-level events)' })
  @IsOptional()
  @IsString()
  stopId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gpsLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gpsLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gpsAccuracy?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  capturedOffline?: boolean;

  @ApiProperty({
    description: 'At least 1 photo file key per required event',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  mediaFileKeys: string[];
}

