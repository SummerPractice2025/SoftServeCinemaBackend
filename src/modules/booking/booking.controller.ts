import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { AccessTokenGuard } from 'src/guards/AccessTokenGuard';
import { User } from 'generated/prisma';
import { AddBookingRequestDTO } from './dto/add-booking.dto';

@ApiTags('booking')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @UseGuards(AccessTokenGuard)
  @Post()
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
    description: 'Seat already booked or invalid request',
  })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error' })
  async addBooking(
    @Body() addBokingDTOs: AddBookingRequestDTO[],
    @Request() req: { user: User },
  ) {
    try {
      return this.bookingService.bookSeats(req.user.id, addBokingDTOs);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Виникла неочікувана помилка.');
    }
  }
}
