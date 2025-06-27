import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GetSessionTypesResponseDTO } from './dto/get-session-types.dto';
import { prismaClient } from 'src/db/prismaClient';
import { AddSessionRequestDTO } from './dto/add-session.dto';
import { Prisma } from 'generated/prisma';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { GetAvSesnsByMovIDRespDTO } from './dto/get-sessions-by-movie-id.dto';
import { GetSessionByIdResponseDTO } from './dto/get-session-by-id.dto';

const BREAK_BUFFER_MINUTES = 15;
const TIME_ZONE = 'Europe/Kyiv';
const TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

@Injectable()
export class SessionService {
  async getSessionTypes(): Promise<GetSessionTypesResponseDTO[]> {
    const response = await prismaClient.sessionType.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    return response.map(
      (sessionType) => new GetSessionTypesResponseDTO(sessionType),
    );
  }

  async addSessions(dtos: AddSessionRequestDTO[]) {
    if (dtos.length === 0) return;

    const uniqueDates = new Set(
      dtos.map((dto) => new Date(dto.date).toISOString()),
    );
    if (uniqueDates.size !== dtos.length) {
      throw new BadRequestException('Усі сеанси повинні мати унікальні дати.');
    }

    const movieDurations = new Map<number, number>();

    for (const dto of dtos) {
      const sessionStartUTC = fromZonedTime(new Date(dto.date), 'Europe/Kyiv');

      let duration = movieDurations.get(dto.movieID);
      if (duration === undefined) {
        const movie = await prismaClient.movie.findUnique({
          where: { id: dto.movieID },
          select: { duration: true },
        });
        if (!movie) {
          throw new NotFoundException(`Фільм з ID ${dto.movieID} не знайдено`);
        }
        duration = movie.duration;
        movieDurations.set(dto.movieID, duration);
      }

      const previousSession = await prismaClient.session.findFirst({
        where: {
          hall_id: dto.hallID,
          date: {
            lte: sessionStartUTC,
          },
        },
        orderBy: {
          date: 'desc',
        },
        select: {
          date: true,
          movie: { select: { duration: true } },
        },
      });

      if (previousSession) {
        const prevSessionEnd = this.addMinutes(
          previousSession.date,
          previousSession.movie.duration + BREAK_BUFFER_MINUTES,
        );
        if (sessionStartUTC < prevSessionEnd) {
          throw new BadRequestException(
            await this.getSessionOverlapError(
              dto.hallID,
              sessionStartUTC,
              previousSession.date,
            ),
          );
        }
      }

      const nextSession = await prismaClient.session.findFirst({
        where: {
          hall_id: dto.hallID,
          date: {
            gte: sessionStartUTC,
          },
        },
        orderBy: {
          date: 'asc',
        },
        select: {
          date: true,
          movie: { select: { duration: true } },
        },
      });

      if (nextSession) {
        const newSessionEnd = this.addMinutes(
          sessionStartUTC,
          duration + BREAK_BUFFER_MINUTES,
        );
        if (newSessionEnd > nextSession.date) {
          throw new BadRequestException(
            await this.getSessionOverlapError(
              dto.hallID,
              sessionStartUTC,
              nextSession.date,
            ),
          );
        }
      }
    }

    const sessionsToCreate = dtos.map((dto) => ({
      movie_id: dto.movieID,
      date: fromZonedTime(new Date(dto.date), 'Europe/Kyiv'),
      price: Number(dto.price),
      price_VIP: Number(dto.priceVIP),
      hall_id: dto.hallID,
      session_type_id: dto.sessionTypeID,
    }));

    await prismaClient.session.createMany({
      data: sessionsToCreate,
    });

    const movieId = dtos[0].movieID;

    const movie = await prismaClient.movie.findUnique({
      where: { id: movieId },
      select: { created_at: true, expires_at: true },
    });

    if (!movie) {
      throw new NotFoundException('Фільм не знайдено');
    }

    const sessionDates = sessionsToCreate.map((s) => s.date);
    const minDate = new Date(Math.min(...sessionDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...sessionDates.map((d) => d.getTime())));

    const updateData: Prisma.MovieUpdateInput = {};

    if (!movie.created_at || minDate < movie.created_at) {
      updateData.created_at = minDate;
    }

    if (!movie.expires_at || maxDate > movie.expires_at) {
      updateData.expires_at = maxDate;
    }

    if (Object.keys(updateData).length > 0) {
      await prismaClient.movie.update({
        where: { id: movieId },
        data: updateData,
      });
    }
  }

