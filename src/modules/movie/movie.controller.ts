import { Controller, Get, Query, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiNotFoundResponse,
  ApiQuery,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { MovieService } from './movie.service';
import {
  GetMovieByIDResponseDTO,
  GetMovieFromApiQueryDTO,
  GetMovieResponseDTO,
} from './dto/get-movie.dto';

@ApiTags('movie')
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

  @Get(':movie_id')
  @ApiOperation({ description: 'Returns movie info by id' })
  @ApiParam({
    name: 'movie_id',
    type: Number,
    description: 'Movie ID to get movie info',
    example: 1,
  })
  @ApiOkResponse({
    description: 'If success returns movie info',
    type: GetMovieByIDResponseDTO,
  })
  @ApiNotFoundResponse({
    description: 'Movie not found',
    schema: {
      example: {
        message: 'Фільм з ID {movie_id} не знайдено',
        statusCode: 404,
        error: 'Not Found',
      },
    },
  })
  async getMovieByID(@Param('movie_id') movieID: number) {
    return this.movieService.getMovie(Number(movieID));
  }
}
