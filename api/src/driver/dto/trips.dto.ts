import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { AssignmentStatus, HighLevelTripStatus } from '@prisma/client';

export class GetMyTripsQueryDto {
  @ApiPropertyOptional({ enum: AssignmentStatus })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  assignmentStatus?: AssignmentStatus;

  @ApiPropertyOptional({ enum: HighLevelTripStatus })
  @IsOptional()
  @IsEnum(HighLevelTripStatus)
  highLevelTripStatus?: HighLevelTripStatus;
}

export class DeclineTripDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

