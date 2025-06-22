import { Injectable } from '@nestjs/common';
import { GetAgeRatesResponseDTO } from './dto/get-age-rates.dto';
import { prismaClient } from 'src/db/prismaClient';

@Injectable()
export class AgeRatesService {
  async getAgeRates(): Promise<GetAgeRatesResponseDTO[]> {
    const response = await prismaClient.rate.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    return response.map((rate) => new GetAgeRatesResponseDTO(rate));
  }
}
