import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { AccessTokenGuard } from 'src/guards/AccessTokenGuard';
import { User } from 'generated/prisma';
import { AddBookingRequestDTO } from './dto/add-booking.dto';
import { handleErrors } from 'src/common/handlers';

@ApiTags('booking')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @UseGuards(AccessTokenGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Book seats for a session' })
  @ApiBody({
    type: AddBookingRequestDTO,
    isArray: true,
    description: 'Array of bookings for a single user',
    examples: {
      example1: {
        summary: 'Valid request',
        value: [
          {
            sessionID: 1,
            seatRow: 5,
            seatCol: 6,
            isVIP: false,
          },
          {
            sessionID: 1,
            seatRow: 5,
            seatCol: 7,
            isVIP: true,
          },
        ],
      },
    },
  })
  @ApiCreatedResponse({ description: 'Seats successfully booked' })
  @ApiBadRequestResponse({
    description: 'Seat already booked or validation failed',
    schema: {
      example: {
        statusCode: 400,
        message: 'Місце [5, 6] вже заброньовано на цю сесію.',
        error: 'Bad Request',
      },
    },
    examples: {
      seatTaken: {
        summary: 'Seat already booked',
        value: {
          statusCode: 400,
          message: 'Місце [5, 6] вже заброньовано для цього сеансу.',
          error: 'Bad Request',
        },
      },
      invalidSeat: {
        summary: 'Invalid seat coordinates',
        value: {
          statusCode: 400,
          message: 'Місця [100, 100] не існує.',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error' })
  async addBooking(
    @Body() addBokingDTOs: AddBookingRequestDTO[],
    @Request() req: { user: User },
  ) {
    return handleErrors(async () => {
      return await this.bookingService.bookSeats(req.user.id, addBokingDTOs);
    });
  }
}
