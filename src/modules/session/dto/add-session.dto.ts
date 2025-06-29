import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, Min } from 'class-validator';

export class AddSessionRequestDTO {
  @ApiProperty({ description: 'Movie ID', example: 1 })
  @IsInt({ message: 'movieID must be an integer' })
  @Type(() => Number)
  movieID: number;

  @ApiProperty({
    description: 'Session date/time in ISO format',
    example: '2025-06-30T18:00:00',
  })
  @IsDateString({}, { message: 'date must be a valid ISO 8601 date string' })
  date: string;

  @ApiProperty({ description: 'Standard ticket price', example: 100.5 })
  @IsNumber({}, { message: 'price must be a valid number' })
  @Min(0.01, { message: 'price must be at least 0.01' })
  @Type(() => Number)
  price: number;

  @ApiProperty({ description: 'VIP ticket price', example: 150.75 })
  @IsNumber({}, { message: 'priceVIP must be a valid number' })
  @Min(0.01, { message: 'priceVIP must be at least 0.01' })
  @Type(() => Number)
  priceVIP: number;

  @ApiProperty({ description: 'Hall ID', example: 2 })
  @IsInt({ message: 'hallID must be an integer' })
  @Type(() => Number)
  hallID: number;

  @ApiProperty({ description: 'Session type ID', example: 1 })
  @IsInt({ message: 'sessionTypeID must be an integer' })
  @Type(() => Number)
  sessionTypeID: number;
}
