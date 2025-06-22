import { Controller, Get } from '@nestjs/common';
import { HallsService } from './halls.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetHallsResponseDTO } from './dto/get-halls.dto';

@ApiTags('halls')
@Controller('halls')
export class HallsController {
  constructor(private hallService: HallsService) {}

  @Get()
  @ApiOperation({ description: "Returns halls' ids and names." })
  @ApiOkResponse({
    description: 'If success returns all the halls (id, name) in db.',
    type: GetHallsResponseDTO,
    isArray: true,
  })
  async getHalls() {
    return this.hallService.getHalls();
  }
}
