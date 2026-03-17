import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { BarcodeCoverModule } from '../barcode-cover/barcode-cover.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RatesModule } from '../rates/rates.module';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';

@Module({
  imports: [AuditModule, NotificationsModule, IncidentsModule, BarcodeCoverModule, RatesModule],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
