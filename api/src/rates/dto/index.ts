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

  @ApiProperty({ description: 'Bill rate amount', example: 1500.5 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  billRateAmount: number;

  @ApiProperty({ description: 'Trip payout rate (VATable)', example: 1200 })
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

  @ApiPropertyOptional({ description: 'Bill rate amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  billRateAmount?: number;

  @ApiPropertyOptional({ description: 'Trip payout rate (VATable)' })
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
