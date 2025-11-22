import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRegisterDto } from './dtos/auth.register.dto';
import { JwtGuard } from '../global/guards/jwt.guard';
import { AuthVerifyEmailDto } from './dtos/auth.verify-email.dto';
import { Request } from 'express';
import { AuthLoginDto } from './dtos/auth.login.dto';
import { AuthResetPasswordDto } from './dtos/auth.reset-password.dto';
import { AuthChangePasswordDto } from './dtos/auth.change-password.dto';
import { AuthRefreshDto } from './dtos/auth.refresh-token.dto';
import { AuthForgotPasswordDto } from './dtos/auth.forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() input: AuthRegisterDto) {
    return await this.authService.register(input);
  }

  @Post('login')
  async login(@Body() input: AuthLoginDto) {
    return await this.authService.login(input);
  }

  @UseGuards(JwtGuard)
  @Post('request-email-verification')
  async requestEmailVerification(@Req() req: Request) {
    return await this.authService.requestVerifyEmail({
      id: req?.user?.id!,
    });
  }

  @UseGuards(JwtGuard)
  @Post('verify-email')
  async verifyEmail(@Req() req: Request, @Body() input: AuthVerifyEmailDto) {
    return await this.authService.verifyEmail({ id: req?.user?.id! }, input);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() input: AuthForgotPasswordDto) {
    return await this.authService.forgotPassword(input);
  }

  @Post('reset-password')
  async resetPassword(@Body() input: AuthResetPasswordDto) {
    return await this.authService.resetPassword(input);
  }

  @UseGuards(JwtGuard)
  @Patch('change-password')
  async changePassword(
    @Req() req: Request,
    @Body() input: AuthChangePasswordDto,
  ) {
    return await this.authService.changePassword({ id: req?.user?.id! }, input);
  }

  @Post('refresh')
  async refresh(@Body() input: AuthRefreshDto) {
    return await this.authService.refresh(input);
  }

  @Post('logout')
  async logout(@Body() input: AuthRefreshDto) {
    return await this.authService.logout(input);
  }
}
