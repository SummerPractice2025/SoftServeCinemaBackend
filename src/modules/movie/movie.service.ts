import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';
import {
  GetMovieByIDResponseDTO,
  GetMovieResponseDTO,
} from './dto/get-movie.dto';
import { prismaClient } from '../../db/prismaClient';
import { GetMoviesResponseDTO } from './dto/get-movies.dto';
import { UpdateMovieRespDto } from './dto/update-movie-by-id.dto';
import { AgeRatesService } from '../age-rates/age-rates.service';

@Injectable()
export class MovieService {
  constructor(
    private readonly tmdbService: TmdbService,
    private readonly ageRatesService: AgeRatesService,
  ) {}

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

  async updateMovieById(id: number, dto: UpdateMovieRespDto) {
    if (!id || id <= 0) {
      throw new BadRequestException('Некоректний ID фільму');
    }

    const movie = await this.getMovieByIdNameYear(id);

    if (!movie) {
      throw new NotFoundException(`Фільм не знайдено!`);
    }

    if (
      !dto.name &&
      !dto.age_rate_id &&
      !dto.description &&
      !dto.expiration_date
    ) {
      throw new BadRequestException(
        'Необхідно вказати хоча б одне поле для оновлення',
      );
    }

    const updateData: {
      name?: string;
      rate_id?: number;
      description?: string;
      expires_at?: Date;
    } = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name.trim();
    }

    if (dto.age_rate_id !== undefined) {
      const exists = await this.ageRatesService.existsById(dto.age_rate_id);
      if (!exists) {
        throw new BadRequestException(
          `Віковий рейтинг з ID ${dto.age_rate_id} не існує!`,
        );
      }
      updateData.rate_id = dto.age_rate_id;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description.trim();
    }

    if (dto.expiration_date !== undefined) {
      if (
        !dto.expiration_date.includes('T') &&
        !dto.expiration_date.includes(':')
      ) {
        dto.expiration_date = `${dto.expiration_date} ${'23:59:59'}`;
      }
      updateData.expires_at = new Date(dto.expiration_date);
    }

    await prismaClient.movie.update({
      where: { id },
      data: updateData,
    });
  }

  private getMovieByIdNameYear(id?: number, name?: string, year?: number) {
    return prismaClient.movie.findUnique({
      where: { id, name, year },
    });
  }
}
