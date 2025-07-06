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

  @ApiProperty({
    description: 'Movie genres',
    example: '[Фантастика, Пригоди]',
  })
  @IsArray()
  @IsString({ each: true })
  genres: string[];

  @ApiProperty({ description: 'Movie directors', example: '[Крістофер Нолан]' })
  @IsArray()
  @IsString({ each: true })
  directors: string[];

  @ApiProperty({
    description: 'Movie actors',
    example: '[Леонардо ді Капріо, Метт Деймон]',
  })
  @IsArray()
  @IsString({ each: true })
  actors: string[];

  @ApiProperty({
    description: 'Production studios',
    example: '[Syncopy, Legendary Pictures]',
  })
  @IsArray()
  @IsString({ each: true })
  studios: string[];

  @ApiProperty({
    description: 'Movie sessions (movieID will be ignored)',
    type: [SessionCreateDTO],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionCreateDTO)
  sessions: SessionCreateDTO[];
}
