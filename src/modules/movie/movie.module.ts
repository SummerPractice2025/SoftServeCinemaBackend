import { Module, forwardRef } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { MoviesController } from './movies.controller';
import { AgeRatesModule } from '../age-rates/age-rates.module';

@Module({
  imports: [forwardRef(() => TmdbModule), AgeRatesModule],
  controllers: [MovieController, MoviesController],
  providers: [MovieService],
})
export class MovieModule {}
