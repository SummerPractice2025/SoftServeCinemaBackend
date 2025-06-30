import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'generated/prisma';
import { prismaClient } from 'src/db/prismaClient';

@Injectable()
export class UserService {
  async findById(id: number): Promise<User> {
    const user = await prismaClient.user.findUnique({
      where: { id: id },
    });

    if (!user) {
      throw new NotFoundException('Користувача не існує');
    }

    return user;
  }

  async isExist(userId: number): Promise<boolean> {
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    return user !== null;
  }
}
