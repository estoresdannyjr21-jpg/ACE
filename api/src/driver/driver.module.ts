import { Module } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { TripRequirementsModule } from '../trip-requirements/trip-requirements.module';

@Module({
  imports: [NotificationsModule, TripRequirementsModule],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}

