import {
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { BookingService } from '../booking/booking.service';
import { AccessTokenGuard } from 'src/guards/AccessTokenGuard';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  UserBookingsDTO,
  UserCreds,
  UserSessnsCredsRespDTO,
} from './dto/get-user-by-id.dto';
import { User } from 'generated/prisma';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly bookingService: BookingService,
  ) {}

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retrieve user credentials and upcoming bookings',
    description:
      'Returns basic user info and list of upcoming bookings; requires authentication.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The ID of the user to retrieve',
  })
  @ApiOperation({
    summary: 'Get user info and upcoming bookings by user ID',
    description: 'Returns user credentials and list of future bookings',
  })
  @ApiOkResponse({
    description: 'Successfully returned user data and bookings',
    type: UserSessnsCredsRespDTO,
    examples: {
      'application/json': {
        summary: 'Successful response example',
        value: {
          user: {
            first_name: 'Danylo',
            last_name: 'Makarov',
            email: 'user@example.com',
            is_admin: false,
          },
          bookings: [
            {
              movieName: 'Inception',
              moviePosterUrl: 'https://example.com/inception.jpg',
              date: '2025-07-01 18:30:00',
              description: 'A mind-bending thriller',
            },
          ],
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description:
      '403: Access forbidden. You can only view info for your own user ID.',
    examples: {
      'application/json': {
        summary: 'Forbidden error example',
        value: {
          statusCode: 403,
          message: 'Доступ заборонено. Перегляд інфо тільки за своїм id.',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: '404: Користувача з вказаним ID не знайдено',
    examples: {
      'application/json': {
        summary: 'Not found error example',
        value: {
          statusCode: 404,
          message: 'Користувача з id 123 не знайдено!',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: '500: Internal Server Error',
    examples: {
      'application/json': {
        summary: 'Internal server error example',
        value: {
          statusCode: 500,
          message: 'Сталася неочікувана помилка',
        },
      },
    },
  })
  async getUserWithBookings(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: User },
  ): Promise<UserSessnsCredsRespDTO> {
    try {
      if (req.user.id !== id) {
        throw new ForbiddenException(
          'Доступ заборонено. Перегляд інфо тільки за своїм id.',
        );
      }

      const exists = await this.userService.isExist(id);
      if (!exists) {
        throw new NotFoundException(`Користувача з id ${id} не знайдено!`);
      }

      const user = await this.userService.findById(id);
      const credsDto = new UserCreds(user);

      const bookingsDto: UserBookingsDTO[] =
        await this.bookingService.getBookingsByUserId(id);

      return new UserSessnsCredsRespDTO(credsDto, bookingsDto);
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }
      throw new InternalServerErrorException();
    }
  }
}
