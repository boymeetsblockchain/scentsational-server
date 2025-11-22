import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRegisterDto } from './dtos/auth.register.dto';
import { JwtGuard } from '../global/guards/jwt.guard';
import { AuthVerifyEmailDto } from './dtos/auth.verify-email.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() input: AuthRegisterDto) {
    return await this.authService.register(input);
  }

  @UseGuards(JwtGuard)
  @Post('verify-email')
  async verifyEmail(@Req() req: Request, @Body() input: AuthVerifyEmailDto) {
    return await this.authService.verifyEmail({ id: req?.user?.id! }, input);
  }
}
