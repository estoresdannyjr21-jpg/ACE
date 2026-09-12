import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsEnum,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DocumentType, TripRequirementKind } from '@prisma/client';

const CODE_PATTERN = /^[A-Z0-9_]+$/;
const CODE_MESSAGE = 'code must be uppercase letters, numbers, or underscores';

export class CreateClientDto {
  @ApiProperty({ description: 'Client display name', example: 'Shopee Express' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Client code used by rate / AR uploads (unique per tenant)',
    example: 'SPX',
  })
  @Matches(CODE_PATTERN, { message: CODE_MESSAGE })
  code: string;

  @ApiPropertyOptional({ description: 'ACTIVE or INACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateClientDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'ACTIVE or INACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateServiceSegmentDto {
  @ApiProperty({ description: 'Segment display name', example: 'FM Oncall' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Segment code used by rate / AR uploads (unique per client)',
    example: 'FM_ONCALL',
  })
  @Matches(CODE_PATTERN, { message: CODE_MESSAGE })
  code: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'ACTIVE or INACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateServiceSegmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'ACTIVE or INACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

/** Operational + financial rules that used to live in code or ClientServiceConfig. */
export class ServiceCategoryRulesDto {
  @ApiPropertyOptional({ description: 'Payout terms in business days from cycle start', example: 8 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  payoutTermsBusinessDays?: number;

  @ApiPropertyOptional({ description: 'Day the client expects documents', example: 'Tuesday' })
  @IsOptional()
  @IsString()
  docSubmissionDay?: string;

  @ApiPropertyOptional({ description: 'Day the payout cycle starts counting', example: 'Wednesday' })
  @IsOptional()
  @IsString()
  cycleStartDay?: string;

  @ApiPropertyOptional({ description: 'Skip Sat/Sun when counting business days', default: true })
  @IsOptional()
  @IsBoolean()
  excludeWeekends?: boolean;

  @ApiPropertyOptional({ description: 'Days a subcontractor has to invoice a trip', example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  subcontractorInvoiceDeadlineDays?: number;

  @ApiPropertyOptional({ description: 'Grace period after call time (minutes)', example: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  callTimeGraceMinutes?: number;

  @ApiPropertyOptional({ description: 'VAT divisor for non-VAT base (1.12 = 12% VAT)', example: 1.12 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  vatRate?: number;

  @ApiPropertyOptional({ description: 'Admin fee as a fraction of the VATable base', example: 0.02 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  adminFeePercent?: number;

  @ApiPropertyOptional({ description: 'Withholding tax fraction used for NO_OR payouts', example: 0.02 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  withholdingPercent?: number;

  @ApiPropertyOptional({
    description:
      'Wetlease-style: only the first trip of the day per driver is paid; same-day extras pay 0 (reimbursables still apply)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  firstTripOnlyPayout?: boolean;
}

export class CreateServiceCategoryDto extends ServiceCategoryRulesDto {
  @ApiProperty({ description: 'Parent service segment ID' })
  @IsString()
  serviceSegmentId: string;

  @ApiProperty({ description: 'Category display name', example: 'SPX FM 6WCV Oncall' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Category code used by rate / AR uploads (unique per client)',
    example: 'SPX_FM_6WCV_ONCALL',
  })
  @Matches(CODE_PATTERN, { message: CODE_MESSAGE })
  code: string;

  @ApiPropertyOptional({ description: 'ACTIVE or INACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateServiceCategoryDto extends ServiceCategoryRulesDto {
  @ApiPropertyOptional({ description: 'Move the category to another segment of the same client' })
  @IsOptional()
  @IsString()
  serviceSegmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'ACTIVE or INACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateTripRequirementDto {
  @ApiProperty({ description: 'Requirement code', example: 'SEAL_NUMBER' })
  @Matches(CODE_PATTERN, { message: CODE_MESSAGE })
  code: string;

  @ApiProperty({ description: 'Label shown to drivers and coordinators', example: 'Seal number' })
  @IsString()
  label: string;

  @ApiProperty({
    description: 'DOCUMENT = uploaded file, FIELD = typed value',
    enum: TripRequirementKind,
  })
  @IsEnum(TripRequirementKind)
  kind: TripRequirementKind;

  @ApiPropertyOptional({
    description: 'Document type recorded on the trip when a DOCUMENT requirement is fulfilled',
    enum: DocumentType,
  })
  @IsOptional()
  @IsEnum(DocumentType)
  docType?: DocumentType;

  @ApiPropertyOptional({
    description: 'Limit the requirement to one service category (omit = all categories of the client)',
  })
  @IsOptional()
  @IsString()
  serviceCategoryId?: string;

  @ApiPropertyOptional({ description: 'Blocks trip completion when true', default: true })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'ACTIVE or INACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Hint shown in the driver app' })
  @IsOptional()
  @IsString()
  helpText?: string;
}

export class UpdateTripRequirementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ enum: TripRequirementKind })
  @IsOptional()
  @IsEnum(TripRequirementKind)
  kind?: TripRequirementKind;

  @ApiPropertyOptional({ enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  docType?: DocumentType;

  @ApiPropertyOptional({ description: 'Empty string clears the category scope' })
  @IsOptional()
  @IsString()
  serviceCategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'ACTIVE or INACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  helpText?: string;
}
