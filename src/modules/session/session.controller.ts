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
  Put,
  UsePipes,
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
import { UpdateSessionRequestDTO } from './dto/update-session-by-id.dto';
import { CommonService } from '../common/common.service';
import { ValidationPipe } from '@nestjs/common';

@ApiTags('session')
@Controller('session')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly commonService: CommonService,
  ) {}

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
    description:
      'Get all relevant sessions (by time) by movie id and not deleted (is_deleted = false)',
  })
  @ApiOkResponse({
    description: 'Array of sessions for the movie',
    schema: {
      example: [
        { id: 1, date: '2025-07-01 18:00:00', session_type_id: 3 },
        { id: 2, date: '2025-07-01 21:00:00', session_type_id: 1 },
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
    if (!this.commonService.isValidId(id)) {
      throw new BadRequestException('Некоректний id фільму!');
    }
    const movieId = Number(id);
    return this.sessionService.getAvSessnsByMovieId(
      movieId.toString(),
      startDate,
      endDate,
    );
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
    if (!this.commonService.isValidId(session_id)) {
      throw new BadRequestException('Некоректний id сеансу!');
    }
    const sessionInfo = await this.sessionService.getSessionInfoById(
      Number(session_id),
    );
    if (!sessionInfo) {
      throw new NotFoundException(`Сеанс із id ${session_id} не знайдено!`);
    }
    return sessionInfo;
  }

  @UseGuards(AccessTokenGuard)
  @Put(':session_id')
  @ApiOperation({
    summary: 'Update an existing session',
    description:
      'Updates session information. Only administrators can update sessions. All fields are optional - only provided fields will be updated.',
  })
  @ApiParam({
    name: 'session_id',
    type: Number,
    required: true,
    description: 'Session ID to update',
    example: 123,
  })
  @ApiBody({
    type: UpdateSessionRequestDTO,
    description: 'Session update data - all fields are optional',
    examples: {
      validFull: {
        summary: 'All fields present',
        value: {
          date: '2025-07-01T18:00:00',
          price: 120.0,
          price_VIP: 200.0,
          hall_id: 2,
          session_type_id: 1,
          is_deleted: false,
        },
      },
      validNoIsDeleted: {
        summary: 'Without is_deleted field',
        value: {
          date: '2025-08-15T21:30:00',
          price: 150.5,
          price_VIP: 250.0,
          hall_id: 3,
          session_type_id: 2,
        },
      },
      validDateWithSpace: {
        summary: 'Date with space separator',
        value: {
          date: '2025-09-10 14:00:00',
          price: 100,
          price_VIP: 180,
          hall_id: 1,
          session_type_id: 1,
          is_deleted: true,
        },
      },
      validStringNumbers: {
        summary: 'String numbers (will be converted)',
        value: {
          price: '120.5',
          price_VIP: '200',
          hall_id: '2',
          session_type_id: '1',
        },
      },
      validMinimal: {
        summary: 'Minimal update - only one field',
        value: {
          price: 150.0,
        },
      },
      invalidEmpty: {
        summary: 'Empty object (will be rejected)',
        value: {},
      },
    },
  })
  @ApiOkResponse({
    description: 'Session updated successfully',
    schema: {
      example: {
        status: 200,
        message: 'Інфо про сеанс оновлено успішно!',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
    content: {
      'application/json': {
        examples: {
          emptyDto: {
            summary: 'Empty DTO provided',
            value: {
              statusCode: 400,
              message: 'Відсутні поля для оновлення!',
              error: 'Bad Request',
            },
          },
          invalidDate: {
            summary: 'Invalid date format',
            value: {
              statusCode: 400,
              message:
                'Дата має бути у форматі "YYYY-MM-DDTHH:mm:ss" або "YYYY-MM-DD HH:mm:ss!"',
              error: 'Bad Request',
            },
          },
          invalidPrice: {
            summary: 'Invalid price value',
            value: {
              statusCode: 400,
              message: 'Price must be a valid number',
              error: 'Bad Request',
            },
          },
          invalidPriceRange: {
            summary: 'Price below minimum',
            value: {
              statusCode: 400,
              message: 'price must not be less than 0.01',
              error: 'Bad Request',
            },
          },
          invalidVipPrice: {
            summary: 'Invalid VIP price value',
            value: {
              statusCode: 400,
              message: 'VIP price must be a valid number',
              error: 'Bad Request',
            },
          },
          invalidVipPriceRange: {
            summary: 'VIP price below minimum',
            value: {
              statusCode: 400,
              message: 'price_VIP must not be less than 0.01',
              error: 'Bad Request',
            },
          },
          invalidHallId: {
            summary: 'Invalid hall ID type',
            value: {
              statusCode: 400,
              message: 'Hall ID must be a valid integer',
              error: 'Bad Request',
            },
          },
          invalidHallNotFound: {
            summary: 'Hall not found',
            value: {
              statusCode: 400,
              message: 'Зал із id 999 не знайдено!',
              error: 'Bad Request',
            },
          },
          invalidSessionTypeId: {
            summary: 'Invalid session type ID type',
            value: {
              statusCode: 400,
              message: 'Session type ID must be a valid integer',
              error: 'Bad Request',
            },
          },
          invalidSessionTypeNotFound: {
            summary: 'Session type not found',
            value: {
              statusCode: 400,
              message: 'Тип сеансу із id 999 не знайдено!',
              error: 'Bad Request',
            },
          },
          invalidBoolean: {
            summary: 'Invalid boolean value',
            value: {
              statusCode: 400,
              message: 'is_deleted must be a boolean value',
              error: 'Bad Request',
            },
          },
          invalidSessionId: {
            summary: 'Invalid session ID parameter',
            value: {
              statusCode: 400,
              message: 'Некоректний id сеансу!',
              error: 'Bad Request',
            },
          },
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Access denied - admin privileges required',
    content: {
      'application/json': {
        example: {
          statusCode: 403,
          message: 'Доступ заборонено. Тільки для адміністраторів.',
          error: 'Forbidden',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Session not found in database',
    content: {
      'application/json': {
        example: {
          statusCode: 404,
          message: 'Сеанс із id 123 не знайдено!',
          error: 'Not Found',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error',
    content: {
      'application/json': {
        example: {
          statusCode: 500,
          message: 'Виникла неочікувана помилка.',
          error: 'Internal Server Error',
        },
      },
    },
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateSession(
    @Param('session_id') session_id: string,
    @Body() dto: UpdateSessionRequestDTO,
    @Request() req: { user: User },
  ) {
    try {
      if (!this.commonService.isValidId(session_id)) {
        throw new BadRequestException('Некоректний id сеансу!');
      }
      const sessionId = Number(session_id);

      if (!req.user.is_admin) {
        throw new ForbiddenException(
          'Доступ заборонено. Тільки для адміністраторів.',
        );
      }

      if (!(await this.sessionService.existsById(sessionId))) {
        throw new NotFoundException(`Сеанс із id ${session_id} не знайдено!`);
      }

      if (this.commonService.isDtoEmpty(dto)) {
        throw new BadRequestException('Відсутні поля для оновлення!');
      }

      await this.sessionService.updateSession(sessionId, dto);
      return { status: 200, message: 'Інфо про сеанс оновлено успішно!' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Виникла неочікувана помилка.');
    }
  }
}
