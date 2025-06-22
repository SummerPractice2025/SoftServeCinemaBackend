import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { GetSessionTypesResponseDTO } from './dto/get-session-types.dto';
import { SessionService } from './session.service';
import { AccessTokenGuard } from 'src/guards/AccessTokenGuard';
import { AddSessionRequestDTO } from './dto/add-session.dto';
import { User } from 'generated/prisma';

@ApiTags('session')
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('types')
  @ApiOperation({
    description: 'Returns all session types (e.g. 2D, 3D, IMAX)',
  })
  @ApiOkResponse({
    description: 'If success returns a session type list.',
    type: GetSessionTypesResponseDTO,
    isArray: true,
  })
  async getSessionTypes() {
    return this.sessionService.getSessionTypes();
  }

  @UseGuards(AccessTokenGuard)
  @Post()
  @ApiOperation({ description: 'Adds sessions for the movie' })
  @ApiBody({ type: [AddSessionRequestDTO] })
  @ApiOkResponse({
    description: 'Sessions were successfully added',
    type: String,
  })
  @ApiBadRequestResponse({
    description: 'The request contains errors or invalid data',
  })
  @ApiForbiddenResponse({
    description: 'Access denied. Only admins can add sessions.',
  })
  async addSession(
    @Body() addSessionDTOs: AddSessionRequestDTO[],
    @Request() req: { user: User },
  ) {
    if (!req.user.is_admin) {
      throw new ForbiddenException(
        `Доступ заборонено. Тільки для адміністраторів`,
      );
    }

    try {
      await this.sessionService.addSessions(addSessionDTOs);
      return `Успішно додано ${addSessionDTOs.length} сесій`;
    } catch {
      throw new BadRequestException('Запит містить помилки.');
    }
  }
}
