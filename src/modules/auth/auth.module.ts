import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { AccessTokenStrategy } from './strategies/AccessTokenStrategy';
import { CryptoModule } from '../crypto/crypto.module';
import { AuthTokenService } from './auth-token.service';
import { RefreshTokenStrategy } from './strategies/RefreshTokenStrategy';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    UserModule,
    CryptoModule,
    EmailModule,
    JwtModule.register({
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
  ],
})
export class AuthModule {}
