import { ApiProperty } from '@nestjs/swagger';

export class GetAvSesnsByMovIDRespDTO {
  constructor(session: { id: number; date: string }) {
    this.id = session.id;
    this.date = session.date;
  }

  @ApiProperty({ description: 'session id' })
  id: number;

  @ApiProperty({ description: 'session date' })
  date: string;
}
