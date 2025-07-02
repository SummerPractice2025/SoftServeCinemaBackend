import { Request } from 'express';

const MAX_AGE = 1000 * 60 * 60 * 24 * 30;

export const cookieConfig = {
  refreshToken: {
    name: 'refreshToken',
    options: {
      path: '/',
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: true,
      maxAge: MAX_AGE,
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
