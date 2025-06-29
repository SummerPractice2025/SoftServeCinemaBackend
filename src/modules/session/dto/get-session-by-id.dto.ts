import { ApiProperty } from '@nestjs/swagger';

export class GetSessionByIdSeatDTO {
  @ApiProperty() is_VIP: boolean;
  @ApiProperty() is_booked: boolean;
  @ApiProperty() row: number;
  @ApiProperty() col: number;
}

export class GetSessionByIdResponseDTO {
  @ApiProperty() hall_name: string;
  @ApiProperty({ type: String, format: 'date-time' }) date_time: string;
  @ApiProperty() price: number;
  @ApiProperty() price_VIP: number;
  @ApiProperty() session_type_id: number;
  @ApiProperty() is_deleted: boolean;
  @ApiProperty({ type: [GetSessionByIdSeatDTO] })
  seats: GetSessionByIdSeatDTO[];
}
