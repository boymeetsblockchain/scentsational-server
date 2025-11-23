import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { RequiresVerifiedEmail } from '../decorators/email-verified.decorator';
import { User } from 'generated/prisma/client';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(protected reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresVerifiedEmail =
      this.reflector.get<boolean>(
        RequiresVerifiedEmail,
        context.getHandler(),
      ) ?? false;

    const isActive = (await super.canActivate(context)) as boolean;
    if (!isActive) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (requiresVerifiedEmail && !user.emailVerified) {
      throw new UnauthorizedException('Email verification is required.');
    }

    return true;
  }
}
