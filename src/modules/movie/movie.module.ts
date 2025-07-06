import { Module, forwardRef } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { MoviesController } from './movies.controller';
import { AgeRatesModule } from '../age-rates/age-rates.module';
import { CommonModule } from '../common/common.module';
import { HallsModule } from '../halls/halls.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    forwardRef(() => TmdbModule),
    AgeRatesModule,
    CommonModule,
    HallsModule,
    SessionModule,
  ],
  controllers: [MovieController, MoviesController],
  providers: [MovieService],
})
export class MovieModule {}
