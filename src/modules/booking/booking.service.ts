import { BadRequestException, Injectable } from '@nestjs/common';
import { prismaClient } from 'src/db/prismaClient';
import { AddBookingRequestDTO } from './dto/add-booking.dto';
import { Hall, Session } from 'generated/prisma';
import { SessionService } from '../session/session.service';
import { HallsService } from '../halls/halls.service';

@Injectable()
export class BookingService {
  constructor(
    private readonly hallsService: HallsService,
    private readonly sessionService: SessionService,
  ) {}

  async bookSeats(userID: number, dtos: AddBookingRequestDTO[]) {
    const halls = new Map<number, Hall>();
    const sessions = new Map<number, Session>();

    for (const dto of dtos) {
      const { sessionID, seatRow, seatCol } = dto;

      let session = sessions.get(sessionID);

      if (!session) {
        session = await this.sessionService.getSessionByID(sessionID);
        sessions.set(session.id, session);
      }

      let hall = halls.get(session.hall_id);

      if (!hall) {
        hall = await this.hallsService.getHallByID(session.hall_id);
        halls.set(hall.id, hall);
      }

      if (seatRow * seatCol > hall.rows * hall.cols) {
        throw new BadRequestException(
          `Місця [${seatRow}, ${seatCol}] не існує.`,
        );
      }

      const existing = await prismaClient.booking.findFirst({
        where: {
          session_id: sessionID,
          row_x: seatRow,
          col_y: seatCol,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Місце [${seatRow}, ${seatCol}] вже заброньовано для цього сеансу.`,
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
