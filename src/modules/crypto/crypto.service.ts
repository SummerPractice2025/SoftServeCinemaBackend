import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';

@Injectable()
export class CryptoService {
  generateSHA256HashBase64(text: string): string {
    return crypto.createHash('sha256').update(text).digest('base64');
  }

  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  async verifyPassword(
    passwordHash: string,
    plainPassword: string,
  ): Promise<boolean> {
    return await argon2.verify(passwordHash, plainPassword);
  }
}
