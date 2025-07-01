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
} from '@nestjs/common';
import { TopFilmsRespDTO } from './dto/get-stats-by-tickets.dto';
import { StatsService } from './stats.service';
import {
  ApiTags,
  ApiQuery,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from 'generated/prisma';
import { AccessTokenGuard } from 'src/guards/AccessTokenGuard';

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
    schema: {
      example: {
        films: [
          { film_name: 'The Matrix', sold_tickets: 120 },
          { film_name: 'Inception', sold_tickets: 95 },
        ],
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
              message: 'Виникла неочікувана помилка.',
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
      throw new InternalServerErrorException('Виникла неочікувана помилка.');
    }
  }
}
