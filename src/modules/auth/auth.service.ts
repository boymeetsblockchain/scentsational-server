import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole } from 'generated/prisma/enums';
import { PrismaService } from '../global/prisma/prisma.service';
import { AuthUtilService } from './auth.utils.service';
import { CONFIGS } from 'src/configs';
import { generateRandomString } from '../global/utils/text';
import * as ms from 'ms';
import * as bcrypt from 'bcrypt';
import { User, UserToken } from 'generated/prisma/client';
import { AuthRegisterDto } from './dtos/auth.register.dto';
import { AuthLoginDto } from './dtos/auth.login.dto';
import { AuthVerifyEmailDto } from './dtos/auth.verify-email.dto';
import { AuthForgotPasswordDto } from './dtos/auth.forgot-password.dto';
import { AuthResetPasswordDto } from './dtos/auth.reset-password.dto';
import { AuthChangePasswordDto } from './dtos/auth.change-password.dto';
import { AuthRefreshDto } from './dtos/auth.refresh-token.dto';

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

    const { token } = await this._createToken({
      userId: user.id,
      tokenType: 'EMAIL_VERIFY',
      characterType: 'numeric',
      length: 4,
      expiration: ms('1h'),
      deleteExistingTokens: true,
    });

    console.log(`Email verification token for user ${user.id}: ${token}`);

    const { __access, __refresh } = this._generateAuthTokenPairs(
      user.id,
      user.type,
    );

    const { password, ...userWithoutPassword } = user;

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

  async requestVerifyEmail(user: Pick<User, 'id'>) {
    const isEmailVerified = await this.prismaClient.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    });

    if (isEmailVerified?.emailVerified)
      throw new BadRequestException('Email is already verified');

    const { token } = await this._createToken({
      userId: user.id,
      tokenType: 'email_verify',
      characterType: 'numeric',
      length: 4,
      expiration: ms('1h'),
      deleteExistingTokens: true,
    });

    console.log(`Email verification token for user ${user.id}: ${token}`);

    return {
      token,
    };
  }

  async verifyEmail(user: Pick<User, 'id'>, input: AuthVerifyEmailDto) {
    const isEmailVerified = await this.prismaClient.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    });

    if (isEmailVerified?.emailVerified)
      throw new BadRequestException('Email is already verified');

    const tokenDoc = await this.prismaClient.userToken.findFirst({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFY',
      },
    });

    if (!tokenDoc) {
      throw new BadRequestException('No verification token found');
    }

    await this._verifyToken(tokenDoc, input.token);

    await this.prismaClient.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    return {
      message: 'Email verified successfully',
    };
  }

  async forgotPassword(input: AuthForgotPasswordDto) {
    const user = await this.prismaClient.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      return {
        message: 'If the email exists, a password reset token will be sent',
      };
    }

    const { token } = await this._createToken({
      userId: user.id,
      tokenType: 'PASSWORD_RESET',
      characterType: 'numeric',
      length: 6,
      expiration: ms('1h'),
      deleteExistingTokens: true,
    });

    // TODO: Send email with reset token
    console.log(`Password reset token for ${input.email}: ${token}`);

    return {
      message: 'If the email exists, a password reset token will be sent',
    };
  }

  async resetPassword(input: AuthResetPasswordDto) {
    // Find the token
    const tokenDoc = await this.prismaClient.userToken.findFirst({
      where: {
        type: 'PASSWORD_RESET',
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!tokenDoc) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Verify the token
    await this._verifyToken(tokenDoc, input.token);

    // Update password
    const hashedPassword = await this.authUtil.hashPassword(input.newPassword);
    await this.prismaClient.user.update({
      where: { id: tokenDoc.userId },
      data: {
        password: hashedPassword,
        passwordUpdatedAt: new Date(),
      },
    });

    // Delete the used token
    await this.prismaClient.userToken.delete({
      where: { id: tokenDoc.id },
    });

    // Blacklist all refresh tokens for this user (optional security measure)
    await this.prismaClient.refreshTokenBlacklist.createMany({
      data: [],
    });

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: Pick<User, 'id'>, input: AuthChangePasswordDto) {
    const user = await this.prismaClient.user.findUnique({
      where: { id: userId.id },
      include: {
        userTokens: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.authUtil.verifyPassword(
      input.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is same as current password
    const isSamePassword = await this.authUtil.verifyPassword(
      input.newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as current password',
      );
    }

    // Update password
    const hashedPassword = await this.authUtil.hashPassword(input.newPassword);
    await this.prismaClient.user.update({
      where: { id: userId.id },
      data: {
        password: hashedPassword,
        passwordUpdatedAt: new Date(),
      },
    });

    // await this._blacklistRefreshToken(user.id);

    return { message: 'Password changed successfully' };
  }

  async logout(input: AuthRefreshDto) {
    const payload = await this._validateRefresh(input.refreshToken);

    // 1. blacklist refresh token
    await this._blacklistRefreshToken(payload.reference);

    return {};
  }

  async refresh(input: AuthRefreshDto) {
    const payload = await this._validateRefresh(input.refreshToken);

    // 1. blacklist refresh token
    await this._blacklistRefreshToken(payload.reference);

    // 2. generate new token pairs
    const tokens = this._generateAuthTokenPairs(payload.userId, payload.role);

    return tokens;
  }
}
