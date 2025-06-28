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
import { UpdateSessionRequestDTO } from './dto/update-session-by-id.dto';
import { HallsService } from '../halls/halls.service';

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
      },
    });
    if (!session) return null;

    const seats = session.bookings.map((b) => ({
      is_VIP: b.is_VIP,
      is_booked: true,
      row: b.row_x,
      col: b.col_y,
    }));

    const tZ = 'Europe/Kyiv';
    const date_time = formatInTimeZone(session.date, tZ, 'yyyy-MM-dd HH:mm:ss');

    const dto = new GetSessionByIdResponseDTO();
    dto.hall_name = session.hall.name;
    dto.date_time = date_time;
    dto.price = session.price;
    dto.price_VIP = session.price_VIP;
    dto.session_type_id = session.session_type_id;
    dto.seats = seats;
    return dto;
  }

  async updateSession(
    session_id: number,
    dto: UpdateSessionRequestDTO,
  ): Promise<void> {
    const exists = await this.existsById(session_id);

    if (!exists) {
      throw new NotFoundException(`Сеанс із id ${session_id} не знайдено!`);
    }

    const tZ = 'Europe/Kyiv';
    const updateData: Prisma.SessionUpdateInput = {};

    if (dto.date !== undefined) {
      this.validaDate(dto.date);
      updateData.date = fromZonedTime(new Date(dto.date), tZ);
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

  private validaDate(date: string) {
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
}
