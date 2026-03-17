import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { FleetAcquisitionController } from './fleet-acquisition.controller';
import { FleetAcquisitionService } from './fleet-acquisition.service';
import { FleetInventoryController } from './fleet-inventory.controller';
import { FleetInventoryService } from './fleet-inventory.service';

@Module({
  imports: [AuditModule],
  controllers: [FleetAcquisitionController, FleetInventoryController],
  providers: [FleetAcquisitionService, FleetInventoryService],
  exports: [FleetAcquisitionService, FleetInventoryService],
})
export class FleetAcquisitionModule {}
