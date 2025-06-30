import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GenresModule } from './modules/genres/genres.module';
import { MovieModule } from './modules/movie/movie.module';
import { SessionModule } from './modules/session/session.module';
import { AgeRatesModule } from './modules/age-rates/age-rates.module';
import { HallsModule } from './modules/halls/halls.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './modules/common/common.module';
import { BookingModule } from './modules/booking/booking.module';
import { CryptoModule } from './modules/crypto/crypto.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    GenresModule,
    AgeRatesModule,
    SessionModule,
    MovieModule,
    HallsModule,
    UserModule,
    AuthModule,
    CommonModule,
    BookingModule,
    CryptoModule,
  ],
})
export class AppModule {}
