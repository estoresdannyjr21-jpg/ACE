import { IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DriverAvailabilityStatus } from '@prisma/client';

export class DriverAvailabilityQueryDto {
  @ApiPropertyOptional({ description: 'Date to check (ISO). If provided, from/to are ignored.' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'From date (ISO)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'To date (ISO)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: DriverAvailabilityStatus })
  @IsOptional()
  @IsEnum(DriverAvailabilityStatus)
  status?: DriverAvailabilityStatus;

  @ApiPropertyOptional({ description: 'Filter by coding day flag' })
  @IsOptional()
  @IsBoolean()
  codingDay?: boolean;
}

