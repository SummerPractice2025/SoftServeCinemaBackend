import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { SignUpRequestDTO } from './dto/add-user.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async signUp(dto: SignUpRequestDTO) {
    const passwordHash = this.hashPassword(dto.password);

    await this.userService.createUser({
      ...dto,
      password: passwordHash,
    });

    return 'Registered';
  }

  private hashPassword(plainPassword: string): string {
    return createHash('sha256').update(plainPassword).digest('hex');
  }
}
