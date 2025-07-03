import { ApiProperty } from '@nestjs/swagger';

export class HallOccupancyItemDTO {
  @ApiProperty({
    description: 'ID of the cinemWa hall',
    example: 1,
  })
  hall_id: number;

  @ApiProperty({
    description: 'Name of the cinema hall',
    example: 'Зала 1',
  })
  hall_name: string;

  @ApiProperty({
    description:
      'Occupancy rate (percentage of seats sold out of total offered), rounded to 2 decimal places',
    example: 50.0,
  })
  occupancy: number;
}

export class GetHallOccupancyRespDTO {
  @ApiProperty({
    type: [HallOccupancyItemDTO],
    description: 'List of halls with their occupancy rate for the given period',
  })
  halls: HallOccupancyItemDTO[];
}
