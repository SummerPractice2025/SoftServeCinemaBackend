import { ApiProperty } from '@nestjs/swagger';
import { Hall } from 'generated/prisma';

export class GetHallsResponseDTO {
  constructor(hall: Hall) {
    this.id = hall.id;
    this.name = hall.name;
  }

  @ApiProperty({ description: 'hall id' })
  id: number;

  @ApiProperty({ description: 'hall name' })
  name: string;
}
