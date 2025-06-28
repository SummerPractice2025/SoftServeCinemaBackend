import { ApiProperty } from '@nestjs/swagger';

export class AddBookingRequestDTO {
  @ApiProperty({ description: 'ID of the session to book tickets for' })
  sessionID: number;

  @ApiProperty({ description: 'Booked seat by row' })
  seatRow: number;

  @ApiProperty({ description: 'Booked set by column' })
  seatCol: number;

  @ApiProperty({ description: 'Is booked seat VIP or not?' })
  isVIP: boolean;
}
