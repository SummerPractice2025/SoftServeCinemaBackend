import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { CommonModule } from '../common/common.module';
import { HallsModule } from '../halls/halls.module';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [CommonModule, HallsModule],
  controllers: [SessionController, SessionsController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
