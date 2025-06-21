import { Injectable } from '@nestjs/common';
import { GetSessionTypesResponseDTO } from './dto/get-session-types.dto';
import { prismaClient } from 'src/db/prismaClient';

@Injectable()
export class SessionService {
  async getSessionTypes(): Promise<GetSessionTypesResponseDTO[]> {
    const response = await prismaClient.sessionType.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    return response.map(
      (sessionType) => new GetSessionTypesResponseDTO(sessionType),
    );
  }
}
