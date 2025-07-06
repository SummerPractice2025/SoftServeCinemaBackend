import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetMoviesResponseDTO } from './dto/get-movies.dto'; // adjust path
import { MovieService } from './movie.service';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @ApiOperation({ summary: 'Get active and upcoming movies' })
  @ApiQuery({
    name: 'qtty',
    required: false,
    type: Number,
    description:
      'Optional limit for number of movies returned. The list is formed by movies with the nearest upcoming sessions.',
  })
  @ApiOkResponse({
    description:
      'List of active or upcoming movies with their nearest session. Sorted by session date in ascending order.',
    type: GetMoviesResponseDTO,
    isArray: true,
  })
  async getActiveMovies(@Query('qtty') qtty?: number) {
    const quantity = qtty ? Number(qtty) : undefined;
    return this.movieService.getActiveAndUpcomingMovies(quantity);
  }
}
