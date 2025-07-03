import {
  BadRequestException,
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UnauthorizedException,
  Request,
  ForbiddenException,
  InternalServerErrorException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StatsService } from './stats.service';
import {
  ApiTags,
  ApiQuery,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { User } from 'generated/prisma';
import { AccessTokenGuard } from 'src/guards/AccessTokenGuard';
import { GetHallOccupancyRespDTO } from './dto/get-halls-occupancy.dto';
import { TopFilmsRevenueResp } from './dto/get-stats-top-money.dto';
import { TopFilmsRespDTO } from './dto/get-stats-by-tickets.dto';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @UseGuards(AccessTokenGuard)
  @Get('top/tickets')
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to look back for ticket sales',
    type: Number,
    example: 7,
  })
  @ApiQuery({
    name: 'count',
    required: false,
    description: 'Number of top films to return',
    type: Number,
    example: 3,
  })
  @ApiOkResponse({
    description: 'Top films by tickets successfully retrieved',
    type: TopFilmsRespDTO,
    examples: {
      'application/json': {
        summary: 'Successful response example',
        value: {
          films: [
            { film_name: 'The Matrix', sold_tickets: 120 },
            { film_name: 'Inception', sold_tickets: 95 },
          ],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
    content: {
      'application/json': {
        examples: {
          invalidDays: {
            summary: 'Invalid days query param (less than 1)',
            value: {
              statusCode: 400,
              message: 'Query params error!',
              error: 'Bad Request',
            },
          },
          invalidCount: {
            summary: 'Invalid count query param (less than 1)',
            value: {
              statusCode: 400,
              message: 'Query params error!',
              error: 'Bad Request',
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized — missing or invalid access token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden — user lacks admin rights',
    schema: {
      example: {
        statusCode: 403,
        message: 'Доступ заборонено. Тільки для адміністраторів',
        error: 'Forbidden',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    content: {
      'application/json': {
        examples: {
          unexpectedError: {
            summary: 'Unexpected internal error',
            value: {
              statusCode: 500,
              message: 'Сталася неочікувана помилка.',
              error: 'Internal Server Error',
            },
          },
        },
      },
    },
  })
  async getTopTickets(
    @Request() req: { user: User },
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
    @Query('count', new ParseIntPipe({ optional: true })) count?: number,
  ): Promise<TopFilmsRespDTO> {
    try {
      if (!req.user.is_admin) {
        throw new ForbiddenException(
          `Доступ заборонено. Тільки для адміністраторів`,
        );
      }

      if (
        (days !== undefined && days < 1) ||
        (count !== undefined && count < 1)
      ) {
        throw new BadRequestException('Query params error!');
      }

      return await this.statsService.getTopFilmsByTickets(days, count);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Сталася неочікувана помилка.');
    }
  }

  @UseGuards(AccessTokenGuard)
  @Get('money')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to calculate earnings for (defaults to 1)',
    type: Number,
    example: 1,
  })
  @ApiOperation({
    summary: 'Get total earnings over a period',
    description:
      'Returns the total money earned from bookings in the last N days. Only for administrators.',
  })
  @ApiResponse({
    status: 200,
    description: 'Total earnings retrieved successfully',
    schema: {
      example: {
        money: 1234.56,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized — missing or invalid auth token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden — user lacks admin rights',
    schema: {
      example: {
        statusCode: 403,
        message: 'Доступ заборонено. Тільки для адміністраторів',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query params',
    schema: {
      example: {
        statusCode: 400,
        message: 'Query param error!',
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Сталася неочікувана помилка.',
        error: 'Internal Server Error',
      },
    },
  })
  async getStatsMoney(
    @Request() req: { user: User },
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ): Promise<{ money: number }> {
    try {
      if (!req.user.is_admin) {
        throw new ForbiddenException(
          'Доступ заборонено. Тільки для адміністраторів',
        );
      }

      if (days !== undefined && days < 1) {
        throw new BadRequestException('Query param error!');
      }

      return await this.statsService.getSumMoneyPerDay(days);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Сталася неочікувана помилка.');
    }
  }

  @UseGuards(AccessTokenGuard)
  @Get('/top/money')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'count',
    required: false,
    description:
      'Number of top films to return for each period (defaults to 3)',
    type: Number,
    example: 3,
  })
  @ApiOperation({
    summary: 'Get top-grossing films by revenue',
    description: `Returns top films by earnings over the past day, week, and month. Requires admin rights.\n
      Films without sessions are included if their expires_at >= query date.\n
      Such films have 0 earnings and are sorted by created_at <= query date.\n
      Future releases are excluded.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Top-grossing films retrieved successfully',
    schema: {
      example: {
        day: [
          { film_name: 'Movie A', money: 300.5 },
          { film_name: 'Movie B', money: 220.0 },
        ],
        week: [
          { film_name: 'Movie A', money: 800.0 },
          { film_name: 'Movie C', money: 650.0 },
        ],
        month: [
          { film_name: 'Movie D', money: 1500.75 },
          { film_name: 'Movie A', money: 1300.25 },
          { film_name: 'Movie E', money: 900.0 },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized — missing or invalid auth token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden — user lacks admin rights',
    schema: {
      example: {
        statusCode: 403,
        message: 'Доступ заборонено. Тільки для адміністраторів',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameter',
    schema: {
      example: {
        statusCode: 400,
        message: 'Query param error!',
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Сталася неочікувана помилка.',
        error: 'Internal Server Error',
      },
    },
  })
  async getStatsTopMoney(
    @Request() req: { user: User },
    @Query('count', new ParseIntPipe({ optional: true })) count?: number,
  ): Promise<TopFilmsRevenueResp> {
    try {
      if (!req.user.is_admin) {
        throw new ForbiddenException(
          'Доступ заборонено. Тільки для адміністраторів',
        );
      }

      if (count !== undefined && count < 1) {
        throw new BadRequestException('Query param error!');
      }

      return this.statsService.getTopFilmsRevenueResp(count);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Сталася неочікувана помилка.');
    }
  }

  @UseGuards(AccessTokenGuard)
  @Get('occupancy')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'days',
    required: false,
    description:
      'Number of days to look back for hall occupancy (default: 7 days, meaning today - 6 days).',
    type: Number,
    example: 7,
  })
  @ApiOperation({
    summary: 'Get cinema hall occupancy rates',
    description:
      'Returns the occupancy rate (percentage of seats sold) for each cinema hall over the last N days sorted DESC. Defaults to a week (today - 6 days). Only for administrators.',
  })
  @ApiOkResponse({
    description: 'Hall occupancy rates retrieved successfully',
    type: GetHallOccupancyRespDTO,
    isArray: true,
    examples: {
      'application/json': {
        summary: 'Successful response example',
        value: {
          halls: [
            { hall_id: 1, hall_name: 'hall 1', occupancy: 15 },
            { hall_id: 2, hall_name: 'hall 2', occupancy: 1.5 },
            { hall_id: 10, hall_name: 'hall 4', occupancy: 0 },
          ],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
    schema: {
      example: {
        statusCode: 400,
        message: 'Query param error!',
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - missing or invalid access token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - user lacks admin rights',
    schema: {
      example: {
        statusCode: 403,
        message: 'Доступ заборонено. Тільки для адміністраторів',
        error: 'Forbidden',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Сталася неочікувана помилка.',
        error: 'Internal Server Error',
      },
    },
  })
  async getHallOccupancy(
    @Request() req: { user: User },
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ): Promise<GetHallOccupancyRespDTO> {
    try {
      if (!req.user || !req.user.is_admin) {
        throw new ForbiddenException(
          'Доступ заборонено. Тільки для адміністраторів',
        );
      }

      if (days !== undefined && days < 1) {
        throw new BadRequestException('Query param error!');
      }
      return await this.statsService.getHallOccupancy(days);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Сталася неочікувана помилка.');
    }
  }
}
