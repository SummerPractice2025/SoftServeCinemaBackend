import { Module, forwardRef } from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { MovieModule } from '../movie/movie.module';

@Module({
  imports: [forwardRef(() => MovieModule)],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
