import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Param,
  Optional,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { GetSessionTypesResponseDTO } from './dto/get-session-types.dto';
import { SessionService } from './session.service';
import { AccessTokenGuard } from 'src/guards/AccessTokenGuard';
import { AddSessionRequestDTO } from './dto/add-session.dto';
import { User } from 'generated/prisma';
import { GetSessionByIdResponseDTO } from './dto/get-session-by-id.dto';

@ApiTags('session')
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('types')
  @ApiOperation({
    description: 'Returns all session types (e.g. 2D, 3D, IMAX)',
  })
  @ApiOkResponse({
    description: 'If success returns a session type list.',
    type: GetSessionTypesResponseDTO,
    isArray: true,
  })
  async getSessionTypes() {
    return this.sessionService.getSessionTypes();
  }

  @UseGuards(AccessTokenGuard)
  @Post()
  @ApiOperation({ summary: 'Add sessions to a movie' })
  @ApiBody({
    type: AddSessionRequestDTO,
    isArray: true,
    description: 'Array of sessions to add',
    examples: {
      example1: {
        summary: 'Valid session list',
        value: [
          {
            movieID: 1,
            date: '2025-06-23T15:00:00.000Z',
            price: 100,
            priceVIP: 150,
            hallID: 2,
            sessionTypeID: 1,
          },
        ],
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Sessions were successfully added',
    schema: {
      example: 'Успішно додано 1 сесій',
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or session conflicts found',
    schema: {
      example: {
        statusCode: 400,
        message: 'Some error message',
        error: 'Bad Request',
      },
    },
    examples: {
      duplicateDates: {
        summary: 'Duplicate session dates in request',
        value: {
          statusCode: 400,
          message: 'Усі сеанси повинні мати унікальні дати.',
          error: 'Bad Request',
        },
      },
      movieNotFound: {
        summary: 'Movie not found',
        value: {
          statusCode: 400,
          message: 'Фільм з ID 42 не знайдено',
          error: 'Bad Request',
        },
      },
      sessionConflict: {
        summary: 'Session time conflict',
        value: {
          statusCode: 400,
          message:
            'Сеанс о 2025-06-28 16:00:00 у залі Зал 2 конфліктує з сеансом о 2025-06-28 15:30:00',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Access denied. Only admins can add sessions.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error',
  })
  async addSession(
    @Body() addSessionDTOs: AddSessionRequestDTO[],
    @Request() req: { user: User },
  ) {
    if (!req.user.is_admin) {
      throw new ForbiddenException(
        `Доступ заборонено. Тільки для адміністраторів`,
      );
    }

    try {
      await this.sessionService.addSessions(addSessionDTOs);
      return `Успішно додано ${addSessionDTOs.length} сесій`;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Виникла неочікувана помилка.');
    }
  }

  @Get('by-movie/:movie_id')
  @ApiOperation({
    description: 'Get all relevant sessions (by time) by movie id',
  })
  @ApiOkResponse({
    description: 'Array of sessions for the movie',
    schema: {
      example: [
        { id: 1, date: '2025-07-01 18:00:00' },
        { id: 2, date: '2025-07-01 21:00:00' },
      ],
    },
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description:
      'Optional start date/time for filtering sessions (e.g., "2025-06-24T10:00:00" or "2025-06-24 10:00:00"). Assumed to be in Europe/Kyiv local time if no timezone offset is provided.',
    example: '2025-06-24T10:00:00',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description:
      'Optional end date/time for filtering sessions (e.g., "2025-06-25T23:59:59" or "2025-06-25 23:59:59"). Assumed to be in Europe/Kyiv local time if no timezone offset is provided.',
    example: '2025-06-25T23:59:59',
  })
  async getSessionsByMovieId(
    @Param('movie_id') id: string,
    @Optional() @Query('start_date') startDate?: string,
    @Optional() @Query('end_date') endDate?: string,
  ) {
    return this.sessionService.getAvSessnsByMovieId(id, startDate, endDate);
  }

  @Get(':session_id')
  @ApiOperation({ summary: 'Get session bookings by session id' })
  @ApiParam({
    name: 'session_id',
    type: Number,
    required: true,
    description: 'Session ID',
  })
  @ApiOkResponse({
    description: 'Session info',
    type: GetSessionByIdResponseDTO,
    schema: {
      example: {
        hall_name: 'Red Hall',
        date_time: '2025-07-01 18:00:00',
        price: 120.0,
        price_VIP: 200.0,
        session_type_id: 2,
        seats: [
          { is_VIP: false, is_booked: false, row: 1, col: 1 },
          { is_VIP: true, is_booked: true, row: 1, col: 2 },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Session not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Сеанс із id 123 не знайдено!',
        error: 'Not Found',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid session id',
    schema: {
      example: {
        statusCode: 400,
        message: 'Некоректний id сеансу!',
        error: 'Bad Request',
      },
    },
  })
  async getSessionById(@Param('session_id') session_id: string) {
    const id = Number(session_id);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('Некоректний id сеансу!');
    }
    const sessionInfo = await this.sessionService.getSessionInfoById(id);
    if (!sessionInfo) {
      throw new NotFoundException(`Сеанс із id ${id} не знайдено!`);
    }
    return sessionInfo;
  }
}
