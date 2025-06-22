import { Injectable, NotFoundException } from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';
import {
  GetMovieByIDResponseDTO,
  GetMovieResponseDTO,
} from './dto/get-movie.dto';
import { prismaClient } from '../../db/prismaClient';
import { GetMoviesResponseDTO } from './dto/get-movies.dto';

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

  async getActiveAndUpcomingMovies(
    quantity?: number,
  ): Promise<GetMoviesResponseDTO[]> {
    const now = new Date();
    const nowUtc = now.toISOString();
    const twoWeeksLater = new Date(
      now.getTime() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const movies = await prismaClient.movie.findMany({
      where: {
        OR: [
          {
            created_at: { lte: nowUtc },
            expires_at: { gte: nowUtc },
          },
          {
            created_at: { gte: nowUtc, lte: twoWeeksLater },
          },
        ],
      },
      take: quantity,
      orderBy: { created_at: 'asc' },
      include: {
        genres: { select: { genre: true } },
        sessions: {
          where: { date: { gte: nowUtc } },
          orderBy: { date: 'asc' },
          take: 1,
          include: {
            sessionType: true,
          },
        },
      },
    });

    return movies.map((movie) => {
      const closestSession = movie.sessions[0];
      const sessionType = closestSession.sessionType;

      const genres = movie.genres.map((g) => g.genre);

      return new GetMoviesResponseDTO(
        movie,
        genres,
        closestSession,
        sessionType,
      );
    });
  }
}
