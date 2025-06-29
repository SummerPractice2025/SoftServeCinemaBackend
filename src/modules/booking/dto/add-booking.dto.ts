import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber } from 'class-validator';

export class AddBookingRequestDTO {
  @ApiProperty({ description: 'ID of the session to book tickets for' })
  @IsNumber()
  sessionID: number;

  @ApiProperty({ description: 'Booked seat by row' })
  @IsNumber()
  seatRow: number;

  @ApiProperty({ description: 'Booked set by column' })
  @IsNumber()
  seatCol: number;

  @ApiProperty({ description: 'Is booked seat VIP or not?' })
  @IsBoolean()
  isVIP: boolean;
}
