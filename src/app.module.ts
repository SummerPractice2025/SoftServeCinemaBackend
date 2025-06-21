import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GenresModule } from './modules/genres/genres.module';
import { AgeRatesModule } from './modules/age-rates/age-rates.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [GenresModule, AgeRatesModule],
})
export class AppModule {}
