import {
  Controller,
  Put,
  Body,
  Request,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { UpdateSessionsRequestDTO } from './dto/update-sessions.dto';
import { SessionService } from './session.service';
import { AccessTokenGuard } from 'src/guards/AccessTokenGuard';
import { RolesGuard } from 'src/guards/RolesGuard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/common/enums';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionService: SessionService) {}

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.Admin)
  @Put()
  @ApiOperation({
    summary: 'Update an existing session',
    description:
      "Updates session information. Only administrators can update sessions. All fields are optional except 'session_id' - only provided fields will be updated.",
  })
  @ApiBody({
    type: UpdateSessionsRequestDTO,
    isArray: true,
    description:
      "Sessions update data - all fields are optional except 'session_id'.",
    examples: {
      validFull: {
        summary: 'All fields present',
        value: [
          {
            session_id: 123,
            date: '2025-07-01T18:00:00',
            price: 120.0,
            price_VIP: 200.0,
            hall_id: 2,
            session_type_id: 1,
            is_deleted: false,
          },
          {
            session_id: 156,
            date: '2025-07-05T18:00:00',
            price: 120.0,
            price_VIP: 200.0,
            hall_id: 2,
            session_type_id: 1,
            is_deleted: false,
          },
        ],
      },
      validNoIsDeleted: {
        summary: 'Without is_deleted field',
        value: [
          {
            session_id: 432,
            date: '2025-08-15T21:30:00',
            price: 150.5,
            price_VIP: 250.0,
            hall_id: 3,
            session_type_id: 2,
          },
          {
            session_id: 435,
            date: '2025-08-16T21:30:00',
            price: 150.5,
            price_VIP: 250.0,
            hall_id: 5,
            session_type_id: 2,
          },
        ],
      },
      validDateWithSpace: {
        summary: 'Date with space separator',
        value: [
          {
            session_id: 535,
            date: '2025-09-10 14:00:00',
            price: 100,
            price_VIP: 180,
            hall_id: 1,
            session_type_id: 1,
            is_deleted: true,
          },
          {
            session_id: 536,
            date: '2025-09-11 14:00:00',
            price: 100,
            price_VIP: 180,
            hall_id: 1,
            session_type_id: 1,
            is_deleted: true,
          },
        ],
      },
      validStringNumbers: {
        summary: 'String numbers (will be converted)',
        value: [
          {
            session_id: 1323,
            price: '120.5',
            price_VIP: '200',
            hall_id: '2',
            session_type_id: '1',
          },
          {
            session_id: 1566,
            price: '135.5',
            price_VIP: '250',
            hall_id: '2',
            session_type_id: '1',
          },
        ],
      },
      validMinimal: {
        summary: 'Minimal update - only one field',
        value: [
          {
            session_id: 13213,
            price: 150.0,
          },
          {
            session_id: 13553,
            price_VIP: 550.0,
          },
        ],
      },
      invalidEmpty: {
        summary: 'One of the objects is empty (will be rejected)',
        value: [
          {
            session_id: 13553,
            price_VIP: 550.0,
          },
          {},
        ],
      },
    },
  })
  @ApiOkResponse({
    description: 'Session updated successfully',
    schema: {
      example: {
        status: 200,
        message: 'Інформацію про сеанси оновлено успішно!',
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
              message: `Об'єкт з індексом 2 пустий.`,
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
              message: 'Session ID must be a valid number',
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
  async updateSessions(@Body() dtos: UpdateSessionsRequestDTO[]) {
    try {
      await this.sessionService.updateSessions(dtos);

      return {
        status: 200,
        message: `Інформацію про сеанси оновлено успішно!`,
      };
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
