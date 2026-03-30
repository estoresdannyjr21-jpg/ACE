import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRouteRateDto {
  @ApiProperty({ description: 'Client account ID' })
  @IsString()
  clientAccountId: string;

  @ApiProperty({ description: 'Service category ID' })
  @IsString()
  serviceCategoryId: string;

  @ApiProperty({ description: 'Origin area code/name' })
  @IsString()
  originArea: string;

  @ApiProperty({ description: 'Destination area code/name' })
  @IsString()
  destinationArea: string;

  @ApiProperty({ description: 'Start of effective period (ISO date)' })
  @IsDateString()
  effectiveStart: string;

  @ApiPropertyOptional({ description: 'End of effective period (null = no end)' })
  @IsOptional()
  @IsDateString()
  effectiveEnd?: string;

  @ApiProperty({
    description: 'Amount to bill the client (AR / gross billing line)',
    example: 1500.5,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  billRateAmount: number;

  @ApiProperty({
    description: 'Subcontractor trip rate — VATable base for AP (before invoice type & admin fee)',
    example: 1200,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  tripPayoutRateVatable: number;
}

export class UpdateRouteRateDto {
  @ApiPropertyOptional({ description: 'Origin area code/name' })
  @IsOptional()
  @IsString()
  originArea?: string;

  @ApiPropertyOptional({ description: 'Destination area code/name' })
  @IsOptional()
  @IsString()
  destinationArea?: string;

  @ApiPropertyOptional({ description: 'Start of effective period (ISO date)' })
  @IsOptional()
  @IsDateString()
  effectiveStart?: string;

  @ApiPropertyOptional({ description: 'End of effective period (null = no end)' })
  @IsOptional()
  @IsDateString()
  effectiveEnd?: string;

  @ApiPropertyOptional({ description: 'Bill to client (AR)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  billRateAmount?: number;

  @ApiPropertyOptional({ description: 'Subcontractor VATable payout base (AP)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  tripPayoutRateVatable?: number;
}

export class GetRouteRatesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by client account ID' })
  @IsOptional()
  @IsString()
  clientAccountId?: string;

  @ApiPropertyOptional({ description: 'Filter by service category ID' })
  @IsOptional()
  @IsString()
  serviceCategoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by origin area' })
  @IsOptional()
  @IsString()
  originArea?: string;

  @ApiPropertyOptional({ description: 'Filter by destination area' })
  @IsOptional()
  @IsString()
  destinationArea?: string;

  @ApiPropertyOptional({ description: 'Only rates effective on this date (ISO)' })
  @IsOptional()
  @IsDateString()
  effectiveOn?: string;
}

export class CreateWetleaseFirstTripRateDto {
  @ApiProperty({ description: 'Client account ID' })
  @IsString()
  clientAccountId: string;

  @ApiProperty({ description: 'Service category ID (4WCV or 6WCV wetlease only)' })
  @IsString()
  serviceCategoryId: string;

  @ApiProperty({
    description: 'First wetlease trip of the day (per driver) — gross amount to bill the client (AR)',
    example: 4100.0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  firstTripClientBillAmount: number;

  @ApiProperty({
    description:
      'First wetlease trip of the day (per driver) — subcontractor VATable base (AP, before admin fee / invoice type)',
    example: 3100.0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  firstTripPayoutVatable: number;

  @ApiProperty({ description: 'Start of effective period (ISO date/datetime)' })
  @IsDateString()
  effectiveStart: string;

  @ApiPropertyOptional({ description: 'End of effective period (omit = open-ended)' })
  @IsOptional()
  @IsDateString()
  effectiveEnd?: string;
}

export class UpdateWetleaseFirstTripRateDto {
  @ApiPropertyOptional({ description: 'First-trip gross amount billed to client' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  firstTripClientBillAmount?: number;

  @ApiPropertyOptional({ description: 'First-trip subcontractor VATable payout base' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  firstTripPayoutVatable?: number;

  @ApiPropertyOptional({ description: 'Start of effective period (ISO)' })
  @IsOptional()
  @IsDateString()
  effectiveStart?: string;

  @ApiPropertyOptional({ description: 'End of effective period (null = clear end)' })
  @IsOptional()
  @IsDateString()
  effectiveEnd?: string;
}

export class GetWetleaseFirstTripRatesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by client account ID' })
  @IsOptional()
  @IsString()
  clientAccountId?: string;

  @ApiPropertyOptional({ description: 'Filter by service category ID' })
  @IsOptional()
  @IsString()
  serviceCategoryId?: string;
}
