import { BadRequestException, Injectable } from '@nestjs/common';
import { SignInRequestDTO, SignUpRequestDTO } from './dto/user.dto';
import { UserService } from '../user/user.service';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly cryptoService: CryptoService,
  ) {}

  async signUp(dto: SignUpRequestDTO) {
    const passwordHash = this.cryptoService.generateSHA256HashBase64(
      dto.password,
    );

    await this.userService.createUser({
      ...dto,
      password: passwordHash,
    });

    return 'Registered';
  }

  async signIn(dto: SignInRequestDTO) {
    const user = await this.userService.findByEmail(dto.email);

    if (
      !user ||
      this.cryptoService.generateSHA256HashBase64(dto.password) != user.password
    ) {
      throw new BadRequestException(`Неправильний пароль або email.`);
    }

    return 'Signed in';
  }
}
