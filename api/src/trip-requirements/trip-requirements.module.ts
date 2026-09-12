import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TripRequirementsService } from './trip-requirements.service';

@Module({
  imports: [AuditModule],
  providers: [TripRequirementsService],
  exports: [TripRequirementsService],
})
export class TripRequirementsModule {}
