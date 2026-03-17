import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { OperatorController } from './operator.controller';
import { OperatorService } from './operator.service';

@Module({
  imports: [UploadModule],
  controllers: [OperatorController],
  providers: [OperatorService],
})
export class OperatorModule {}

