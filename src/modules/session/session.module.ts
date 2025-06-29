import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { CommonModule } from '../common/common.module';
import { HallsModule } from '../halls/halls.module';

@Module({
  imports: [CommonModule, HallsModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
