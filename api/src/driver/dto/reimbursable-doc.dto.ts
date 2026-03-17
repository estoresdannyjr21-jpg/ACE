import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export const REIMBURSABLE_DOC_TYPES = ['TOLL', 'GAS', 'PARKING'] as const;
export type ReimbursableDocType = (typeof REIMBURSABLE_DOC_TYPES)[number];

export class UploadReimbursableDocDto {
  @ApiProperty({ enum: REIMBURSABLE_DOC_TYPES, description: 'TOLL, GAS, or PARKING' })
  @IsIn(REIMBURSABLE_DOC_TYPES)
  docType: ReimbursableDocType;

  @ApiProperty({ description: 'Object storage key for the document' })
  @IsString()
  fileKey: string;
}
