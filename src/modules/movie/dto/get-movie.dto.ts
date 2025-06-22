import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';
import { MovieFull } from 'src/db/types';

export class GetMovieFromApiQueryDTO {
  @IsString()
  @ApiProperty({ description: 'film name' })
  name: string;

  @IsNumber()
  @ApiProperty({ description: 'release year' })
  year: number;
}

export class GetMovieResponseDTO {
  constructor() {}

  @ApiProperty({ description: 'movie name' })
  name: string;

  @ApiProperty({ description: 'movie description' })
  description: string;

  @ApiProperty({ description: 'movie duration in minutes' })
  duration: number;

  @ApiProperty({ description: 'movie release year' })
  year: number;

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

export class GetMovieByIDResponseDTO extends GetMovieResponseDTO {
  constructor(movie: MovieFull, rating: number) {
    super();

    this.id = movie.id;
    this.name = movie.name;
    this.description = movie.description;
    this.duration = movie.duration;
    this.year = movie.year;
    this.ageRate = movie.rate.rate;
    this.rating = rating;
    this.posterUrl = movie.thumbnail_url;
    this.trailerUrl = movie.trailer_url;
    this.genres = movie.genres.map((g) => g.genre.name);
    this.directors = movie.directors.map(
      (d) => `${d.director.first_name} ${d.director.last_name}`,
    );
    this.actors = movie.actors.map(
      (a) => `${a.actor.first_name} ${a.actor.last_name}`,
    );
    this.studios = movie.studios.map((s) => s.studio.name);
  }

  @ApiProperty({ description: 'movie id' })
  id: number;
}
