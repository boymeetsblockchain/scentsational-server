import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { CONFIGS } from 'src/configs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prismaClient: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: CONFIGS.JWT_SECRET,
    });
  }

  async validate(payload: { userId: string }) {
    if (!payload?.userId) {
      throw new UnauthorizedException('Invalid token payload: userId missing');
    }

    // Fetch the user from the database using the provided userId
    const user = await this.prismaClient.user.findUnique({
      where: { id: payload.userId },
    });

    // If no user is found, reject the request
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
