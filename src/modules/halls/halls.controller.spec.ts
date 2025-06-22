import { Test, TestingModule } from '@nestjs/testing';
import { HallsController } from './halls.controller';

describe('HallsController', () => {
  let controller: HallsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HallsController],
    }).compile();

    controller = module.get<HallsController>(HallsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
