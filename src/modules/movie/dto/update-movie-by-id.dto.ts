import {
  IsOptional,
  IsString,
  IsInt,
  IsPositive,
  IsDateString,
  MinLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMovieRespDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Movie name',
    minLength: 1,
    example: 'Назва фільму',
  })
  @IsOptional()
  @IsString({ message: 'Назва фільму повинна бути рядком' })
  @MinLength(1, { message: 'Назва фільму не може бути порожньою' })
  name?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Age rating ID',
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'ID вікового рейтингу повинен бути цілим числом' })
  @IsPositive({ message: 'ID вікового рейтингу повинен бути додатнім числом' })
  @Min(1, { message: 'ID вікового рейтингу повинен бути не менше 1' })
  age_rate_id?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Description text',
    example: 'Опис фільму',
  })
  @IsOptional()
  @IsString({ message: 'Опис повинен бути рядком' })
  description?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: 'Optional expiration date (e.g., if film is too successful)',
    example: '2025-12-31 18:00:00 or 2025-12-31 23:59:59',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Некоректний формат дати закінчення' })
  expiration_date?: string;
}
