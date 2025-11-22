import { IsEmail, IsNotEmpty } from 'class-validator';

export class AuthForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
