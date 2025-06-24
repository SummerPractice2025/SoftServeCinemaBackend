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
} from '@nestjs/swagger';
import { GetSessionTypesResponseDTO } from './dto/get-session-types.dto';
import { SessionService } from './session.service';
import { AccessTokenGuard } from 'src/guards/AccessTokenGuard';
import { AddSessionRequestDTO } from './dto/add-session.dto';
import { User } from 'generated/prisma';

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
    description: 'The request contains errors or invalid data',
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

  @Get(':movie_id')
  @ApiOperation({
    description: 'Get all relevant sessions (by time) by movie id',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description:
      'Optional start date/time for filtering sessions (e.g., "2025-06-24T10:00:00" or "2025-06-24 10:00:00"). Assumed to be in Europe/Kyiv local time if no timezone offset is provided.',
    example: '2025-06-24T10:00:00',
  })
  @ApiQuery({
    name: 'endDate',
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
}
