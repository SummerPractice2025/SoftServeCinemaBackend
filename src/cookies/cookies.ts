import { Request } from 'express';
import {
  ONE_MINUTE,
  ONE_SECOND,
  ONE_DAY,
  ONE_HOUR,
} from 'src/common/constants';

const MAX_AGE = ONE_SECOND * ONE_MINUTE * ONE_HOUR * ONE_DAY * 30;

export const cookieConfig = {
  refreshToken: {
    name: 'refreshToken',
    options: {
      path: '/',
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: true,
      maxAge: MAX_AGE,
      partitioned: true,
    },
  },
};

export const extractRefreshTokenFromCookies = (req: Request) => {
  const cookies = req.headers.cookie?.split('; ');
  if (!cookies?.length) {
    return null;
  }

  const refreshTokenCookie = cookies.find((cookie) =>
    cookie.startsWith(`${cookieConfig.refreshToken.name}=`),
  );

  if (!refreshTokenCookie) {
    return null;
  }
  const refreshToken = refreshTokenCookie.split('=')[1];

  return refreshToken;
};
