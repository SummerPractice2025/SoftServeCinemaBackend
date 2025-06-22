import { ApiProperty } from '@nestjs/swagger';

export class AddSessionRequestDTO {
  @ApiProperty({ description: 'movie id' })
  movieID: number;

  @ApiProperty({ description: 'session date' })
  date: string;

  @ApiProperty({ description: 'default ticket price' })
  price: number;

  @ApiProperty({ description: 'vip ticket price' })
  priceVIP: number;

  @ApiProperty({ description: 'hall id' })
  hallID: number;

  @ApiProperty({ description: 'session type id' })
  sessionTypeID: number;
}
