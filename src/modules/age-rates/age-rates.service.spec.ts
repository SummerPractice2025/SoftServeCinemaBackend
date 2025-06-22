import { Test, TestingModule } from '@nestjs/testing';
import { AgeRatesService } from './age-rates.service';

describe('AgeRatesService', () => {
  let service: AgeRatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgeRatesService],
    }).compile();

    service = module.get<AgeRatesService>(AgeRatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
