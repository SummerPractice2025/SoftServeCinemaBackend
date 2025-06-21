import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GenresModule } from './modules/genres/genres.module';
import { SessionModule } from './modules/session/session.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [GenresModule, SessionModule],
})
export class AppModule {}
