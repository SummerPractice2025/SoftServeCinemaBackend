import { Injectable } from '@nestjs/common';
import {
  FilmStatsFieldsDTO,
  TopFilmsRespDTO,
} from './dto/get-stats-by-tickets.dto';
import { Prisma } from 'generated/prisma';
import { prismaClient } from 'src/db/prismaClient';
import {
  TopFilmsTemplate,
  TopFilmsRevenueResp,
} from './dto/get-stats-top-money.dto';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

const MS_PER_DAY =
  MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;

@Injectable()
export class StatsService {
  async getTopFilmsByTickets(
    days?: number,
    count?: number,
  ): Promise<TopFilmsRespDTO> {
    const DEFAULT_DAYS = 7;
    const DEFAULT_COUNT = 3;

    const daysToUse = days ?? DEFAULT_DAYS;
    const countToUse = count ?? DEFAULT_COUNT;

    const now = new Date();
    const dateThreshold = new Date(Date.now() - (daysToUse - 1) * MS_PER_DAY);
    dateThreshold.setHours(0, 0, 0, 0);

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

  async getSumMoneyPerDay(days?: number): Promise<{ money: number }> {
    const DEFAULT_DAYS = 1;
    const daysToUse = days ?? DEFAULT_DAYS;

    const now = new Date();

    const dateThreshold = new Date();
    dateThreshold.setDate(now.getDate() - (daysToUse - 1));
    dateThreshold.setHours(0, 0, 0, 0);

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

  private async getStatsTopMoneyDays(
    days: number,
    count: number,
  ): Promise<TopFilmsTemplate[]> {
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - (days - 1));
    fromDate.setHours(0, 0, 0, 0);

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
      LIMIT ${count};
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

  async getTopFilmsRevenueResp(count?: number): Promise<TopFilmsRevenueResp> {
    const DEFAULT_TOP_COUNT = 3;

    const DAY = 1;
    const WEEK = 7;
    const MONTH = 30;

    const limit = count ?? DEFAULT_TOP_COUNT;

    const dto = new TopFilmsRevenueResp();
    dto.day = await this.getStatsTopMoneyDays(DAY, limit);
    dto.week = await this.getStatsTopMoneyDays(WEEK, limit);
    dto.month = await this.getStatsTopMoneyDays(MONTH, limit);

    return dto;
  }
}
