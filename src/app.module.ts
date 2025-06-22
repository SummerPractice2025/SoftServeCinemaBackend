import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GenresModule } from './modules/genres/genres.module';
import { MovieModule } from './modules/movie/movie.module';
import { SessionModule } from './modules/session/session.module';
import { AgeRatesModule } from './modules/age-rates/age-rates.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [GenresModule, AgeRatesModule, SessionModule, MovieModule],
})
export class AppModule {}
