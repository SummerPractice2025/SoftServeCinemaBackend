import { ApiProperty } from '@nestjs/swagger';

export class GetAvSesnsByMovIDRespDTO {
  constructor(session: { id: number; date: string; session_type_id: number }) {
    this.id = session.id;
    this.date = session.date;
    this.session_type_id = session.session_type_id;
  }

  @ApiProperty({ description: 'session id' })
  id: number;

  @ApiProperty({ description: 'session date' })
  date: string;

  @ApiProperty({ description: 'session type id (for 3D, 2D etc.)' })
  session_type_id: number;
}
