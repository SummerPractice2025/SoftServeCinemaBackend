import {
  Controller,
  Put,
  Body,
  Request,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { UpdateSessionsRequestDTO } from './dto/update-sessions.dto';
import { User } from 'generated/prisma';
import { SessionService } from './session.service';
import { AccessTokenGuard } from 'src/guards/AccessTokenGuard';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionService: SessionService) {}

  @UseGuards(AccessTokenGuard)
  @Put()
  async updateSessions(
    @Body() dtos: UpdateSessionsRequestDTO[],
    @Request() req: { user: User },
  ) {
    if (!req.user.is_admin) {
      throw new ForbiddenException(
        'Доступ заборонено. Тільки для адміністраторів.',
      );
    }

    try {
      await this.sessionService.updateSessions(dtos);

      return {
        status: 200,
        message: `Інформацію про сеанси оновлено успішно!`,
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
