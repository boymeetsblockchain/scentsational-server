import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole } from 'generated/prisma/enums';
import { PrismaService } from '../global/prisma/prisma.service';
import { AuthUtilService } from './auth.utils.service';
import { CONFIGS } from 'src/configs';
import { generateRandomString } from '../global/utils/text';
import * as ms from 'ms';
import * as bcrypt from 'bcrypt';
import { UserToken } from 'generated/prisma/browser';
import { AuthRegisterDto } from './dtos/auth.register.dto';
import { AuthLoginDto } from './dtos/auth.login.dto';

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

  // register

  async register(input: AuthRegisterDto) {
    const existingUser = await this.prismaClient.user.findFirst({
      where: {
        OR: [{ email: input.email }, { phoneNumber: input.phoneNumber }],
      },
    });

    if (existingUser) {
      // More specific error message
      if (existingUser.email === input.email) {
        throw new BadRequestException('Email already in use');
      } else {
        throw new BadRequestException('Phone number already in use');
      }
    }

    const hashedPassword = await this.authUtil.hashPassword(input.password);

    const user = await this.prismaClient.user.create({
      data: {
        email: input.email,
        phoneCountryCode: input.phoneCountryCode,
        phoneNumber: input.phoneNumber,
        password: hashedPassword,
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        displayName:
          input.displayName || `${input.firstName} ${input.lastName}`.trim(),
        lastLoginAt: new Date(),
        gender: input.gender,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        acceptsMarketing: input.acceptsMarketing ?? false,
        newsletterSubscribed: input.newsletterSubscribed ?? false,
        emailNotifications: input.emailNotifications ?? true,
        smsNotifications: input.smsNotifications ?? false,
      },
    });

    const { __access, __refresh } = this._generateAuthTokenPairs(
      user.id,
      user.type,
    );

    const { password, ...userWithoutPassword } = user;

    void password;
    return {
      user: userWithoutPassword,
      tokens: {
        accessToken: __access,
        refreshToken: __refresh,
      },
    };
  }

  async login(input: AuthLoginDto) {
    const user = await this.prismaClient.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await this.authUtil.verifyPassword(
      input.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    // Update last login
    await this.prismaClient.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { __access, __refresh } = this._generateAuthTokenPairs(
      user.id,
      user.type,
    );

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens: {
        accessToken: __access,
        refreshToken: __refresh,
      },
    };
  }
}
