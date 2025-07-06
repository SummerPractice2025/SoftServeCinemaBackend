import { Module } from '@nestjs/common';
import { HallsService } from './halls.service';
import { HallsController } from './halls.controller';

@Module({
  providers: [HallsService],
  controllers: [HallsController],
  exports: [HallsService],
})
export class HallsModule {}
