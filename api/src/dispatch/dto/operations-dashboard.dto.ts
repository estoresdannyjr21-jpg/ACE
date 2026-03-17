import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { AssignmentStatus, HighLevelTripStatus, IncidentSeverity, IncidentStatus, PODStatus } from '@prisma/client';

export class OperationsDashboardQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceCategoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by operator at assignment' })
  @IsOptional()
  @IsString()
  operatorId?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned driver' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({ description: 'From date (runsheet date), ISO' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'To date (runsheet date), ISO' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: AssignmentStatus })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  assignmentStatus?: AssignmentStatus;

  @ApiPropertyOptional({ enum: HighLevelTripStatus })
  @IsOptional()
  @IsEnum(HighLevelTripStatus)
  highLevelTripStatus?: HighLevelTripStatus;

  @ApiPropertyOptional({ enum: PODStatus })
  @IsOptional()
  @IsEnum(PODStatus)
  podStatus?: PODStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originArea?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationArea?: string;

  @ApiPropertyOptional({ enum: IncidentStatus, description: 'Filter incidents list' })
  @IsOptional()
  @IsEnum(IncidentStatus)
  incidentStatus?: IncidentStatus;

  @ApiPropertyOptional({ enum: IncidentSeverity, description: 'Filter incidents list' })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  incidentSeverity?: IncidentSeverity;
}
