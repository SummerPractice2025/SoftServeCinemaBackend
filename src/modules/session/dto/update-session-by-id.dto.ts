import {
  IsInt,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
// import { Optional } from '@nestjs/common';

export class UpdateSessionRequestDTO {
  // @ApiProperty({ description: 'movie id', example: 1 })
  // @IsInt()
  // @Min(1)
  // @IsNotEmpty()
  // movie_id: number;

  @ApiProperty({
    description: 'Exipration session date',
    example: '2025-06-23T15:00:00 or 2025-06-23 15:00:00',
  })
  @IsNotEmpty()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: "standard session's ticket price",
    example: 100.5,
  })
  @IsNumber()
  @Min(0.01)
  price?: number;

  @ApiProperty({
    description: "VIP session's ticket price",
    example: 150.75,
  })
  @IsNumber()
  @Min(0.01)
  price_VIP?: number;

  @ApiProperty({ description: 'hall id', example: 2 })
  @IsInt()
  hall_id?: number;

  @ApiProperty({ description: "session's type id (2D / 3D etc.)", example: 1 })
  @IsInt()
  session_type_id?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
