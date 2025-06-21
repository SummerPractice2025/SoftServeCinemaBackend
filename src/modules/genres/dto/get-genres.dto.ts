import { ApiProperty } from '@nestjs/swagger';
import { Genre } from 'generated/prisma';

export class GetGenresResponseDTO {
  constructor(genre: Genre) {
    this.id = genre.id;
    this.name = genre.name;
  }

  @ApiProperty({ description: 'genre id' })
  id: number;

  @ApiProperty({ description: 'genre name' })
  name: string;
}
