import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UploadPodDto {
  @ApiProperty({ description: 'Object storage key for POD/Runsheet image/pdf' })
  @IsString()
  fileKey: string;
}

