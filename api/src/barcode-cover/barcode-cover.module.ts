import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BarcodeCoverService } from './barcode-cover.service';

@Module({
  imports: [ConfigModule],
  providers: [BarcodeCoverService],
  exports: [BarcodeCoverService],
})
export class BarcodeCoverModule {}
