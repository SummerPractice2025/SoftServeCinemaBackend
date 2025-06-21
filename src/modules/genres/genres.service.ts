import { Injectable } from '@nestjs/common';
import { GetGenresResponseDTO } from './dto/get-genres.dto';
import { prismaClient } from '../../db/prismaClient';

@Injectable()
export class GenresService {
  async getGenres(): Promise<GetGenresResponseDTO[]> {
    const response = await prismaClient.genre.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    return response.map((genre) => new GetGenresResponseDTO(genre));
  }
}
