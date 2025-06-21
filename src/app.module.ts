import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GenresModule } from './modules/genres/genres.module';
import { MovieModule } from './modules/movie/movie.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [GenresModule, MovieModule],
})
export class AppModule {}
