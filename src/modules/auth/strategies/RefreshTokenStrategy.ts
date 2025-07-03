import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { extractRefreshTokenFromCookies } from 'src/cookies/cookies';
import { UserService } from 'src/modules/user/user.service';
import { JwtPayload } from './JwtPayload';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => extractRefreshTokenFromCookies(req),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.REFRESH_TOKEN_SECRET ?? '',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.user_id) {
      throw new UnauthorizedException('Invalid refresh jwt payload.');
    }

    const user = await this.userService.findById(payload.user_id);

    return user;
  }
}
