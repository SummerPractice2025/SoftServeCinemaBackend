import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsInt,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddSessionRequestDTO } from 'src/modules/session/dto/add-session.dto';

class GenreDTO {
  @ApiProperty({ description: 'Genre name', example: 'Drama' })
  @IsString()
  name: string;
}

class PersonNameDTO {
  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  last_name: string;
}

class StudioDTO {
  @ApiProperty({ description: 'Studio name', example: 'Warner Bros' })
  @IsString()
  name: string;
}

export class SessionCreateDTO extends OmitType(AddSessionRequestDTO, [
  'movieID',
] as const) {}

export class AddMovieRequestDTO {
  @ApiProperty({ description: 'Movie title', example: 'The Matrix' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Movie description',
    example:
      'A computer hacker learns from mysterious rebels about the true nature of his reality.',
  })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Movie duration in minutes', example: 136 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  duration: number;

  @ApiProperty({ description: 'Release year', example: 1999 })
  @IsInt()
  @Type(() => Number)
  year: number;

  @ApiProperty({ description: 'Age rating ID', example: 1 })
  @IsInt()
  @Type(() => Number)
  age_rate_id: number;

  @ApiProperty({ description: 'Movie rating', example: 8.7 })
  @IsNumber()
  @Type(() => Number)
  rating: number;

  @ApiProperty({
    description: 'Poster URL',
    example: 'https://example.com/poster.jpg',
  })
  @IsString()
  poster_url: string;

  @ApiProperty({
    description: 'Trailer URL',
    example: 'https://example.com/trailer.mp4',
  })
  @IsString()
  trailer_url: string;

  @ApiProperty({ description: 'Movie genres', type: [GenreDTO] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenreDTO)
  genres: GenreDTO[];

  @ApiProperty({ description: 'Movie directors', type: [PersonNameDTO] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonNameDTO)
  directors: PersonNameDTO[];

  @ApiProperty({ description: 'Movie actors', type: [PersonNameDTO] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonNameDTO)
  actors: PersonNameDTO[];

  @ApiProperty({ description: 'Production studios', type: [StudioDTO] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudioDTO)
  studios: StudioDTO[];

  @ApiProperty({
    description: 'Movie sessions (movieID will be ignored)',
    type: [SessionCreateDTO],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionCreateDTO)
  sessions: SessionCreateDTO[];
}
