import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetArBatchesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by client account ID' })
  @IsOptional()
  @IsString()
  clientAccountId?: string;

  @ApiPropertyOptional({ description: 'Filter by service segment', enum: ['FM_ONCALL', 'FM_WETLEASE', 'MFM_ONCALL'] })
  @IsOptional()
  @IsString()
  serviceSegment?: string;

  @ApiPropertyOptional({ description: 'Filter by batch status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Cut-off start on or after (ISO date)' })
  @IsOptional()
  @IsDateString()
  cutoffFrom?: string;

  @ApiPropertyOptional({ description: 'Cut-off end on or before (ISO date)' })
  @IsOptional()
  @IsDateString()
  cutoffTo?: string;
}

export class AttachInvoiceDto {
  @ApiProperty({ description: 'Our invoice number' })
  @IsString()
  invoiceNumber: string;

  @ApiProperty({ description: 'Invoice date (ISO); starts 30-day payment window' })
  @IsDateString()
  invoiceDate: string;
}
