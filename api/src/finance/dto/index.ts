import { IsString, IsOptional, IsDateString, IsNumber, Min, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ReimbursableStatus } from '@prisma/client';

export class PayoutBatchExclusionDto {
  @ApiProperty({ description: 'Trip ID that is eligible but not included' })
  @IsString()
  tripId: string;

  @ApiProperty({ description: 'Reason for not including (mandatory remark)' })
  @IsString()
  reason: string;
}

export class CreatePayoutBatchDto {
  @ApiProperty({ description: 'Operator ID' })
  @IsString()
  operatorId: string;

  @ApiProperty({ description: 'Client account ID' })
  @IsString()
  clientAccountId: string;

  @ApiProperty({ description: 'Target release date for this batch (e.g. Monday Mar 2, 2026, ISO date)' })
  @IsDateString()
  targetReleaseDate: string;

  @ApiProperty({ description: 'Trip IDs to include in the batch (must be eligible for targetReleaseDate)' })
  @IsString({ each: true })
  includedTripIds: string[];

  @ApiProperty({
    description: 'Eligible trips not included: each must have tripId and reason',
    type: [PayoutBatchExclusionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayoutBatchExclusionDto)
  exclusions: PayoutBatchExclusionDto[];
}

export class GetPayoutBatchesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  operatorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by target release date (ISO date)' })
  @IsOptional()
  @IsDateString()
  targetReleaseDate?: string;
}

export class GetEligibleTripsQueryDto {
  @ApiProperty({ description: 'Target release date (ISO date, e.g. 2026-03-02)' })
  @IsDateString()
  targetReleaseDate: string;

  @ApiProperty()
  @IsString()
  operatorId: string;

  @ApiProperty()
  @IsString()
  clientAccountId: string;
}

export class SetBatchHeldDto {
  @ApiProperty({ description: 'True = hold payout, false = release' })
  @IsBoolean()
  held: boolean;
}

export class SubmitOverrideRequestDto {
  @ApiProperty({ description: 'Reason for override (e.g. expired 30-day invoice deadline)' })
  @IsString()
  reason: string;
}

export class RejectOverrideRequestDto {
  @ApiProperty()
  @IsString()
  rejectionReason: string;
}

export class UpdateReimbursablesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tollAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gasAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  parkingAmount?: number;

  @ApiPropertyOptional({ enum: ReimbursableStatus })
  @IsOptional()
  @IsEnum(ReimbursableStatus)
  reimbursableStatus?: ReimbursableStatus;
}
