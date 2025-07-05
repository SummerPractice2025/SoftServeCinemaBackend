import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { User } from 'generated/prisma';
import { prismaClient } from 'src/db/prismaClient';
import { CreateUserDTO } from './dto/create-user.dto';

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

  async findByEmail(email: string): Promise<User | null> {
    const user = await prismaClient.user.findUnique({
      where: { email },
    });

    return user;
  }

  async createUser(dto: CreateUserDTO): Promise<User> {
    const user = await this.findByEmail(dto.email);

    if (user) {
      throw new ConflictException(`Email ${dto.email} вже зареєстровано.`);
    }

    return await prismaClient.user.create({ data: dto });
  }

  async verifyUser(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);

    if (!user) {
      return false;
    }

    await prismaClient.user.update({
      where: { email },
      data: { verified: true },
    });

    return true;
  }

  async isExist(userId: number): Promise<boolean> {
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    return user !== null;
  }
}
