import { ApiProperty } from '@nestjs/swagger';
import { Rate } from 'generated/prisma';

export class GetAgeRatesResponseDTO {
  constructor(rate: Rate) {
    this.id = rate.id;
    this.age_rate = rate.rate;
  }

  @ApiProperty({ description: 'age rate id' })
  id: number;

  @ApiProperty({ description: 'age rate name' })
  age_rate: string;
}
