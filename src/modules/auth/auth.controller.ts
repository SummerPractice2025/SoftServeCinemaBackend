import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { SignInRequestDTO, SignUpRequestDTO } from './dto/user.dto';
import { RefreshTokenGuard } from 'src/guards/RefreshTokenGuard';
import { Response, Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(
    @Body() dto: SignUpRequestDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signUp(dto, res);
  }

  @Post('sign-in')
  async signIn(
    @Body() dto: SignInRequestDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signIn(dto, res);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('sign-out')
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signOut(req, res);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refresh(req, res);
  }
}
