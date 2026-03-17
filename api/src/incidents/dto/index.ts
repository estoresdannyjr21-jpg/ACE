import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IncidentType, IncidentSeverity, IncidentStatus } from '@prisma/client';

export class GetIncidentsQueryDto {
  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({ enum: IncidentSeverity })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiPropertyOptional({ description: 'Filter by trip ID' })
  @IsOptional()
  @IsString()
  tripId?: string;

  @ApiPropertyOptional({ description: 'From date (reportedAt), ISO' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'To date (reportedAt), ISO' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class CreateIncidentDto {
  @ApiProperty({ description: 'Trip ID' })
  @IsString()
  tripId: string;

  @ApiProperty({ enum: IncidentType })
  @IsEnum(IncidentType)
  incidentType: IncidentType;

  @ApiProperty({ enum: IncidentSeverity })
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ApiProperty({ description: 'Incident description' })
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  gpsLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  gpsLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gpsAccuracy?: number;
}

export class AddIncidentUpdateDto {
  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  newStatus?: IncidentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class ResolveIncidentDto {
  @ApiProperty({ description: 'Resolution notes' })
  @IsString()
  resolutionNotes: string;

  @ApiPropertyOptional({ description: 'Replacement trip ID if applicable' })
  @IsOptional()
  @IsString()
  replacementTripId?: string;
}

export class AddIncidentMediaDto {
  @ApiProperty({ description: 'S3/storage file key for uploaded media' })
  @IsString()
  fileKey: string;
}
