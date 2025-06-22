import { Injectable } from '@nestjs/common';
import { TmdbService } from '../tmdb/tmdb.service';
import { GetMovieResponseDTO } from './dto/get-movie.dto';

@Injectable()
export class MovieService {
  constructor(private readonly tmdbService: TmdbService) {}

  async findMovie(title: string, year: number): Promise<GetMovieResponseDTO> {
    return this.tmdbService.getMovieByTitleAndYear(title, year);
  }
}
