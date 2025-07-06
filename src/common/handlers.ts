import { HttpException, InternalServerErrorException } from '@nestjs/common';

export async function handleErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    console.error('Unexpected error:', error);

    throw new InternalServerErrorException('Виникла неочікувана помилка.');
  }
}
