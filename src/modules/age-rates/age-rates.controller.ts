import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetAgeRatesResponseDTO } from './dto/get-age-rates.dto';
import { AgeRatesService } from './age-rates.service';

@ApiTags('age-rates')
@Controller('age-rates')
export class AgeRatesController {
  constructor(private readonly ageRatesService: AgeRatesService) {}

  @Get()
  @ApiOperation({ description: 'Returns all age rate IDs and names' })
  @ApiOkResponse({
    description: "If success returns an age rate's list.",
    type: GetAgeRatesResponseDTO,
    isArray: true,
  })
  async getAgeRates() {
    return this.ageRatesService.getAgeRates();
  }
}
