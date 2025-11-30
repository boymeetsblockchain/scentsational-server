import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPayment {
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;
}
