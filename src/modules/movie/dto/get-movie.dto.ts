import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';
import { Movie } from 'generated/prisma';

export class GetMovieFromApiQueryDTO {
  @IsString()
  @ApiProperty({ description: 'film name' })
  name: string;

  @IsNumber()
  @ApiProperty({ description: 'release year' })
  year: number;
}

export class GetMovieResponseDTO {
  constructor();
  constructor(movie: Movie);
  constructor(movie?: Movie) {
    if (movie) {
      // TODO for request GET/movie/{movie_id}
    }
  }

  @ApiProperty({ description: 'movide id' })
  id: number;

  @ApiProperty({ description: 'movie name' })
  name: string;

  @ApiProperty({ description: 'movie description' })
  description: string;

  @ApiProperty({ description: 'movie duration in minutes' })
  duration: number;

  @ApiProperty({ description: 'age rate' })
  ageRate: string;

  @ApiProperty({
    description: 'movie rating compiled by tmdb users from 1 to 10',
  })
  rating: number;

  @ApiProperty({ description: 'poster url from tmdb' })
  posterUrl: string;

  @ApiProperty({ description: 'YouTube URL for trailer' })
  trailerUrl: string;

  @ApiProperty({ description: 'movie genres' })
  genres: string[];

  @ApiProperty({ description: 'all movie directors' })
  directors: string[];

  @ApiProperty({ description: 'main actors' })
  actors: string[];

  @ApiProperty({
    description: 'all studios involved in the creation of the movie',
  })
  studios: string[];
}
