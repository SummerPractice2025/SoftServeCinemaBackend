import { Module, forwardRef } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TmdbModule } from '../tmdb/tmdb.module';
import { MoviesController } from './movies.controller';

@Module({
  imports: [forwardRef(() => TmdbModule)],
  controllers: [MovieController, MoviesController],
  providers: [MovieService],
})
export class MovieModule {}
