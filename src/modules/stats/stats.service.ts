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
import {
  TopFilmsTemplate,
  TopFilmsRevenueResp,
} from './dto/get-stats-top-money.dto';

@Injectable()
export class StatsService {
  calcDateThreshold(days: number, now: Date): Date {
    const dateThreshold = new Date();
    dateThreshold.setDate(now.getDate() - (days - 1));
    dateThreshold.setHours(0, 0, 0, 0);

    return dateThreshold;
  }

  async getTopFilmsByTickets(days = 7, topCount = 3): Promise<TopFilmsRespDTO> {
    const now = new Date();
    const dateThreshold = this.calcDateThreshold(days, now);

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
          m.expires_at >= ${dateThreshold}
          AND m.created_at <= ${now}
        GROUP BY m.id, m.name, m.created_at
        ORDER BY
          sold_tickets DESC,
          m.created_at DESC
        LIMIT ${topCount};
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

  private async getStatsTopMoneyDays(
    days: number,
    topCount: number,
  ): Promise<TopFilmsTemplate[]> {
    const now = new Date();
    const fromDate = this.calcDateThreshold(days, now);

    const query = Prisma.sql`
      SELECT 
        m.name AS film_name,
        COALESCE(SUM(
          CASE 
            WHEN b."is_VIP" THEN s."price_VIP"
            ELSE s.price
          END
        ), 0) AS money,
        m.created_at
      FROM "Movie" m
      LEFT JOIN "Session" s ON s.movie_id = m.id
        AND s.date BETWEEN ${fromDate} AND ${now}
        AND s.is_deleted = false
      LEFT JOIN "Booking" b ON b.session_id = s.id
      WHERE 
        m.expires_at >= ${fromDate}
        AND m.created_at <= ${now}
      GROUP BY m.name, m.created_at
      ORDER BY money DESC, m.created_at DESC
      LIMIT ${topCount};
    `;

    const rawResults: Array<{
      film_name: string;
      money: string;
      created_at: Date;
    }> = await prismaClient.$queryRaw(query);

    const topFilms: TopFilmsTemplate[] = rawResults.map(
      ({ film_name, money }) => ({
        film_name,
        money: Number(money),
      }),
    );

    return topFilms;
  }

  async getTopFilmsRevenueResp(topCount = 3): Promise<TopFilmsRevenueResp> {
    const DAY = 1;
    const WEEK = 7;
    const MONTH = 30;

    const dto = new TopFilmsRevenueResp();
    dto.day = await this.getStatsTopMoneyDays(DAY, topCount);
    dto.week = await this.getStatsTopMoneyDays(WEEK, topCount);
    dto.month = await this.getStatsTopMoneyDays(MONTH, topCount);

    return dto;
  }
}
