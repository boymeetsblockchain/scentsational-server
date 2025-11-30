import { IsNotEmpty, IsString } from 'class-validator';

export class InitializePayment {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}
