import { BadRequestException, Injectable } from '@nestjs/common';
import { prismaClient } from 'src/db/prismaClient';
import { AddBookingRequestDTO } from './dto/add-booking.dto';

@Injectable()
export class BookingService {
  async bookSeats(userID: number, dtos: AddBookingRequestDTO[]) {
    for (const dto of dtos) {
      const { sessionID, seatRow, seatCol } = dto;

      const existing = await prismaClient.booking.findFirst({
        where: {
          session_id: sessionID,
          row_x: seatRow,
          col_y: seatCol,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Місце [${seatRow}, ${seatCol}] вже заброньовано на цю сесію.`,
        );
      }
    }

    await prismaClient.booking.createMany({
      data: dtos.map((dto) => ({
        user_id: userID,
        session_id: dto.sessionID,
        row_x: dto.seatRow,
        col_y: dto.seatCol,
        is_VIP: dto.isVIP,
      })),
    });

    return { message: `Заброньовано ${dtos.length} місць.` };
  }
}
