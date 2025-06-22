import { Test, TestingModule } from '@nestjs/testing';
import { HallsService } from './halls.service';

describe('HallsService', () => {
  let service: HallsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HallsService],
    }).compile();

    service = module.get<HallsService>(HallsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
