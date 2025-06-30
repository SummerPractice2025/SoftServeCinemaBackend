import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { AccessTokenStrategy } from './strategies/AccessTokenStrategy';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  imports: [
    UserModule,
    CryptoModule,
    JwtModule.register({
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy],
})
export class AuthModule {}
