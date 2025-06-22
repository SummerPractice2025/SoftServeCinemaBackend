import { ApiProperty } from '@nestjs/swagger';
import { SessionType } from 'generated/prisma';

export class GetSessionTypesResponseDTO {
  constructor(sessionType: SessionType) {
    this.id = sessionType.id;
    this.type = sessionType.type;
  }

  @ApiProperty({ description: 'session type id' })
  id: number;

  @ApiProperty({ description: 'session type name' })
  type: string;
}
