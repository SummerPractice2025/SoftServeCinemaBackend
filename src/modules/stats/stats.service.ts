import { Injectable } from '@nestjs/common';
import {
  FilmStatsFieldsDTO,
  TopFilmsRespDTO,
} from './dto/get-stats-by-tickets.dto';
import { Prisma } from 'generated/prisma';
import { prismaClient } from 'src/db/prismaClient';
import {
  GetHallOccupancyRespDTO,
  HallOccupancyItemDTO,
} from './dto/get-halls-occupancy.dto';

@Injectable()
export class StatsService {
  calcDateThreshold(days: number, now: Date): Date {
    const dateThreshold = new Date();
    dateThreshold.setDate(now.getDate() - (days - 1));
    dateThreshold.setHours(0, 0, 0, 0);

    return dateThreshold;
  }

  async getTopFilmsByTickets(days = 7, count = 3): Promise<TopFilmsRespDTO> {
    const DEFAULT_DAYS = 7;
    const DEFAULT_COUNT = 3;

    const daysToUse = days ?? DEFAULT_DAYS;
    const countToUse = count ?? DEFAULT_COUNT;

    const now = new Date();
    const dateThreshold = this.calcDateThreshold(daysToUse, now);

    const rawResult = await prismaClient.$queryRaw<
      { film_name: string; sold_tickets: bigint }[]
    >(
      Prisma.sql`
        SELECT
          m.name         AS film_name,
          COUNT(b.id)    AS sold_tickets,
          m.created_at
        FROM "Movie" m
        LEFT JOIN "Session" s
          ON s.movie_id = m.id
          AND s.is_deleted = FALSE
          AND s.date BETWEEN ${dateThreshold} AND ${now}
        LEFT JOIN "Booking" b
          ON b.session_id = s.id
        WHERE
          s.id IS NOT NULL
          OR m.expires_at BETWEEN ${dateThreshold} AND ${now}
        GROUP BY m.id, m.name, m.created_at
        ORDER BY
          sold_tickets DESC,
          m.created_at DESC
        LIMIT ${countToUse};
      `,
    );

    const films = rawResult.map((r) => {
      const dto = new FilmStatsFieldsDTO();
      dto.film_name = r.film_name;
      dto.sold_tickets = Number(r.sold_tickets);
      return dto;
    });

    const responseDto = new TopFilmsRespDTO();
    responseDto.films = films;

    return responseDto;
  }

  async getSumMoneyPerDay(days = 1): Promise<{ money: number }> {
    const now = new Date();
    const dateThreshold = this.calcDateThreshold(days, now);

    const bookings = await prismaClient.booking.findMany({
      where: {
        session: {
          is_deleted: false,
          date: {
            gte: dateThreshold,
            lte: now,
          },
        },
      },
      include: {
        session: true,
      },
    });

    const totalMoney = bookings.reduce((sum, booking) => {
      const price = booking.is_VIP
        ? booking.session.price_VIP
        : booking.session.price;
      return sum + (price || 0);
    }, 0);

    return { money: Number(totalMoney.toFixed(2)) };
  }

  async getHallOccupancy(days = 7): Promise<GetHallOccupancyRespDTO> {
    const now = new Date();
    const dateThreshold = this.calcDateThreshold(days, now);

    console.log(dateThreshold);

    const result: HallOccupancyItemDTO[] = await prismaClient.$queryRaw(
      Prisma.sql`
        SELECT
          h.id AS hall_id,
          h.name AS hall_name,
          COALESCE(
            (
              COUNT(b.id)::float /
              NULLIF(
                (h.rows * h.cols * COUNT(DISTINCT s.id)),
                0
              )
            ) * 100,
          0) AS occupancy
        FROM
          "Hall" AS h
        LEFT JOIN
          "Session" AS s ON h.id = s.hall_id
          AND s.date BETWEEN ${dateThreshold} AND ${now}
          AND s.is_deleted = FALSE
        LEFT JOIN
          "Booking" AS b ON s.id = b.session_id
        GROUP BY
          h.id, h.name, h.rows, h.cols
        ORDER BY
          occupancy DESC;
      `,
    );

    const formattedResult = result.map((item) => {
      const dtoItem = new HallOccupancyItemDTO();
      dtoItem.hall_id = item.hall_id;
      dtoItem.hall_name = item.hall_name;
      dtoItem.occupancy = parseFloat(item.occupancy.toFixed(2));
      return dtoItem;
    });

    const finalResponse = new GetHallOccupancyRespDTO();
    finalResponse.halls = formattedResult;

    return finalResponse;
  }
}
