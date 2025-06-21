import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GenresModule } from './modules/genres/genres.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [GenresModule],
})
export class AppModule {}
