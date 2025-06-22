import { Module, forwardRef } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TmdbModule } from '../tmdb/tmdb.module';

@Module({
  imports: [forwardRef(() => TmdbModule)],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
