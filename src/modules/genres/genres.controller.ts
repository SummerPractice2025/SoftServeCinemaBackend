import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetGenresResponseDTO } from './dto/get-genres.dto';
import { GenresService } from './genres.service';

@ApiTags('genres')
@Controller('genres')
export class GenresController {
  constructor(private genresService: GenresService) {}

  @Get()
  @ApiOperation({ description: "Returns genres' ids and names." })
  @ApiOkResponse({
    description: "If success returns a genre's list.",
    type: GetGenresResponseDTO,
    isArray: true,
  })
  async getGenres() {
    return this.genresService.getGenres();
  }
}
