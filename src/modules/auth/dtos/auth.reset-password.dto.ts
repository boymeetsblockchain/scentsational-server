import { IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';

export class AuthResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message:
      'Password must contain uppercase, lowercase, number and special character',
  })
  newPassword: string;
}
