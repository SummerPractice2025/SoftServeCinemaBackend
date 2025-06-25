import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Put,
  HttpCode,
  HttpStatus,
  Body,
  BadRequestException,
  InternalServerErrorException,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiNotFoundResponse,
  ApiQuery,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { MovieService } from './movie.service';
import {
  GetMovieByIDResponseDTO,
  GetMovieFromApiQueryDTO,
  GetMovieResponseDTO,
} from './dto/get-movie.dto';
import { AccessTokenGuard } from 'src/guards/AccessTokenGuard';
import { UpdateMovieRespDto } from './dto/update-movie-by-id.dto';
import { User } from 'generated/prisma';

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
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: { type: 'string', example: 'Фільм не знайдено' },
        error: { type: 'string', example: 'Not Found' },
      },
      example: {
        statusCode: 404,
        message: 'Фільм не знайдено',
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
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: { type: 'string', example: 'Фільм з ID 1 не знайдено' },
        error: { type: 'string', example: 'Not Found' },
      },
      example: {
        statusCode: 404,
        message: 'Фільм з ID 1 не знайдено',
        error: 'Not Found',
      },
    },
  })
  async getMovieByID(@Param('movie_id') movieID: number) {
    return this.movieService.getMovie(Number(movieID));
  }

  @UseGuards(AccessTokenGuard)
  @Put(':movie_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'Update movie info by ID (admin only)' })
  @ApiParam({
    name: 'movie_id',
    type: Number,
    description: 'ID of the movie to update',
    example: 1,
  })
  @ApiBody({ type: UpdateMovieRespDto })
  @ApiOkResponse({
    description: 'Movie updated successfully',
    schema: {
      example: {
        status: 200,
        message: 'Інфо про фільм оновлено успішно!',
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Invalid input, movie does not exist, or age rate does not exist',
    schema: {
      example: {
        statusCode: 400,
        message: 'Some error message',
        error: 'Bad Request',
      },
    },
    examples: {
      validationError: {
        summary: 'Validation error',
        value: {
          statusCode: 400,
          message: [
            'name must be a string',
            'age_rate_id must be a positive number',
          ],
          error: 'Bad Request',
        },
      },
      movieNotFound: {
        summary: 'Movie not found error',
        value: {
          statusCode: 400,
          message: 'Фільм не знайдено!',
          error: 'Bad Request',
        },
      },
      ageRateNotFound: {
        summary: 'Age rate not found error',
        value: {
          statusCode: 400,
          message: 'Віковий рейтинг з ID 123 не існує!',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized — missing or invalid auth token',
    schema: { example: { statusCode: 401, message: 'Unauthorized' } },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden — user lacks admin rights',
    schema: {
      example: {
        statusCode: 403,
        message: 'Доступ заборонено. Тільки для адміністраторів',
      },
    },
  })
  async updateMovie(
    @Body() dto: UpdateMovieRespDto,
    @Request() req: { user: User },
    @Param('movie_id') id: string,
  ) {
    if (!req.user.is_admin) {
      throw new ForbiddenException(
        `Доступ заборонено. Тільки для адміністраторів`,
      );
    }

    try {
      await this.movieService.updateMovieById(Number(id), dto);
      return {
        status: 200,
        message: 'Інфо про фільм оновлено успішно!',
        data: { movie_id: Number(id) },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Виникла неочікувана помилка.');
    }
  }
}
