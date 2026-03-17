import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { EventType, IncidentSeverity, IncidentStatus, IncidentType } from '@prisma/client';

export class ProxyTripEventDto {
  @ApiProperty({ description: 'Required: reason for manual encoding (driver cannot update)' })
  @IsString()
  @IsNotEmpty()
  reason: string;

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

  @ApiProperty({ type: [String], description: 'Photo file keys used as proof' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  mediaFileKeys: string[];
}

export class ProxyPodUploadDto {
  @ApiProperty({ description: 'Required: reason for manual encoding (driver cannot upload)' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Object storage key for POD/Runsheet image/pdf' })
  @IsString()
  @IsNotEmpty()
  fileKey: string;
}

export class ProxyReimbursableDocDto {
  @ApiProperty({ description: 'Required: reason for manual encoding (driver cannot upload)' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ enum: ['TOLL', 'GAS', 'PARKING'] })
  @IsString()
  @IsIn(['TOLL', 'GAS', 'PARKING'])
  docType: 'TOLL' | 'GAS' | 'PARKING';

  @ApiProperty({ description: 'Object storage key for the document' })
  @IsString()
  @IsNotEmpty()
  fileKey: string;
}

export class ProxyCreateIncidentDto {
  @ApiProperty({ description: 'Required: reason for encoding incident on behalf of driver' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ enum: IncidentType })
  @IsEnum(IncidentType)
  incidentType: IncidentType;

  @ApiProperty({ enum: IncidentSeverity })
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ApiProperty({ description: 'Incident description' })
  @IsString()
  @IsNotEmpty()
  description: string;

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
}

export class ProxyIncidentUpdateDto {
  @ApiProperty({ description: 'Required: reason for updating incident on behalf of driver' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  newStatus?: IncidentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class ProxyIncidentResolveDto {
  @ApiProperty({ description: 'Required: reason for resolving incident on behalf of driver' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Resolution notes' })
  @IsString()
  @IsNotEmpty()
  resolutionNotes: string;

  @ApiPropertyOptional({ description: 'Replacement trip ID if applicable' })
  @IsOptional()
  @IsString()
  replacementTripId?: string;
}

