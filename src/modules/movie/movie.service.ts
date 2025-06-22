import { Injectable, NotFoundException } from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';
import {
  GetMovieByIDResponseDTO,
  GetMovieResponseDTO,
} from './dto/get-movie.dto';
import { prismaClient } from '../../db/prismaClient';

@Injectable()
export class MovieService {
  constructor(private readonly tmdbService: TmdbService) {}

  async findMovie(title: string, year: number): Promise<GetMovieResponseDTO> {
    return this.tmdbService.getMovieByTitleAndYear(title, year);
  }

  async getMovie(movieID: number): Promise<GetMovieByIDResponseDTO> {
    const movie = await prismaClient.movie.findUnique({
      where: { id: movieID },
      include: {
        rate: true,
        genres: {
          include: { genre: true },
        },
        actors: {
          include: { actor: true },
        },
        directors: {
          include: { director: true },
        },
        studios: {
          include: { studio: true },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException(`Фільм з ID ${movieID} не знайдено`);
    }

    const rating = await this.tmdbService.getMovieRating(
      movie.name,
      movie.year,
    );

    return new GetMovieByIDResponseDTO(movie, rating);
  }
}
