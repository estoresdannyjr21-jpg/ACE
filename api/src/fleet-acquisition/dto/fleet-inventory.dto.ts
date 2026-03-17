import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFleetInventoryDto {
  @ApiProperty({ description: 'Client account ID (e.g. SPX)' })
  @IsString()
  clientAccountId: string;

  @ApiProperty({ description: 'Vehicle ID' })
  @IsString()
  vehicleId: string;

  @ApiProperty({ description: 'Tag type', enum: ['PRIMARY', 'SECONDARY'] })
  @IsIn(['PRIMARY', 'SECONDARY'])
  tagType: string;

  @ApiProperty({ description: 'Effective start (ISO date)' })
  @IsDateString()
  effectiveStart: string;

  @ApiPropertyOptional({ description: 'Effective end (null = ongoing)' })
  @IsOptional()
  @IsDateString()
  effectiveEnd?: string;
}

export class UpdateFleetInventoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveEnd?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}

export class GetFleetInventoryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Only entries effective on this date (ISO)' })
  @IsOptional()
  @IsDateString()
  effectiveOn?: string;
}
