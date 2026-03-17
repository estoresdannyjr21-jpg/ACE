import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { RatesModule } from '../rates/rates.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { PayslipService } from './payslip.service';

@Module({
  imports: [RatesModule, AuditModule],
  controllers: [FinanceController],
  providers: [FinanceService, PayslipService],
  exports: [FinanceService],
})
export class FinanceModule {}
