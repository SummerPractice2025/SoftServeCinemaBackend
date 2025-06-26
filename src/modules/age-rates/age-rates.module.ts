import { Module } from '@nestjs/common';
import { AgeRatesService } from './age-rates.service';
import { AgeRatesController } from './age-rates.controller';

@Module({
  controllers: [AgeRatesController],
  providers: [AgeRatesService],
  exports: [AgeRatesService],
})
export class AgeRatesModule {}
