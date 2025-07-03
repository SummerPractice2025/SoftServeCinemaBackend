import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInRequestDTO, SignUpRequestDTO } from './dto/user.dto';
import { UserService } from '../user/user.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuthTokenService } from './auth-token.service';
import { Response, Request } from 'express';
import { cookieConfig } from 'src/cookies/cookies';
import { User } from 'generated/prisma';
import { extractRefreshTokenFromCookies } from 'src/cookies/cookies';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './strategies/JwtPayload';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly authTokenService: AuthTokenService,
    private readonly cryptoService: CryptoService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async signUp(dto: SignUpRequestDTO, res: Response) {
    const passwordHash = this.cryptoService.generateSHA256HashBase64(
      dto.password,
    );

    const newUser = await this.userService.createUser({
      ...dto,
      password: passwordHash,
    });

    await this.sendVerificationLetter(dto.email);

    return this.authTokenService.generateTokenPair(newUser, res);
  }

  async signIn(dto: SignInRequestDTO, res: Response) {
    const user = await this.userService.findByEmail(dto.email);

    if (
      !user ||
      this.cryptoService.generateSHA256HashBase64(dto.password) != user.password
    ) {
      throw new ForbiddenException(`Неправильний пароль або email.`);
    }

    return this.authTokenService.generateTokenPair(user, res);
  }

  async signOut(req: Request, res: Response) {
    await this.authTokenService.clearRefreshToken((req.user as User).id);
    res.clearCookie(cookieConfig.refreshToken.name);

    return { message: 'Користувач успішно вийшов з акаунту.' };
  }

  async refresh(req: Request, res: Response) {
    const user = req.user as User;
    const refreshToken = extractRefreshTokenFromCookies(req);

    if (!refreshToken) {
      throw new BadRequestException('No refresh token.');
    }

    const hashed = this.cryptoService.generateSHA256HashBase64(refreshToken);

    if (user.refresh_token !== hashed) {
      throw new UnauthorizedException('Refresh token mismatch.');
    }

    const payload: JwtPayload = this.jwtService.decode(refreshToken);
    const refreshTokenExpiresAt = new Date(payload.exp * 1000);

    return this.authTokenService.generateTokenPair(
      user,
      res,
      refreshToken,
      refreshTokenExpiresAt,
    );
  }

  async verifyEmail(token: string) {
    const successURL = `${process.env.FRONTEND_URL}`;
    const failureURL = `${process.env.FRONTEND_URL}`;

    type JwtPayload = {
      email: string;
    };

    try {
      const payload: JwtPayload = this.jwtService.verify(token, {
        secret: process.env.EMAIL_VERIFY_TOKEN_SECRET,
      });

      if (!(await this.userService.verifyUser(payload.email))) {
        return failureURL;
      }

      return successURL;
    } catch {
      return failureURL;
    }
  }

  private async sendVerificationLetter(userEmail: string) {
    const token = this.jwtService.sign(
      { email: userEmail },
      { secret: process.env.EMAIL_VERIFY_TOKEN_SECRET, expiresIn: '1h' },
    );

    const verificationLink = `${process.env.SERVER_URL}/auth/verify-email?token=${token}`;
    const html = `<p>Перейдіть за посиланням щоб підтвердити свій email: <p><a href="${verificationLink}">${verificationLink}</a>`;

    await this.emailService.sendEmail(
      userEmail,
      'Підтвердіть свій email!',
      html,
    );
  }
}
