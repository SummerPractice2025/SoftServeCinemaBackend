import { Injectable } from '@nestjs/common';
import { prismaClient } from 'src/db/prismaClient';
import { GetHallsResponseDTO } from './dto/get-halls.dto';

@Injectable()
export class HallsService {
  async getHalls(): Promise<GetHallsResponseDTO[]> {
    const response = await prismaClient.hall.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return response.map((hall) => new GetHallsResponseDTO(hall));
  }
}
