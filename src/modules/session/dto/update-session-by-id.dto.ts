import {
  IsInt,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateSessionRequestDTO {
  @ApiProperty({
    description: 'Exipration session date',
    example: '2025-06-23T15:00:00 or 2025-06-23 15:00:00',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: "standard session's ticket price",
    example: 100.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a valid number' })
  @Min(0.01)
  price?: number;

  @ApiProperty({
    description: "VIP session's ticket price",
    example: 150.75,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'VIP price must be a valid number' })
  @Min(0.01)
  price_VIP?: number;

  @ApiProperty({ description: 'hall id', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Hall ID must be a valid integer' })
  hall_id?: number;

  @ApiProperty({ description: "session's type id (2D / 3D etc.)", example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Session type ID must be a valid integer' })
  session_type_id?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
