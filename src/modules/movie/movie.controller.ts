import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiNotFoundResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { MovieService } from './movie.service';
import {
  GetMovieFromApiQueryDTO,
  GetMovieResponseDTO,
} from './dto/get-movie.dto';

@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @ApiOperation({ description: 'Returns movie info from tmdb' })
  @ApiQuery({
    name: 'name',
    required: true,
    description: 'Movie name in ukrainian',
  })
  @ApiQuery({ name: 'year', required: true, description: 'Movie release year' })
  @ApiOkResponse({
    description: 'If success returns movie info',
    type: GetMovieResponseDTO,
  })
  @ApiNotFoundResponse({
    description: 'Movie not found',
    schema: {
      example: {
        message: 'Фільм не знайдено',
        statusCode: 404,
        error: 'Not Found',
      },
    },
  })
  async getMovie(@Query() query: GetMovieFromApiQueryDTO) {
    return this.movieService.findMovie(query.name, query.year);
  }
}
