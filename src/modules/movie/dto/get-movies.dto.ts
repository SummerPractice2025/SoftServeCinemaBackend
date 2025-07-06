import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Movie, Genre, Session, SessionType } from 'generated/prisma';
import { toZonedTime, format } from 'date-fns-tz';
import { TIME_ZONE, TIME_FORMAT } from 'src/common/constants';

export class ClosestSessionDTO {
  constructor(closestSession: Session, sessionType: SessionType) {
    this.id = closestSession.id;
    this.date = format(
      toZonedTime(closestSession.date, TIME_ZONE),
      TIME_FORMAT,
    );
    this.type = sessionType.type;
  }

  @ApiProperty({ description: 'Session ID' })
  @IsInt()
  id: number;

  @ApiProperty({ description: 'Date and time of the session in ISO format' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Type of session (e.g. IMAX, 3D, etc.)' })
  @IsString()
  type: string;
}

export class GetMoviesResponseDTO {
  constructor(
    movie: Movie,
    genres: Genre[],
    closestSession: Session | null,
    sessionType: SessionType | null,
  ) {
    this.id = movie.id;
    this.name = movie.name;
    this.posterURL = movie.thumbnail_url;

    const now = new Date();
    this.isPremiere = now < movie.created_at;

    this.genreIDs = genres.map((genre) => genre.id);

    if (closestSession && sessionType) {
      this.session = new ClosestSessionDTO(closestSession, sessionType);
    } else {
      this.session = {} as ClosestSessionDTO;
    }
  }

  @ApiProperty({ description: 'Unique identifier of the movie' })
  @IsInt()
  id: number;

  @ApiProperty({ description: 'Name of the movie' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL of the movie poster image' })
  @IsString()
  posterURL: string;

  @ApiProperty({ description: 'Flag indicating if the movie is a premier' })
  @IsBoolean()
  isPremiere: boolean;

  @ApiProperty({
    description: 'Array of genre IDs associated with the movie',
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  genreIDs: number[];

  @ApiProperty({ description: 'Session details' })
  @ValidateNested()
  session: ClosestSessionDTO | null;
}
