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

// interface JwtPayload {
//   userId: string;
//   type?: string;
//   role?: string;
//   iat?: number;
//   exp?: number;
// }

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
//   private readonly logger = new Logger(JwtStrategy.name);

//   constructor(private readonly prismaClient: PrismaService) {
//     super({
//       jwtFromRequest: ExtractJwt.fromExtractors([
//         // 1. Check Authorization header first
//         ExtractJwt.fromAuthHeaderAsBearerToken(),
//         // 2. Fallback to cookie (if using cookies)
//         (req: Request) => req.cookies?.accessToken,
//         // 3. Fallback to query parameter (for specific use cases)
//         (req: Request) => req.query?.token as string,
//       ]),
//       ignoreExpiration: false,
//       secretOrKey: CONFIGS.JWT_SECRET,
//       audience: CONFIGS.JWT_AUDIENCE, // Add audience validation
//       issuer: CONFIGS.JWT_ISSUER, // Add issuer validation
//       passReqToCallback: true, // Pass request to validate method
//     });
//   }

//   async validate(req: Request, payload: JwtPayload) {
//     // Validate payload structure
//     if (!payload?.userId) {
//       this.logger.warn('JWT token missing userId');
//       throw new UnauthorizedException('Invalid token payload');
//     }

//     // Prevent refresh tokens from being used as access tokens
//     if (payload.type && payload.type !== 'access') {
//       this.logger.warn(`Attempt to use ${payload.type} token as access token`);
//       throw new UnauthorizedException('Invalid token type');
//     }

//     // Check token expiration manually (redundant but safe)
//     const currentTime = Math.floor(Date.now() / 1000);
//     if (payload.exp && payload.exp < currentTime) {
//       this.logger.warn('JWT token expired');
//       throw new UnauthorizedException('Token expired');
//     }

//     try {
//       // Fetch user with only necessary fields
//       const user = await this.prismaClient.user.findUnique({
//         where: { id: payload.userId },
//         select: {
//           id: true,
//           email: true,
//           firstName: true,
//           lastName: true,
//           type: true,
//           status: true,
//           emailVerified: true,
//           phoneVerified: true,
//           lastLoginAt: true,
//           // Exclude sensitive fields like password
//         },
//       });

//       if (!user) {
//         this.logger.warn(`User not found for userId: ${payload.userId}`);
//         throw new UnauthorizedException('User not found');
//       }

//       // Check if user account is active
//       if (user.status !== 'ACTIVE' && user.status !== 'EMAIL_VERIFIED') {
//         this.logger.warn(`User account is ${user.status}: ${user.id}`);
//         throw new UnauthorizedException('Account is not active');
//       }

//       // Add additional security checks
//       await this.performAdditionalSecurityChecks(user, req);

//       // Return user object that will be attached to request
//       return {
//         ...user,
//         // Add any additional properties you want in req.user
//         _strategy: 'jwt',
//         _tokenType: payload.type || 'access',
//       };
//     } catch (error) {
//       if (error instanceof UnauthorizedException) {
//         throw error;
//       }

//       this.logger.error(`JWT validation error: ${error.message}`, error.stack);
//       throw new UnauthorizedException('Token validation failed');
//     }
//   }

//   private async performAdditionalSecurityChecks(user: any, req: Request) {
//     // Check if password was recently changed (optional enhancement)
//     // You'll need to add passwordUpdatedAt field to your User model
//     /*
//     if (user.passwordUpdatedAt) {
//       const tokenIat = this.getTokenIat(req);
//       if (tokenIat && user.passwordUpdatedAt.getTime() > tokenIat * 1000) {
//         throw new UnauthorizedException('Password was changed, please login again');
//       }
//     }
//     */

//     // Check for suspicious login patterns (optional)
//     // Example: Detect if login from unusual location
//     const userAgent = req.headers['user-agent'];
//     const ip = req.ip || req.connection.remoteAddress;

//     this.logger.log(`User ${user.id} authenticated from IP: ${ip}, UA: ${userAgent?.substring(0, 50)}`);

//     // Update last activity timestamp (optional)
//     await this.updateLastActivity(user.id);
//   }

//   private getTokenIat(req: Request): number | null {
//     try {
//       const token = this.extractTokenFromRequest(req);
//       if (!token) return null;

//       const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
//       return payload.iat || null;
//     } catch {
//       return null;
//     }
//   }

//   private extractTokenFromRequest(req: Request): string | null {
//     const authHeader = req.headers.authorization;
//     if (authHeader && authHeader.startsWith('Bearer ')) {
//       return authHeader.substring(7);
//     }
//     return req.cookies?.accessToken || (req.query?.token as string) || null;
//   }

//   private async updateLastActivity(userId: string): Promise<void> {
//     try {
//       // Update last activity without blocking the request
//       this.prismaClient.user.update({
//         where: { id: userId },
//         data: { lastLoginAt: new Date() },
//       }).catch(err => {
//         this.logger.error(`Failed to update last activity for user ${userId}: ${err.message}`);
//       });
//     } catch (error) {
//       // Silent fail - don't break auth for activity tracking
//       this.logger.debug(`Last activity update failed for user ${userId}`);
//     }
//   }
// }
