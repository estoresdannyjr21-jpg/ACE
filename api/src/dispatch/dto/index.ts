import { IsString, IsOptional, IsDateString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AssignmentStatus, HighLevelTripStatus, PODStatus } from '@prisma/client';

export class GetTripsQueryDto {
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
  clientAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalRef?: string;

  @ApiPropertyOptional({ description: 'Page size (default: return all trips if omitted)', maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset for pagination' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class CreateTripDto {
  @ApiProperty()
  @IsString()
  clientAccountId: string;

  @ApiProperty()
  @IsString()
  serviceCategoryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  requestDeliveryDate?: string;

  @ApiProperty()
  @IsDateString()
  runsheetDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['WITH_AB', 'NO_AB'])
  abStatus?: string;

  @ApiProperty()
  @IsString()
  originArea: string;

  @ApiProperty()
  @IsString()
  destinationArea: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  routeCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  tripOrder?: number;

  @ApiProperty()
  @IsDateString()
  callTime: string;

  @ApiProperty()
  @IsString()
  vehicleType: string;

  @ApiProperty()
  @IsString()
  assignedDriverId: string;

  @ApiProperty()
  @IsString()
  assignedVehicleId: string;
}

export class VerifyPODDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectPODDto {
  @ApiProperty()
  @IsString()
  comment: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string; // "blurred", "missing_pages", "wrong_doc", "incomplete"
}
