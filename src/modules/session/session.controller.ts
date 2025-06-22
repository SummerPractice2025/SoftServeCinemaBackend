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
}
