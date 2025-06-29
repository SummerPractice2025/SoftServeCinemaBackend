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
import { AddMovieRequestDTO } from './dto/add-movie.dto';
import { fromZonedTime } from 'date-fns-tz';
import { CommonService } from '../common/common.service';
import { HallsService } from '../halls/halls.service';
import { SessionService } from '../session/session.service';

@Injectable()
export class MovieService {
  constructor(
    private readonly tmdbService: TmdbService,
    private readonly ageRatesService: AgeRatesService,
    private readonly commonService: CommonService,
    private readonly hallsService: HallsService,
    private readonly sessionService: SessionService,
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
    });
  }

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

  async createMovie(dto: AddMovieRequestDTO) {
    const {
      actors,
      directors,
      studios,
      genres,
      sessions,
      age_rate_id,
      ...movieData
    } = dto;
    const tz = 'Europe/Kyiv';

    const movie = await prismaClient.movie.findFirst({
      where: {
        name: movieData.name,
        year: movieData.year,
      },
    });

    if (movie) {
      throw new BadRequestException(
        `Фільм ${movieData.name} ${movieData.year} року було додано раніше.`,
      );
    }

    if (!sessions.length) {
      throw new BadRequestException('Має бути принаймні один сеанс!');
    }

    const ageRateExists = await this.ageRatesService.existsById(age_rate_id);
    if (!ageRateExists) {
      throw new BadRequestException(
        `Віковий рейтинг із id ${age_rate_id} не знайдено!`,
      );
    }

    for (const session of sessions) {
      const hallExists = await this.hallsService.existsById(session.hallID);
      if (!hallExists) {
        throw new BadRequestException(
          `Зал із id ${session.hallID} не знайдено!`,
        );
      }

      const sessionTypeExists = await this.existsSessionTypeById(
        session.sessionTypeID,
      );
      if (!sessionTypeExists) {
        throw new BadRequestException(
          `Тип сеансу із id ${session.sessionTypeID} не знайдено!`,
        );
      }
    }

    return await prismaClient.$transaction(async (tx) => {
      const genreRecords = await Promise.all(
        genres.map(async (name) => {
          const existing = await tx.genre.findFirst({
            where: { name: name },
          });
          return existing ?? (await tx.genre.create({ data: { name: name } }));
        }),
      );

      const actorRecords = await Promise.all(
        actors.map(async (fullName) => {
          const { first_name, last_name } = this.splitFullName(fullName);
          const existing = await tx.actor.findFirst({
            where: { first_name, last_name },
          });
          return (
            existing ??
            (await tx.actor.create({ data: { first_name, last_name } }))
          );
        }),
      );

      const directorRecords = await Promise.all(
        directors.map(async (fullName) => {
          const { first_name, last_name } = this.splitFullName(fullName);
          const existing = await tx.director.findFirst({
            where: { first_name, last_name },
          });
          return (
            existing ??
            (await tx.director.create({ data: { first_name, last_name } }))
          );
        }),
      );

      const studioRecords = await Promise.all(
        studios.map(async (name) => {
          const existing = await tx.studio.findFirst({
            where: { name },
          });
          return existing ?? (await tx.studio.create({ data: { name } }));
        }),
      );

      const parsedDates = sessions.map(
        (s) => new Date(s.date.replace(' ', 'T')),
      );

      const maxDate = new Date(
        Math.max(...parsedDates.map((d) => d.getTime())),
      );
      maxDate.setHours(23, 59, 59);

      const movie = await tx.movie.create({
        data: {
          name: movieData.name,
          description: movieData.description,
          duration: movieData.duration,
          year: movieData.year,
          expires_at: fromZonedTime(maxDate, tz),
          created_at: new Date(),
          thumbnail_url: movieData.poster_url,
          trailer_url: movieData.trailer_url,
          rate: { connect: { id: age_rate_id } },
        },
      });

      await this.sessionService.validateSessionsNoOverlap(
        sessions.map((dto) => ({ ...dto, movieID: movie.id })),
        tx,
      );

      for (const session of sessions) {
        const parsed = new Date(session.date.replace(' ', 'T'));

        await tx.session.create({
          data: {
            movie: { connect: { id: movie.id } },
            date: fromZonedTime(parsed, tz),
            price: session.price,
            price_VIP: session.priceVIP,
            hall: { connect: { id: session.hallID } },
            sessionType: { connect: { id: session.sessionTypeID } },
          },
        });
      }

      await tx.movieGenreRelation.createMany({
        data: genreRecords.map((g) => ({
          movie_id: movie.id,
          genre_id: g.id,
        })),
      });

      await tx.movieActorRelation.createMany({
        data: actorRecords.map((a) => ({
          movie_id: movie.id,
          actor_id: a.id,
        })),
      });

      await tx.movieDirectorRelation.createMany({
        data: directorRecords.map((d) => ({
          movie_id: movie.id,
          director_id: d.id,
        })),
      });

      await tx.movieStudioRelation.createMany({
        data: studioRecords.map((s) => ({
          movie_id: movie.id,
          studio_id: s.id,
        })),
      });

      return {
        message: 'Фільм успішно створено!',
        movieId: movie.id,
        status: 'success',
        createdEntities: {
          genres: genreRecords.length,
          actors: actorRecords.length,
          directors: directorRecords.length,
          studios: studioRecords.length,
          sessions: sessions.length,
        },
      };
    });
  }

  async existsSessionTypeById(session_type_id: number): Promise<boolean> {
    const sessionType = await prismaClient.sessionType.findUnique({
      where: { id: session_type_id },
    });

    if (!sessionType) return false;
    return true;
  }

  private splitFullName(fullName: string): {
    first_name: string;
    last_name: string;
  } {
    const [first_name, ...rest] = fullName.trim().split(' ');
    const last_name = rest.join(' ');
    return { first_name, last_name };
  }
}
