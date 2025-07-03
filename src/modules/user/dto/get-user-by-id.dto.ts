import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IUser } from 'src/interfaces/IUser';
import { AddBookingRequestDTO } from 'src/modules/booking/dto/add-booking.dto';

export class UserCreds implements IUser {
  constructor(user: IUser) {
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.email = user.email;
    this.is_admin = user.is_admin;
  }

  @ApiProperty({ description: "User's first name", example: 'Danylo' })
  first_name: string;

  @ApiProperty({ description: "User's last name", example: 'Makarov' })
  last_name: string;

  @ApiProperty({
    description: "User's email address",
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Whether the user has admin privileges',
    example: false,
  })
  is_admin: boolean;
}

export class UserBookingsDTO extends OmitType(AddBookingRequestDTO, [
  'sessionID',
] as const) {
  @ApiProperty({ description: 'Name of the movie' })
  movieName: string;

  @ApiProperty({ description: 'URL of the movie poster' })
  moviePosterUrl: string;

  @ApiProperty({ description: 'Date/time of the session (ISO string)' })
  date: string;

  @ApiProperty({ description: 'Description of the movie or session' })
  description: string;
}

export class UserSessnsCredsRespDTO {
  constructor(user_creds: UserCreds, user_bookings: UserBookingsDTO[]) {
    this.user = user_creds;
    this.bookings = user_bookings;
  }

  @ApiProperty({
    description: 'Basic user credentials and role info',
    type: () => UserCreds,
  })
  user: UserCreds;

  @ApiProperty({
    description: "List of user's bookings without sessionID",
    type: () => [UserBookingsDTO],
  })
  bookings: UserBookingsDTO[];
}
