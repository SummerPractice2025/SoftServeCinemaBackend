import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  generateSHA256HashBase64(text: string): string {
    return crypto.createHash('sha256').update(text).digest('base64');
  }
}
