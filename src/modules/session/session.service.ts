import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GetSessionTypesResponseDTO } from './dto/get-session-types.dto';
import { prismaClient } from 'src/db/prismaClient';
import { PrismaClient, Prisma } from 'generated/prisma';
import { AddSessionRequestDTO } from './dto/add-session.dto';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { GetAvSesnsByMovIDRespDTO } from './dto/get-sessions-by-movie-id.dto';
import { GetSessionByIdResponseDTO } from './dto/get-session-by-id.dto';
import { UpdateSessionRequestDTO } from './dto/update-session-by-id.dto';
import { HallsService } from '../halls/halls.service';

const BREAK_BUFFER_MINUTES = 15;
const TIME_ZONE = 'Europe/Kyiv';
const TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

type CustomPrismaClient = PrismaClient | Prisma.TransactionClient;

@Injectable()
export class SessionService {
  constructor(private readonly hallsService: HallsService) {}

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

    await this.validateSessionsNoOverlap(dtos);

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
        is_deleted: false,
      },
      orderBy: {
        date: 'asc',
      },
      select: {
        id: true,
        date: true,
        session_type_id: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    return sessions.map((session) => {
      const TZDate = formatInTimeZone(session.date, TIME_ZONE, TIME_FORMAT);
      return new GetAvSesnsByMovIDRespDTO({
        id: session.id,
        date: TZDate,
        session_type_id: session.session_type_id,
        bookings_count: session._count.bookings,
      });
    });
  }

  async existsById(session_id: number): Promise<boolean> {
    const session = await prismaClient.session.findUnique({
      where: { id: session_id },
    });

    if (!session) return false;
    return true;
  }

  async existsSessionTypeById(session_type_id: number): Promise<boolean> {
    const sessionType = await prismaClient.sessionType.findUnique({
      where: { id: session_type_id },
    });

    if (!sessionType) return false;
    return true;
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
        _count: {
          select: {
            bookings: true,
          },
        },
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
    dto.is_deleted = session.is_deleted;
    dto.bookings_count = session._count.bookings;
    dto.seats = seats;
    return dto;
  }

  async getSessionByID(sessionID: number) {
    const session = await prismaClient.session.findUnique({
      where: { id: sessionID },
    });

    if (!session) {
      throw new NotFoundException(`Сеанс із ID ${sessionID} не знайдено.`);
    }

    return session;
  }

  async validateSessionsNoOverlap(
    dtos: AddSessionRequestDTO[],
    prisma: CustomPrismaClient = prismaClient,
  ) {
    if (dtos.length === 0) return;

    const uniqueDates = new Set(
      dtos.map((dto) => new Date(dto.date).toISOString()),
    );
    if (uniqueDates.size !== dtos.length) {
      throw new BadRequestException('Усі сеанси повинні мати унікальні дати.');
    }

    const movieDurations = new Map<number, number>();

    type SessionInfo = {
      hallID: number;
      start: Date;
      duration: number;
    };
    const sessionsByHall = new Map<number, SessionInfo[]>();

    for (const dto of dtos) {
      this.validateDate(dto.date);

      const sessionStartUTC = fromZonedTime(new Date(dto.date), 'Europe/Kyiv');

      let duration = movieDurations.get(dto.movieID);
      if (duration === undefined) {
        duration = await this.getMovieDuration(dto.movieID);
        movieDurations.set(dto.movieID, duration);
      }

      if (!sessionsByHall.has(dto.hallID)) {
        sessionsByHall.set(dto.hallID, []);
      }
      sessionsByHall.get(dto.hallID)!.push({
        hallID: dto.hallID,
        start: sessionStartUTC,
        duration,
      });

      await this.validateSessionTimeSlot(
        sessionStartUTC,
        dto.hallID,
        duration,
        prisma,
      );
    }

    for (const [hallID, sessions] of sessionsByHall.entries()) {
      sessions.sort((a, b) => a.start.getTime() - b.start.getTime());

      for (let i = 1; i < sessions.length; i++) {
        const prev = sessions[i - 1];
        const curr = sessions[i];

        const prevEnd = this.addMinutes(
          prev.start,
          prev.duration + BREAK_BUFFER_MINUTES,
        );
        if (curr.start < prevEnd) {
          throw new BadRequestException(
            await this.getSessionOverlapError(
              hallID,
              prev.start,
              curr.start,
              prisma,
            ),
          );
        }
      }
    }
  }

  async validateSessionTimeSlot(
    sessionStartUTC: Date,
    hallID: number,
    movieDuration: number,
    prisma: CustomPrismaClient = prismaClient,
    currentSessionID?: number,
  ) {
    const previousSession = await prisma.session.findFirst({
      where: {
        hall_id: hallID,
        is_deleted: false,
        ...(currentSessionID && { id: { not: currentSessionID } }),
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
            hallID,
            sessionStartUTC,
            previousSession.date,
            prisma,
          ),
        );
      }
    }

    const nextSession = await prisma.session.findFirst({
      where: {
        hall_id: hallID,
        is_deleted: false,
        ...(currentSessionID && { id: { not: currentSessionID } }),
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
        movieDuration + BREAK_BUFFER_MINUTES,
      );
      if (newSessionEnd > nextSession.date) {
        throw new BadRequestException(
          await this.getSessionOverlapError(
            hallID,
            sessionStartUTC,
            nextSession.date,
            prisma,
          ),
        );
      }
    }
  }

  async updateSession(
    session_id: number,
    dto: UpdateSessionRequestDTO,
  ): Promise<void> {
    const session = await this.getSessionByID(session_id);

    const tZ = 'Europe/Kyiv';
    const updateData: Prisma.SessionUpdateInput = {};

    if (dto.date !== undefined) {
      this.validateDate(dto.date);
      updateData.date = fromZonedTime(new Date(dto.date), tZ);

      await this.validateSessionTimeSlot(
        updateData.date,
        session.hall_id,
        await this.getMovieDuration(session.movie_id),
        prismaClient,
        session.id,
      );
    }
    if (dto.price !== undefined) {
      updateData.price = dto.price;
    }
    if (dto.price_VIP !== undefined) {
      updateData.price_VIP = dto.price_VIP;
    }
    if (dto.hall_id !== undefined) {
      const hallExists = await this.hallsService.existsById(dto.hall_id);
      if (!hallExists) {
        throw new BadRequestException(`Зал із id ${dto.hall_id} не знайдено!`);
      }
      updateData.hall = { connect: { id: dto.hall_id } };
    }
    if (dto.session_type_id !== undefined) {
      const sessionTypeExists = await this.existsSessionTypeById(
        dto.session_type_id,
      );
      if (!sessionTypeExists) {
        throw new BadRequestException(
          `Тип сеансу із id ${dto.session_type_id} не знайдено!`,
        );
      }
      updateData.sessionType = { connect: { id: dto.session_type_id } };
    }
    if (dto.is_deleted !== undefined) {
      updateData.is_deleted = dto.is_deleted;
    }

    await prismaClient.session.update({
      where: { id: session_id },
      data: updateData,
    });
  }

  public validateDate(date: string) {
    const isoFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    const spaceFormat = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

    if (!isoFormat.test(date) && !spaceFormat.test(date)) {
      throw new BadRequestException(
        'Дата має бути у форматі "YYYY-MM-DDTHH:mm:ss" або "YYYY-MM-DD HH:mm:ss!"',
      );
    }

    const parsed = new Date(date.replace(' ', 'T'));

    if (isNaN(parsed.getTime())) {
      throw new BadRequestException('Некотректний дата або час.');
    }
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60_000);
  }

  private async getSessionOverlapError(
    hallID: number,
    currentSessionDateUTC: Date,
    overlappingSessionDateUTC: Date,
    prisma: CustomPrismaClient = prismaClient,
  ) {
    const hall = await prisma.hall.findUnique({
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

  async deleteById(session_id: number): Promise<void> {
    await prismaClient.session.update({
      where: {
        id: session_id,
      },
      data: {
        is_deleted: true,
      },
    });
  }

  private async getMovieDuration(
    movieID: number,
    prisma: CustomPrismaClient = prismaClient,
  ) {
    const movie = await prisma.movie.findUnique({
      where: { id: movieID },
      select: { duration: true },
    });
    if (!movie) {
      throw new NotFoundException(`Фільм з ID ${movieID} не знайдено`);
    }

    return movie.duration;
  }
}
