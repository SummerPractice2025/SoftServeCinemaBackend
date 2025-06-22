import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GenresModule } from './modules/genres/genres.module';
import { MovieModule } from './modules/movie/movie.module';
import { TmdbModule } from './modules/tmdb/tmdb.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [GenresModule, MovieModule, TmdbModule],
})
export class AppModule {}
