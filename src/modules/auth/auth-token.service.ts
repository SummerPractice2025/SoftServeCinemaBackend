import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from '../crypto/crypto.service';
import { Response } from 'express';
import { cookieConfig } from 'src/cookies/cookies';
import { User } from 'generated/prisma';
import { prismaClient } from 'src/db/prismaClient';

@Injectable()
export class AuthTokenService {
  constructor(
    private jwtService: JwtService,
    private cryptoService: CryptoService,
  ) {}

  async generateTokenPair(
    user: User,
    res: Response,
    currentRefreshToken?: string,
    currentRefreshTokenExpiresAt?: Date,
  ) {
    if (currentRefreshToken && currentRefreshTokenExpiresAt) {
      const hashedCurrent =
        this.cryptoService.generateSHA256HashBase64(currentRefreshToken);

      const userFromDB = await prismaClient.user.findUnique({
        where: { id: user.id },
      });

      if (
        !userFromDB?.refresh_token ||
        userFromDB.refresh_token !== hashedCurrent
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }
    }

    const newRefreshToken = this.jwtService.sign(
      { user_id: user.id },
      {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiresIn: '30d',
      },
    );

    const hashedNewRefreshToken =
      this.cryptoService.generateSHA256HashBase64(newRefreshToken);

    await prismaClient.user.update({
      where: { id: user.id },
      data: { refresh_token: hashedNewRefreshToken },
    });

    res.cookie(cookieConfig.refreshToken.name, newRefreshToken, {
      ...cookieConfig.refreshToken.options,
    });

    const accessToken = this.jwtService.sign(
      { user_id: user.id },
      {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: '3h',
      },
    );

    return { access_token: accessToken };
  }

  async clearRefreshToken(userId: number) {
    await prismaClient.user.update({
      where: { id: userId },
      data: { refresh_token: null },
    });
  }
}
