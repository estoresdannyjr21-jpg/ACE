import { IsArray, IsBoolean, IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DriverAvailabilityStatus } from '@prisma/client';

export class SetAvailabilityItemDto {
  @ApiProperty({ description: 'Day to tag (ISO date). Use day-only, e.g. 2026-02-10' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: DriverAvailabilityStatus })
  @IsEnum(DriverAvailabilityStatus)
  status: DriverAvailabilityStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'If true, this day is a coding day (independent of availability)' })
  @IsOptional()
  @IsBoolean()
  codingDay?: boolean;
}

export class SetAvailabilityDto {
  @ApiProperty({ type: [SetAvailabilityItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetAvailabilityItemDto)
  items: SetAvailabilityItemDto[];
}

export class GetAvailabilityQueryDto {
  @ApiPropertyOptional({ description: 'From date (ISO)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'To date (ISO)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

