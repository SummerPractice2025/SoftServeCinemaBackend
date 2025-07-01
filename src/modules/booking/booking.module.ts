import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { SessionModule } from '../session/session.module';
import { HallsModule } from '../halls/halls.module';

@Module({
  controllers: [BookingController],
  providers: [BookingService],
  imports: [SessionModule, HallsModule],
  exports: [BookingService],
})
export class BookingModule {}
