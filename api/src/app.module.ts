import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FleetAcquisitionModule } from './fleet-acquisition/fleet-acquisition.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { FinanceModule } from './finance/finance.module';
import { IncidentsModule } from './incidents/incidents.module';
import { RatesModule } from './rates/rates.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OperatorModule } from './operator/operator.module';
import { DriverModule } from './driver/driver.module';
import { AuditModule } from './audit/audit.module';
import { UploadModule } from './upload/upload.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    FleetAcquisitionModule,
    DispatchModule,
    FinanceModule,
    IncidentsModule,
    RatesModule,
    NotificationsModule,
    OperatorModule,
    DriverModule,
    AuditModule,
    UploadModule,
  ],
})
export class AppModule {}
