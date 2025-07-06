import { ApiProperty } from '@nestjs/swagger';

export class TopFilmsTemplate {
  @ApiProperty({ description: 'movie name' })
  film_name: string;

  @ApiProperty({ description: 'movie revenue (earned money)' })
  money: number;
}

export class TopFilmsRevenueResp {
  @ApiProperty({ description: 'top of the bestseller films per day' })
  day: TopFilmsTemplate[];

  @ApiProperty({ description: 'top of the bestseller films per week' })
  week: TopFilmsTemplate[];

  @ApiProperty({ description: 'top of the bestseller films per month' })
  month: TopFilmsTemplate[];
}
