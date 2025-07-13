import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class VerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as { verified?: boolean };

    if (!user) {
      throw new ForbiddenException('User not found in request.');
    }

    if (!user.verified) {
      throw new ForbiddenException('User is not verified.');
    }

    return true;
  }
}
