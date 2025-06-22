import { Test, TestingModule } from '@nestjs/testing';
import { AgeRatesController } from './age-rates.controller';
import { AgeRatesService } from './age-rates.service';

describe('AgeRatesController', () => {
  let controller: AgeRatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgeRatesController],
      providers: [AgeRatesService],
    }).compile();

    controller = module.get<AgeRatesController>(AgeRatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
