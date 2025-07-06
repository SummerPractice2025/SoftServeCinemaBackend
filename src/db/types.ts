import { Prisma } from 'generated/prisma';

export type MovieFull = Prisma.MovieGetPayload<{
  include: {
    rate: true;
    genres: { include: { genre: true } };
    actors: { include: { actor: true } };
    directors: { include: { director: true } };
    studios: { include: { studio: true } };
  };
}>;
