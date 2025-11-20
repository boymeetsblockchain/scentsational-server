import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole } from 'generated/prisma/enums';
import { PrismaService } from '../global/prisma/prisma.service';
import { AuthUtilService } from './auth.utils.service';
import { CONFIGS } from 'src/configs';
import { generateRandomString } from '../global/utils/text';
import * as ms from 'ms';
import * as bcrypt from 'bcrypt';
import { UserToken } from 'generated/prisma/browser';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaClient: PrismaService,
    private readonly authUtil: AuthUtilService,
  ) {}

  private _generateAuthTokenPairs(userId: string, role: UserRole) {
    const __access = this.authUtil.generateJwtToken(
      { type: 'access', userId, role },
      ms(`${CONFIGS.ACCESS_TOKEN_LIFETIME_MINS}m`) / 1000,
    );

    const refreshReference = generateRandomString('alphanumeric', 10);

    const __refresh = this.authUtil.generateJwtToken(
      { type: 'refresh', userId, reference: refreshReference, role },
      ms(`${CONFIGS.REFRESH_TOKEN_LIFETIME_DAYS}d`) / 1000,
    );

    return {
      __access,
      __refresh,
    };
  }

  private async _validateRefresh(refreshToken: string) {
    // 1. validate token
    const payload = (await this.authUtil.verifyToken(refreshToken)) as {
      type: string;
      reference: string;
      userId: string;
      role: UserRole;
    };
    if (payload.type !== 'refresh')
      throw new BadRequestException('Invalid refresh token');

    if (!payload.reference)
      throw new BadRequestException('Invalid refresh token, missing reference');

    // 2. validate if blacklisted
    const refreshTokenBlackList =
      await this.prismaClient.refreshTokenBlacklist.findUnique({
        where: { reference: payload.reference },
      });

    if (refreshTokenBlackList)
      throw new BadRequestException(
        'Refresh token invalid, already blacklisted',
      );

    return payload;
  }

  private async _blacklistRefreshToken(reference: string) {
    await this.prismaClient.refreshTokenBlacklist.create({
      data: {
        reference: reference,
        expiresAt: new Date(
          Date.now() + ms(`${CONFIGS.REFRESH_TOKEN_LIFETIME_DAYS}d`),
        ),
      },
    });
  }

  private async _createToken({
    userId,
    tokenType,
    characterType = 'alphanumeric',
    expiration = ms('1h'),
    length = 6,
    deleteExistingTokens = true,
  }: ICreateTokenArgs) {
    const token = generateRandomString(characterType, length);

    // delete duplicate tokens
    if (deleteExistingTokens) {
      await this.prismaClient.userToken.deleteMany({
        where: {
          type: tokenType,
          userId,
        },
      });
    }
    // hashToken
    const salt = await bcrypt.genSalt();
    const hashed_token = await bcrypt.hash(token, salt);

    // token model creation
    const tokenDoc = await this.prismaClient.userToken.create({
      data: {
        type: tokenType,
        userId,
        token: hashed_token,
        expiresAt: new Date(Date.now() + expiration),
      },
    });

    // return token
    return {
      tokenDoc,
      token,
    };
  }

  private async _verifyToken(tokenDoc: UserToken, token: string) {
    // Check if token is expired
    if (tokenDoc.expiresAt < new Date()) {
      throw new BadRequestException('Token has expired');
    }

    // Check if token matches
    const isTokenValid = await bcrypt.compare(token, tokenDoc.token);
    if (!isTokenValid) {
      throw new BadRequestException('Invalid token');
    }
  }
}
