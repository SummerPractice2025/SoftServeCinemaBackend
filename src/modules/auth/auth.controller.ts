import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { SignInRequestDTO, SignUpRequestDTO } from './dto/user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() dto: SignUpRequestDTO) {
    return this.authService.signUp(dto);
  }

  @Post('signin')
  async signIn(@Body() dto: SignInRequestDTO) {
    return this.authService.signIn(dto);
  }
}
