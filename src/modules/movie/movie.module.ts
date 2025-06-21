import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TmdbService } from './tmdb.service';

@Module({
  controllers: [MovieController],
  providers: [MovieService, TmdbService],
})
export class MovieModule {}
