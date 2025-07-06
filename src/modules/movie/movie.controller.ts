import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Put,
  Post,
  HttpCode,
  HttpStatus,
  Body,
  UsePipes,
  ValidationPipe,
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
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MovieService } from './movie.service';
import {
  GetMovieByIDResponseDTO,
  GetMovieFromApiQueryDTO,
  GetMovieResponseDTO,
} from './dto/get-movie.dto';
import { AccessTokenGuard } from 'src/guards/AccessTokenGuard';
import { UpdateMovieRespDto } from './dto/update-movie-by-id.dto';
import { AddMovieRequestDTO } from './dto/add-movie.dto';
import { Role, Roles, RolesGuard } from 'src/common/roles';
import { handleErrors } from 'src/common/handlers';

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
      example: {
        statusCode: 404,
        message: 'Фільм не знайдено',
        error: 'Not Found',
      },
    },
  })
  async getMovieByID(@Param('movie_id') movieID: number) {
    return this.movieService.getMovie(Number(movieID));
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.Admin)
  @Put(':movie_id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
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
    @Param('movie_id') id: string,
  ) {
    return handleErrors(async () => {
      await this.movieService.updateMovieById(Number(id), dto);

      return {
        status: 200,
        message: 'Інфо про фільм оновлено успішно!',
        data: { movie_id: id },
      };
    });
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Add a new movie',
    description:
      'Creates a new movie with sessions, genres, actors, directors, and studios. Only administrators are allowed.',
  })
  @ApiBody({
    type: AddMovieRequestDTO,
    description: 'Movie creation payload',
    examples: {
      example1: {
        summary: 'Complete movie with ISO format',
        value: {
          name: 'The Matrix',
          description:
            'A computer hacker learns from mysterious rebels about the true nature of his reality.',
          duration: 136,
          year: 1999,
          age_rate_id: 1,
          rating: 8.7,
          poster_url: 'https://example.com/poster.jpg',
          trailer_url: 'https://example.com/trailer.mp4',
          genres: [{ name: 'Action' }, { name: 'Sci-Fi' }],
          directors: [{ first_name: 'Lana', last_name: 'Wachowski' }],
          actors: [{ first_name: 'Keanu', last_name: 'Reeves' }],
          studios: [{ name: 'Warner Bros' }],
          sessions: [
            {
              date: '2025-07-01T18:00:00',
              price: 120,
              priceVIP: 200,
              hallID: 1,
              sessionTypeID: 1,
            },
          ],
        },
      },
      example2: {
        summary: 'Complete movie with space date format',
        value: {
          name: 'The Matrix',
          description:
            'A computer hacker learns from mysterious rebels about the true nature of his reality.',
          duration: 136,
          year: 1999,
          age_rate_id: 1,
          rating: 8.7,
          poster_url: 'https://example.com/poster.jpg',
          trailer_url: 'https://example.com/trailer.mp4',
          genres: [{ name: 'Action' }, { name: 'Sci-Fi' }],
          directors: [{ first_name: 'Lana', last_name: 'Wachowski' }],
          actors: [{ first_name: 'Keanu', last_name: 'Reeves' }],
          studios: [{ name: 'Warner Bros' }],
          sessions: [
            {
              date: '2025-07-01 18:00:00',
              price: 120,
              priceVIP: 200,
              hallID: 1,
              sessionTypeID: 1,
            },
          ],
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Movie created successfully',
    schema: {
      example: {
        status: 201,
        message: 'Фільм створено успішно!',
        data: {
          message: 'Фільм успішно створено!',
          movieId: 123,
          status: 'success',
          createdEntities: {
            genres: 2,
            actors: 3,
            directors: 1,
            studios: 1,
            sessions: 5,
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or validation errors',
    content: {
      'application/json': {
        examples: {
          movieAddedEarlierError: {
            summary: 'Movie with chosen name and year was added earlier.',
            value: {
              statusCode: 400,
              message: 'Фільм Аутсайдери 2019 року було додано раніше.',
              error: 'Bad Request',
            },
          },
          validationError: {
            summary: 'Validation errors in request body',
            value: {
              statusCode: 400,
              message: [
                'name must be a string',
                'description must be a string',
                'duration must be a number greater than 0',
                'year must be an integer',
                'age_rate_id must be an integer',
                'rating must be a number',
                'poster_url must be a string',
                'trailer_url must be a string',
                'genres must be an array',
                'directors must be an array',
                'actors must be an array',
                'studios must be an array',
                'sessions must be an array',
              ],
              error: 'Bad Request',
            },
          },
          sessionValidationError: {
            summary: 'Session validation errors',
            value: {
              statusCode: 400,
              message: [
                'date must be a valid ISO 8601 date string',
                'price must be a valid number',
                'price must be at least 0.01',
                'priceVIP must be a valid number',
                'priceVIP must be at least 0.01',
                'hallID must be an integer',
                'sessionTypeID must be an integer',
              ],
              error: 'Bad Request',
            },
          },
          nestedValidationError: {
            summary: 'Nested object validation errors',
            value: {
              statusCode: 400,
              message: [
                'genres must be an array',
                'each genre must have a name property',
                'actors must be an array',
                'each actor must have first_name and last_name properties',
                'directors must be an array',
                'each director must have first_name and last_name properties',
                'studios must be an array',
                'each studio must have a name property',
              ],
              error: 'Bad Request',
            },
          },
          noSessions: {
            summary: 'No sessions provided',
            value: {
              statusCode: 400,
              message: 'Має бути принаймні один сеанс!',
              error: 'Bad Request',
            },
          },
          invalidAgeRate: {
            summary: 'Invalid age rate ID',
            value: {
              statusCode: 400,
              message: 'Даний віковий рейтинг не знайдено!',
              error: 'Bad Request',
            },
          },
          invalidHall: {
            summary: 'Invalid hall ID in sessions',
            value: {
              statusCode: 400,
              message: 'Дану залу не знайдено!',
              error: 'Bad Request',
            },
          },
          invalidSessionType: {
            summary: 'Invalid session type ID in sessions',
            value: {
              statusCode: 400,
              message: 'Даний тип сеансу не знайдено!',
              error: 'Bad Request',
            },
          },
          invalidDateFormat: {
            summary: 'Invalid date format in sessions',
            value: {
              statusCode: 400,
              message:
                'Дата має бути у форматі "YYYY-MM-DDTHH:mm:ss" або "YYYY-MM-DD HH:mm:ss!"',
              error: 'Bad Request',
            },
          },
          invalidDateTime: {
            summary: 'Invalid date/time value',
            value: {
              statusCode: 400,
              message: 'Некотректний дата або час.',
              error: 'Bad Request',
            },
          },
          invalidPrice: {
            summary: 'Invalid price values in sessions',
            value: {
              statusCode: 400,
              message: [
                'price must be at least 0.01',
                'priceVIP must be at least 0.01',
              ],
              error: 'Bad Request',
            },
          },
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
  @ApiInternalServerErrorResponse({
    description: 'Internal server error or database transaction failure',
    content: {
      'application/json': {
        examples: {
          databaseError: {
            summary: 'Database connection or transaction error',
            value: {
              statusCode: 500,
              message: 'Виникла неочікувана помилка.',
              error: 'Internal Server Error',
            },
          },
          transactionFailure: {
            summary: 'Database transaction failed',
            value: {
              statusCode: 500,
              message: 'Виникла неочікувана помилка.',
              error: 'Internal Server Error',
            },
          },
        },
      },
    },
  })
  async createMovie(@Body() dto: AddMovieRequestDTO) {
    return handleErrors(async () => {
      const result = await this.movieService.createMovie(dto);

      return {
        status: 201,
        message: 'Фільм створено успішно!',
        data: result,
      };
    });
  }
}
