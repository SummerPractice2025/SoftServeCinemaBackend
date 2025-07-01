import { ApiProperty } from '@nestjs/swagger';

export class FilmStatsFieldsDTO {
  @ApiProperty({ description: 'Name of the film', example: 'Inside Out 2' })
  film_name: string;

  @ApiProperty({
    description: 'Number of tickets sold for the film.',
    example: 154200000,
  })
  sold_tickets: number;
}

export class TopFilmsRespDTO {
  @ApiProperty({
    description:
      'List of top films sorted by tickets sold, created_at movie (if tickets sold are the same number).',
    type: [FilmStatsFieldsDTO],
  })
  films: FilmStatsFieldsDTO[];
}
