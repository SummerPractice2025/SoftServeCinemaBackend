import { Injectable, NotFoundException } from '@nestjs/common';
import { GetSessionTypesResponseDTO } from './dto/get-session-types.dto';
import { prismaClient } from 'src/db/prismaClient';
import { AddSessionRequestDTO } from './dto/add-session.dto';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { Prisma } from 'generated/prisma';
import { GetAvSesnsByMovIDRespDTO } from './dto/get-sessions-by-movie-id.dto';

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
    const tZ = 'Europe/Kyiv';
    const nowUtc = new Date();

    const parsedStartDate = startDate
      ? fromZonedTime(
          new Date(
            !startDate.includes('T') && !startDate.includes(':')
              ? `${startDate}T${'00:00:00'}`
              : startDate,
          ),
          tZ,
        )
      : undefined;

    const parsedEndDate = endDate
      ? fromZonedTime(
          new Date(
            !endDate.includes('T') && !endDate.includes(':')
              ? `${endDate}T${'23:59:59'}`
              : endDate,
          ),
          tZ,
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
      const TZDate = formatInTimeZone(session.date, tZ, 'yyyy-MM-dd HH:mm:ss');
      return new GetAvSesnsByMovIDRespDTO({
        id: session.id,
        date: TZDate,
      });
    });
  }
}
