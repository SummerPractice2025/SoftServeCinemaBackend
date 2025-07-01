import { prismaClient } from 'src/db/prismaClient';
import { Injectable } from '@nestjs/common';
import {
  FilmStatsFieldsDTO,
  TopFilmsRespDTO,
} from './dto/get-stats-by-tickets.dto';
import { Prisma } from 'generated/prisma';

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

    const dateThreshold = new Date(Date.now() - daysToUse * MS_PER_DAY);
    const dateOnlyThreshold = dateThreshold.toISOString().split('T')[0];

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
          ON s.movie_id   = m.id
          AND s.is_deleted = FALSE
          AND s.date::date >= ${Prisma.sql`${dateOnlyThreshold}::date`}
        LEFT JOIN "Booking" b
          ON b.session_id = s.id
        WHERE
          s.id IS NOT NULL
          OR m.expires_at::date >= ${Prisma.sql`${dateOnlyThreshold}::date`}
        GROUP BY m.id, m.name, m.created_at
        ORDER BY
          sold_tickets DESC,
          m.created_at DESC
        LIMIT ${Prisma.sql`${countToUse}`};
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
}