  async getAvSessnsByMovieId(
    id: string,
    startDate?: string,
    endDate?: string,
  ): Promise<GetAvSesnsByMovIDRespDTO[]> {
    const nowUtc = new Date();

    const parsedStartDate = startDate
      ? fromZonedTime(
          new Date(
            !startDate.includes('T') && !startDate.includes(':')
              ? `${startDate}T${'00:00:00'}`
              : startDate,
          ),
          TIME_ZONE,
        )
      : undefined;

    const parsedEndDate = endDate
      ? fromZonedTime(
          new Date(
            !endDate.includes('T') && !endDate.includes(':')
              ? `${endDate}T${'23:59:59'}`
              : endDate,
          ),
          TIME_ZONE,
        )
      : undefined;

    const dateFilter: { gte?: Date; lte?: Date } = {};

    if (parsedStartDate) {
      dateFilter.gte = parsedStartDate;
    } else {
      dateFilter.gte = nowUtc;
    }

    if (parsedEndDate) {
      dateFilter.lte = parsedEndDate;
    }

    const sessions = await prismaClient.session.findMany({
      where: {
        movie_id: Number(id),
        date: dateFilter,
      },
      orderBy: {
        date: 'asc',
      },
      select: {
        id: true,
        date: true,
      },
    });

    return sessions.map((session) => {
      const TZDate = formatInTimeZone(session.date, TIME_ZONE, TIME_FORMAT);
      return new GetAvSesnsByMovIDRespDTO({
        id: session.id,
        date: TZDate,
      });
    });
  }

  async existsById(session_id: number): Promise<boolean> {
    const session = await prismaClient.session.findUnique({
      where: { id: session_id },
    });
    return !!session;
  }

  async getSessionInfoById(
    session_id: number,
  ): Promise<GetSessionByIdResponseDTO | null> {
    const exists = await this.existsById(session_id);
    if (!exists) {
      throw new NotFoundException(`Сеанс із id ${session_id} не знайдено!`);
    }
    const session = await prismaClient.session.findUnique({
      where: { id: session_id },
      include: {
        hall: true,
        bookings: true,
      },
    });
    if (!session) return null;

    const seats = session.bookings.map((b) => ({
      is_VIP: b.is_VIP,
      is_booked: true,
      row: b.row_x,
      col: b.col_y,
    }));

    const date_time = formatInTimeZone(session.date, TIME_ZONE, TIME_FORMAT);

    const dto = new GetSessionByIdResponseDTO();
    dto.hall_name = session.hall.name;
    dto.date_time = date_time;
    dto.price = session.price;
    dto.price_VIP = session.price_VIP;
    dto.session_type_id = session.session_type_id;
    dto.seats = seats;
    return dto;
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60_000);
  }

  private async getSessionOverlapError(
    hallID: number,
    currentSessionDateUTC: Date,
    overlappingSessionDateUTC: Date,
  ) {
    const hall = await prismaClient.hall.findUnique({
      where: { id: hallID },
      select: { name: true },
    });

    const currentSessionDate = formatInTimeZone(
      currentSessionDateUTC,
      TIME_ZONE,
      TIME_FORMAT,
    );
    const overlappingSessionDate = formatInTimeZone(
      overlappingSessionDateUTC,
      TIME_ZONE,
      TIME_FORMAT,
    );

    return `Сеанс о ${currentSessionDate} у залі ${hall?.name ?? ' '} конфліктує з сеансом о ${overlappingSessionDate}`;
  }
}
