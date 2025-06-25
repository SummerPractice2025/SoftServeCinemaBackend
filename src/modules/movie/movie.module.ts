import { Module, forwardRef } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { AgeRatesModule } from '../age-rates/age-rates.module';

@Module({
  imports: [forwardRef(() => TmdbModule), AgeRatesModule],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
