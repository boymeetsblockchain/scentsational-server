import { IsString, MinLength, minLength } from 'class-validator';

export class AuthVerifyEmailDto {
  @IsString()
  @MinLength(4)
  token: string;
}
