import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInRequestDTO, SignUpRequestDTO } from './dto/user.dto';
import { RefreshTokenGuard } from 'src/guards/RefreshTokenGuard';
import { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { EmailService } from '../email/email.service';
import { AccessTokenGuard } from 'src/guards/AccessTokenGuard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  @Post('sign-up')
  @ApiOperation({ description: 'User registration (sign up)' })
  @ApiBody({ type: SignUpRequestDTO })
  @ApiCreatedResponse({
    description: 'User successfully registered, returns access token',
    schema: {
      example: { access_token: 'jwt.access.token.here' },
    },
  })
  async signUp(
    @Body() dto: SignUpRequestDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signUp(dto, res);
  }

  @Post('sign-in')
  @ApiOperation({ description: 'User login (sign in)' })
  @ApiBody({ type: SignInRequestDTO })
  @ApiOkResponse({
    description: 'User successfully logged in, returns access token',
    schema: {
      example: { access_token: 'jwt.access.token.here' },
    },
  })
  @ApiForbiddenResponse({
    description: 'Invalid email or password',
    schema: {
      example: {
        statusCode: 400,
        message: 'Неправильний пароль або email.',
        error: 'Bad Request',
      },
    },
  })
  async signIn(
    @Body() dto: SignInRequestDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signIn(dto, res);
  }

  @UseGuards(AccessTokenGuard)
  @Post('sign-out')
  @ApiOperation({ description: 'User logout (sign out)' })
  @ApiOkResponse({
    description: 'User successfully logged out',
    schema: {
      example: { message: 'Користувач успішно вийшов з акаунту.' },
    },
  })
  @Post('sign-out')
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signOut(req, res);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @ApiOperation({ description: 'Refresh access and refresh tokens' })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully, returns new access token',
    schema: {
      example: { access_token: 'new.jwt.access.token.here' },
    },
  })
  @ApiBadRequestResponse({
    description: 'No refresh token provided',
    schema: {
      example: {
        statusCode: 400,
        message: 'No refresh token.',
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token mismatch or invalid',
    schema: {
      example: {
        statusCode: 401,
        message: 'Refresh token mismatch.',
        error: 'Unauthorized',
      },
    },
  })
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refresh(req, res);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    return res.redirect(await this.authService.verifyEmail(token));
  }
}
