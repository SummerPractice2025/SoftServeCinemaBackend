import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { UpdateSessionRequestDTO } from './update-session-by-id.dto';

export class UpdateSessionsRequestDTO extends UpdateSessionRequestDTO {
  @ApiProperty({
    description: 'Session ID',
    example: 123,
  })
  @Type(() => Number)
  @IsInt({ message: 'Session ID must be a valid number' })
  session_id: number;
}
