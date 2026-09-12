import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FulfillRequirementItemDto {
  @ApiPropertyOptional({
    description: 'Requirement code from master data (e.g. SEAL_NUMBER). Use this or requirementId.',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Requirement id. Use this or code.' })
  @IsOptional()
  @IsString()
  requirementId?: string;

  @ApiPropertyOptional({ description: 'Value for FIELD requirements' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ description: 'Uploaded file key for DOCUMENT requirements' })
  @IsOptional()
  @IsString()
  fileKey?: string;
}

export class FulfillTripRequirementsDto {
  @ApiProperty({ type: [FulfillRequirementItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FulfillRequirementItemDto)
  items: FulfillRequirementItemDto[];
}

export class ForceCompleteTripDto {
  @ApiProperty({
    description: 'Why the trip is being closed without meeting the client requirements',
    example: 'Client waived POD for 2026-08-20 system outage',
  })
  @IsString()
  reason: string;
}
